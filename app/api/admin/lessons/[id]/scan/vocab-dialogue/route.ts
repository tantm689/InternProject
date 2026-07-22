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

const VOCAB_DIALOGUE_PROMPT = `You are extracting content from a page of the Vietnamese-translated Chinese textbook "當代中文課程" (A Course in Contemporary Chinese / Giáo trình tiếng Trung đương đại).

From the attached page images (which together make up ONE lesson), extract:

1. VOCABULARY (from the "生詞 Từ mới" section(s)): every word with:
   - hanzi (traditional Chinese)
   - pinyin (with tone marks)
   - word_type (e.g. N, V, Vs, Adv, Ptc — as shown in parentheses, empty string if not shown)
   - meaning_vi (Vietnamese meaning)
   - example_sentence (if the book gives one, else empty string)

2. DIALOGUE (from "課文/對話 Hội thoại" section(s)): every line, in order, with:
   - dialogue_order (1 for first dialogue in the lesson, 2 for second, etc.)
   - line_order (1, 2, 3... within that dialogue)
   - speaker (the speaker's name as shown, e.g. "明華")
   - hanzi (the line in traditional Chinese)
   - pinyin (with tone marks — read this from a "Bính âm" block if the book separates pinyin from hanzi, or from interlinear pinyin if combined)
   - vietnamese (the Vietnamese translation of that line, matched by speaker order, from a "Bài khóa tiếng Việt" block if separated)

Do NOT extract images or image references. Do NOT extract "Hoạt động lớp học", "Văn hóa", or "Ngữ pháp" sections.
Do NOT include zhuyin.

Return ONLY valid JSON, no markdown code fences, no preamble, matching this shape:

{
  "vocabulary": [
    {"hanzi": "...", "pinyin": "...", "word_type": "...", "meaning_vi": "...", "example_sentence": "..."}
  ],
  "dialogues": [
    {
      "dialogue_order": 1,
      "lines": [
        {"line_order": 1, "speaker": "...", "hanzi": "...", "pinyin": "...", "vietnamese": "..."}
      ]
    }
  ]
}

If you are unsure about a field, leave it as an empty string rather than guessing.`;

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

    if (!lesson || !lesson.sgkCutPath) {
      return NextResponse.json(
        { error: "Chưa cắt file PDF cho SGK — vui lòng cắt PDF trước khi quét AI." },
        { status: 400 }
      );
    }

    const fullPdfPath = path.join(process.cwd(), lesson.sgkCutPath);
    if (!fs.existsSync(fullPdfPath)) {
      return NextResponse.json(
        { error: "File PDF đã cắt cho SGK không tồn tại trên hệ thống." },
        { status: 404 }
      );
    }

    // 1. Convert PDF pages to PNG image buffers via renderPdfToPng helper
    const pngPages = await renderPdfToPng(fullPdfPath);
    if (pngPages.length === 0) {
      return NextResponse.json({ error: "Không thể đọc nội dung trang từ file PDF SGK." }, { status: 400 });
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

    // Build image contents
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
      contents: [VOCAB_DIALOGUE_PROMPT, ...imageParts],
    });

    let text = (response.text || "").trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
    }

    let rawData: any;
    try {
      rawData = JSON.parse(text);
    } catch (parseErr: any) {
      console.error("Gemini Response parsing failed:", text);
      return NextResponse.json(
        { error: `Gemini trả về dữ liệu không phải JSON hợp lệ: ${parseErr.message}` },
        { status: 500 }
      );
    }

    // 4. Map to Prisma fields
    const mappedVocab = (rawData.vocabulary || []).map((v: any, index: number) => ({
      order: index + 1,
      hanzi: String(v.hanzi || "").trim(),
      pinyin: String(v.pinyin || "").trim(),
      meaningVi: String(v.meaning_vi || "").trim(),
      partOfSpeech: v.word_type ? String(v.word_type).trim() : null,
      exampleHanzi: v.example_sentence ? String(v.example_sentence).trim() : null,
      examplePinyin: null,
      exampleVi: null,
    }));

    const mappedDialogue: any[] = [];
    const rawDialogues = rawData.dialogues || rawData.dialogue;

    if (Array.isArray(rawDialogues)) {
      rawDialogues.forEach((d: any, dIdx: number) => {
        if (d.lines && Array.isArray(d.lines)) {
          // Nested lines format
          const dNum = parseInt(d.dialogue_order || d.dialogueNumber, 10) || dIdx + 1;
          d.lines.forEach((l: any, lIndex: number) => {
            mappedDialogue.push({
              dialogueNumber: dNum,
              lineOrder: parseInt(l.line_order || l.lineOrder, 10) || lIndex + 1,
              speaker: l.speaker ? String(l.speaker).trim() : null,
              hanzi: String(l.hanzi || "").trim(),
              pinyin: String(l.pinyin || "").trim(),
              meaningVi: String(l.vietnamese || l.meaning_vi || l.meaningVi || "").trim(),
              audioUrl: null,
            });
          });
        } else if (d.hanzi || d.meaning_vi || d.vietnamese) {
          // Flat line format
          mappedDialogue.push({
            dialogueNumber: parseInt(d.dialogueNumber || d.dialogue_order, 10) || 1,
            lineOrder: parseInt(d.lineOrder || d.line_order, 10) || dIdx + 1,
            speaker: d.speaker ? String(d.speaker).trim() : null,
            hanzi: String(d.hanzi || "").trim(),
            pinyin: String(d.pinyin || "").trim(),
            meaningVi: String(d.vietnamese || d.meaning_vi || d.meaningVi || "").trim(),
            audioUrl: null,
          });
        }
      });
    }

    return NextResponse.json({
      vocabulary: mappedVocab,
      dialogue: mappedDialogue,
      dialogues: mappedDialogue,
    });
  } catch (error: any) {
    console.error("Scan Vocab/Dialogue Error:", error);
    return NextResponse.json(
      { error: error.message || "Đã xảy ra lỗi khi quét AI từ vựng & hội thoại." },
      { status: 500 }
    );
  }
}
