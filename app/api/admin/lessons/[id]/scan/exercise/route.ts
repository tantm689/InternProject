import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/app/admin/db";
import { renderPdfToPng } from "../_lib/pdf-renderer";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const EXERCISE_PROMPT = `Bạn đang trích xuất phần BÀI TẬP từ các trang sách bài tập (SBT) "當代中文課程" (Giáo trình tiếng Trung đương đại).

Từ các ảnh trang đính kèm (thuộc phần bài tập của 1 bài học trong SBT), trích xuất TOÀN BỘ các câu hỏi bài tập.

YÊU CẦU:
1. Chia nhóm bài tập theo các mục/section hiển thị trong sách (ví dụ: "Nghe hiểu", "Đọc hiểu", "Viết", "Điền từ", "Dịch câu"...).
2. Với MỖI câu hỏi bài tập, trích xuất:
   - section: tên mục/phần bài tập (ví dụ "Nghe hiểu", "Viết"...)
   - order: số thứ tự của câu hỏi trong mục đó (1, 2, 3...)
   - question_hanzi: đề bài hoặc nội dung câu hỏi bằng chữ Hán (nếu có, để trống nếu không có)
   - question_vi: đề bài hoặc gợi ý bằng tiếng Việt (nếu có, để trống nếu không có)

LƯU Ý: KHÔNG cần trích xuất đáp án hay giải thích (người dùng sẽ tự dò đáp án).

Trả về CHỈ JSON hợp lệ, không markdown code fence, không lời mở đầu:

{
  "exercises": [
    {
      "section": "...",
      "order": 1,
      "question_hanzi": "...",
      "question_vi": "..."
    }
  ]
}`;

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const lessonId = parseInt(id, 10);

    if (isNaN(lessonId)) {
      return NextResponse.json({ error: "Lesson ID không hợp lệ." }, { status: 400 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || !lesson.sbtCutPath) {
      return NextResponse.json(
        { error: "Chưa cắt file PDF bài tập SBT — vui lòng cắt PDF SBT trước khi quét AI." },
        { status: 400 }
      );
    }

    const fullPdfPath = path.join(process.cwd(), lesson.sbtCutPath);
    if (!fs.existsSync(fullPdfPath)) {
      return NextResponse.json(
        { error: "File PDF đã cắt cho SBT không tồn tại trên hệ thống." },
        { status: 404 }
      );
    }

    // 1. Convert PDF pages to PNG image buffers via renderPdfToPng helper
    const pngPages = await renderPdfToPng(fullPdfPath);
    if (pngPages.length === 0) {
      return NextResponse.json({ error: "Không thể đọc nội dung trang từ file PDF SBT." }, { status: 400 });
    }

    // 2. Initialize Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chưa cấu hình GEMINI_API_KEY trong file .env." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const imageParts = pngPages
      .filter((page) => page.content)
      .map((page) => ({
        inlineData: {
          mimeType: "image/png",
          data: page.content!.toString("base64"),
        },
      }));

    // 3. Call Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [EXERCISE_PROMPT, ...imageParts],
    });

    let text = (response.text || "").trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
    }

    let rawData: any;
    try {
      rawData = JSON.parse(text);
    } catch (parseErr: any) {
      console.error("Gemini Exercise Response parsing failed:", text);
      return NextResponse.json(
        { error: `Gemini trả về dữ liệu không phải JSON hợp lệ: ${parseErr.message}` },
        { status: 500 }
      );
    }

    // 4. Map to Exercise format
    const rawList = Array.isArray(rawData)
      ? rawData
      : rawData.exercises || rawData.exercise || [];

    const mappedExercises = rawList.map((ex: any, index: number) => ({
      section: String(ex.section || "Bài tập").trim(),
      order: parseInt(ex.order, 10) || index + 1,
      questionHanzi: ex.question_hanzi ? String(ex.question_hanzi).trim() : null,
      questionVi: ex.question_vi ? String(ex.question_vi).trim() : null,
      answer: "",
      explanation: null,
    }));

    return NextResponse.json({
      exercise: mappedExercises,
    });
  } catch (error: any) {
    console.error("Scan Exercise Error:", error);
    return NextResponse.json(
      { error: error.message || "Đã xảy ra lỗi khi quét AI bài tập SBT." },
      { status: 500 }
    );
  }
}
