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

const GRAMMAR_PROMPT = `Bạn đang trích xuất phần NGỮ PHÁP từ trang sách "當代中文課程" (Giáo trình tiếng Trung đương đại) bản dịch tiếng Việt.

Từ các ảnh trang đính kèm (thuộc về 1 bài học), trích xuất TOÀN BỘ nội dung mục ngữ pháp của bài (thường đánh số La Mã I, II, III... hoặc 1, 2, 3...) — KHÔNG bỏ sót, KHÔNG tóm tắt.

YÊU CẦU BẮT BUỘC VỀ ĐỘ ĐẦY ĐỦ:
- MỖI section PHẢI có đủ "text" (đoạn giải thích) nếu ảnh có hiển thị đoạn văn đó — TUYỆT ĐỐI KHÔNG được để trống "text" nếu trong ảnh có chữ giải thích, dù ngắn.
- MỖI section PHẢI liệt kê ĐẦY ĐỦ tất cả câu ví dụ xuất hiện trong ảnh cho section đó.
- Trước khi trả kết quả, tự rà lại: nếu 1 section có ít text/examples hơn hẳn các section khác trong khi ảnh gốc không cho thấy nó ngắn hơn, đó là dấu hiệu bạn đã bỏ sót — hãy đọc lại ảnh và bổ sung.

XỬ LÝ CHỮ NHỎ/MỜ/DÍNH NÉT (như các trợ từ 呢, 嗎, 吧, phiên âm đi kèm...):
- Một số chữ Hán nhỏ hoặc phiên âm chú thích trong ảnh có thể bị mờ hoặc các nét dính vào nhau do độ phân giải ảnh. Hãy dựa vào NGỮ CẢNH CÂU và QUY TẮC NGỮ PHÁP tiếng Trung để suy luận đúng ký tự, thay vì chỉ dựa vào hình dạng nét chữ đơn thuần. Nếu không chắc chắn 100%, vẫn đưa ra suy đoán hợp lý nhất theo ngữ cảnh, KHÔNG được bỏ trống hay ghi ký tự sai lệch hoàn toàn.

QUAN TRỌNG VỀ BẮT BÚOC TRÍCH XUẤT ĐỦ TẤT CẢ CÁC TIÊU ĐỀ IN ĐẬM/CÓ MÀU (KHÔNG ĐƯỢC BỎ BỚT TIÊU ĐỀ NÀO):
- BẤT KỲ tiêu đề in đậm, có màu, hoặc đánh số nào trong sách (ví dụ: "Chức năng:", "Cấu trúc:", "Thông thường:", "Phủ định:", "Lưu ý:", "Câu hỏi:", "1. Tân ngữ...", "2. Chủ ngữ...") BẮT BUỘC PHẢI TRÍCH XUẤT THÀNH 1 SECTION RIÊNG BIỆT TRONG MẢNG SECTIONS.
- TUYỆT ĐỐI KHÔNG ĐƯỢC BỎ BỚT HOẶC NUỐT MẤT BẤT KỲ TIÊU ĐỀ NÀO TRONG SÁCH. Mỗi tiêu đề như "Chức năng:", "Cấu trúc:", "Thông thường:", "Phủ định:", "Lưu ý:"... BẮT BUỘC phải tạo section riêng có label tương ứng.
- Đoạn văn/giải thích đi ngay sau tiêu đề đó (ví dụ: '"A" trong cấu trúc đề cập đến thành phần động từ đầu tiên.') PHẢI nằm trong trường "text" của section đó.
- Các câu ví dụ khoanh tròn (1), (2), (3)... đứng ngay bên dưới tiêu đề nào PHẢI thuộc mảng "examples" của section mang tiêu đề đó (bắt đầu đánh số từ example_order: 1 cho section đó).
- TẤT CẢ CÁC SECTION ĐỀU LÀ NGANG HÀNG NHAU (cấp "main", "parent_temp_id": null).

TUYỆT ĐỐI KHÔNG GỘP CÁC CÂU VÍ DỤ VÀO TRƯỜNG "text":
- Trường "text" CHỈ dành cho lời giải thích văn xuôi hoặc công thức ngắn (ví dụ: "S1 V O, S2 呢 ne?").
- TẤT CẢ các câu ví dụ (có số khoanh tròn (1), (2)..., chữ Hán, phiên âm, dịch tiếng Việt) BẮT BUỘC PHẢI trích xuất vào mảng "examples". TUYỆT ĐỐI KHÔNG được dán/gộp các câu ví dụ này vào trong chuỗi "text" tạo thành 1 đoạn văn dài rối mắt!

QUAN TRỌNG VỀ SỐ THỨ TỰ VÍ DỤ: sách thường đánh SỐ CHUNG cho một NHÓM câu liên quan (ví dụ: câu khẳng định + câu hỏi A-不-A tương ứng của nó dùng CHUNG 1 số thứ tự khoanh tròn, đặt cạnh nhau theo hàng ngang). Hãy nhận diện đúng nhóm này theo SỐ ĐÁNH DẤU (icon số tròn) thực tế trong ảnh — KHÔNG tự tách mỗi câu thành 1 số riêng nếu sách gộp chung 1 số cho nhiều câu.

Với mỗi section, trả về examples là danh sách các NHÓM, mỗi nhóm có:
- example_order: số thứ tự nhóm (theo đúng số khoanh tròn trong sách)
- sentences: danh sách 1 hoặc nhiều câu thuộc nhóm này, mỗi câu gồm hanzi, pinyin, meaning_vi (và speaker nếu có hội thoại A/B)

Ví dụ: nếu sách đánh số 1 cho cặp '他喝咖啡。' + '他喝不喝咖啡？', trả về 1 phần tử example_order=1 với sentences là mảng 2 câu đó — KHÔNG tách thành example_order=1 và example_order=2 riêng biệt.

VỀ TIÊU ĐỀ (title_zh, title_vi): nếu tiêu đề trong sách CHỈ có 1 ngôn ngữ (ví dụ chỉ có tiêu đề tiếng Việt, không có tiêu đề chữ Hán riêng cho điểm ngữ pháp đó), thì CHỈ điền vào title_vi và để title_zh là chuỗi rỗng "" — KHÔNG được chép lại title_vi vào cả title_zh (tránh tạo tiêu đề trùng lặp). Giữ nguyên số thứ tự/ký hiệu gốc của sách (ví dụ "I.", "II.", "A.", "B.") ngay trong title_vi/title_zh nếu sách có đánh số kiểu đó.

Với MỖI điểm ngữ pháp, trả về:
- point_order: số thứ tự (1, 2, 3...)
- title_zh: tiêu đề tiếng Trung (ví dụ "去 qù", nếu không có chữ Hán riêng thì để "")
- title_vi: tiêu đề dịch tiếng Việt (ví dụ "I. Đi đâu làm gì")
- sections: danh sách các section đồng cấp (ngang hàng). Mỗi section gồm:
    - temp_id: chuỗi ID tạm duy nhất (ví dụ "sec_1")
    - parent_temp_id: null (luôn là null)
    - label: tên tiêu đề ngắn (ví dụ "1. Tân ngữ giống nhau, chủ ngữ khác nhau", "Phủ định", "Cấu trúc", "Chức năng"). TUYỆT ĐỐI KHÔNG dán công thức (như "S1 V O, S2 呢 ne?") vào "label".
    - text: đoạn giải thích văn xuôi hoặc CÔNG THỨC đi kèm (ví dụ: "S1 V O, S2 呢 ne?"). Để trống CHỈ KHI ảnh thực sự không có nội dung nào.
    - examples: danh sách các nhóm ví dụ:
        [
          {
            "example_order": 1,
            "sentences": [
              {"hanzi": "...", "pinyin": "...", "meaning_vi": "..."}
            ]
          }
        ]

Do NOT include zhuyin.
Trả về CHỈ JSON hợp lệ, không markdown code fence, không lời mở đầu:

{
  "grammar_points": [
    {
      "point_order": 1,
      "title_zh": "...",
      "title_vi": "...",
      "sections": [
        {
          "temp_id": "sec_1",
          "parent_temp_id": null,
          "label": "...",
          "text": "...",
          "examples": [
            {
              "example_order": 1,
              "sentences": [
                {"hanzi": "...", "pinyin": "...", "meaning_vi": "..."}
              ]
            }
          ]
        }
      ]
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
      contents: [GRAMMAR_PROMPT, ...imageParts],
    });

    let text = (response.text || "").trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
    }

    let rawData: any;
    try {
      rawData = JSON.parse(text);
    } catch (parseErr: any) {
      console.error("Gemini Grammar Response parsing failed:", text);
      return NextResponse.json(
        { error: `Gemini trả về dữ liệu không phải JSON hợp lệ: ${parseErr.message}` },
        { status: 500 }
      );
    }

    // 4. Map to Prisma Grammar Point format
    const mappedGrammar = (rawData.grammar_points || []).map((gp: any, gpIdx: number) => {
      const titleZh = String(gp.title_zh || "").trim();
      const titleVi = String(gp.title_vi || "").trim();
      const fullTitle =
        titleZh && titleVi && titleZh !== titleVi
          ? `${titleZh} (${titleVi})`
          : titleZh || titleVi;

      const sections = (gp.sections || []).map((sec: any, secIdx: number) => {
        // Handle grouped examples with { example_order, sentences } OR fallback flat examples
        const examples = (sec.examples || []).map((exGroup: any, exIdx: number) => {
          if (exGroup.sentences && Array.isArray(exGroup.sentences)) {
            return {
              order: parseInt(exGroup.example_order, 10) || exIdx + 1,
              sentences: exGroup.sentences.map((s: any) => ({
                speaker: s.speaker ? String(s.speaker).trim() : null,
                hanzi: String(s.hanzi || "").trim(),
                pinyin: String(s.pinyin || "").trim(),
                meaningVi: String(s.meaning_vi || s.meaningVi || "").trim(),
              })),
            };
          }
          return {
            order: parseInt(exGroup.example_order || exGroup.order, 10) || exIdx + 1,
            sentences: [
              {
                speaker: exGroup.speaker ? String(exGroup.speaker).trim() : null,
                hanzi: String(exGroup.hanzi || "").trim(),
                pinyin: String(exGroup.pinyin || "").trim(),
                meaningVi: String(exGroup.meaning_vi || exGroup.meaningVi || "").trim(),
              },
            ],
          };
        });

        return {
          tempId: String(sec.temp_id || `sec_${gpIdx}_${secIdx}`),
          parentTempId: null,
          order: secIdx + 1,
          label: String(sec.label || "").trim(),
          level: "main",
          text: String(sec.text || "").trim(),
          examples: examples,
        };
      });

      return {
        order: parseInt(gp.point_order, 10) || gpIdx + 1,
        title: fullTitle,
        sections: sections,
      };
    });

    return NextResponse.json({
      grammarPoints: mappedGrammar,
    });
  } catch (error: any) {
    console.error("Scan Grammar Error:", error);
    return NextResponse.json(
      { error: error.message || "Đã xảy ra lỗi khi quét AI điểm ngữ pháp." },
      { status: 500 }
    );
  }
}
