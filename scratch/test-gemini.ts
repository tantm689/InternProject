import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function testGemini() {
  console.log("Testing GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: ["Say 'Hello from Gemini' if working."],
  });
  console.log("Response text:", response.text);
  process.exit(0);
}

testGemini().catch((err) => {
  console.error("Gemini Error:", err);
  process.exit(1);
});
