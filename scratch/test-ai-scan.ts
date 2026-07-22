import "dotenv/config";
import { POST as scanVocabDiag } from "E:/InternProjectV3/dangdai-app/app/api/admin/lessons/[id]/scan/vocab-dialogue/route";
import { POST as scanGrammar } from "E:/InternProjectV3/dangdai-app/app/api/admin/lessons/[id]/scan/grammar/route";
import { NextRequest } from "next/server";

async function testAiScan() {
  console.log("=== TESTING AI SCAN API ROUTES FOR LESSON 1 ===");

  const req = new NextRequest("http://localhost:3000/api/admin/lessons/1/scan/vocab-dialogue", {
    method: "POST",
  });
  const params = Promise.resolve({ id: "1" });

  console.log("\n1. Testing Scan Vocab & Dialogue...");
  const res1 = await scanVocabDiag(req, { params });
  const data1 = await res1.json();
  console.log("Vocab & Dialogue Result Status:", res1.status);
  console.log("Vocab Count Extracted:", data1.vocabulary?.length || 0);
  console.log("Dialogue Count Extracted:", data1.dialogue?.length || 0);
  if (data1.vocabulary && data1.vocabulary.length > 0) {
    console.log("Sample Vocab item:", data1.vocabulary[0]);
  }
  if (data1.dialogue && data1.dialogue.length > 0) {
    console.log("Sample Dialogue item:", data1.dialogue[0]);
  }

  console.log("\n2. Testing Scan Grammar...");
  const req2 = new NextRequest("http://localhost:3000/api/admin/lessons/1/scan/grammar", {
    method: "POST",
  });
  const res2 = await scanGrammar(req2, { params });
  const data2 = await res2.json();
  console.log("Grammar Result Status:", res2.status);
  console.log("Grammar Points Count Extracted:", data2.grammarPoints?.length || 0);
  if (data2.grammarPoints && data2.grammarPoints.length > 0) {
    console.log("Sample Grammar Point item:", JSON.stringify(data2.grammarPoints[0], null, 2));
  }

  process.exit(0);
}

testAiScan().catch((err) => {
  console.error("AI Scan Test Error:", err);
  process.exit(1);
});
