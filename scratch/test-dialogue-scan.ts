import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { renderPdfToPng } from "E:/InternProjectV3/dangdai-app/app/api/admin/lessons/[id]/scan/_lib/pdf-renderer";
import path from "path";
import fs from "fs";

async function testDialogueScan() {
  console.log("=== TESTING DIALOGUE SCAN API LOGIC ===");
  const pdfPath = path.join(process.cwd(), "storage", "lessons", "1", "sgk.pdf");

  if (!fs.existsSync(pdfPath)) {
    console.log("File sgk.pdf not found at", pdfPath);
    process.exit(1);
  }

  const pngPages = await renderPdfToPng(pdfPath);
  console.log("Converted PDF pages:", pngPages.length);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY missing");
    process.exit(1);
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

  const PROMPT = `Extract all DIALOGUE (課文 / 對話 / Hội thoại) lines from these attached textbook pages.
Return ONLY JSON:
{
  "dialogues": [
    {
      "dialogue_order": 1,
      "lines": [
        {"line_order": 1, "speaker": "...", "hanzi": "...", "pinyin": "...", "vietnamese": "..."}
      ]
    }
  ]
}`;

  console.log("Calling Gemini API...");
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: [PROMPT, ...imageParts],
  });

  let text = (response.text || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
  }

  console.log("Gemini Output sample:");
  console.log(text.slice(0, 300));
  process.exit(0);
}

testDialogueScan().catch(console.error);
