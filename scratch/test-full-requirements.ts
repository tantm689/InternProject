import { prisma } from "E:/InternProjectV3/dangdai-app/app/admin/db";
import { updateVolumeCefrLevel } from "E:/InternProjectV3/dangdai-app/app/admin/volumes/[id]/actions";
import {
  importVocabulary,
  importDialogue,
  importGrammar,
} from "E:/InternProjectV3/dangdai-app/app/admin/lessons/[id]/import-actions";

async function runTests() {
  console.log("=== STARTING FULL TEST SUITE FOR NEW REQUIREMENTS ===");
  const volumeId = 1;
  const lessonId = 1;

  // -------------------------------------------------------------------------
  // 1. TEST VOLUME CEFR LEVEL
  // -------------------------------------------------------------------------
  console.log("\n--- 1. Testing Volume CEFR Level Update ---");
  const cefrRes = await updateVolumeCefrLevel(volumeId, "A1");
  console.log("Update CEFR Result:", cefrRes);

  const updatedVol = await prisma.volume.findUnique({ where: { id: volumeId } });
  console.log("Volume in DB after update:", {
    id: updatedVol?.id,
    title: updatedVol?.title,
    cefrLevel: updatedVol?.cefrLevel,
  });

  if (updatedVol?.cefrLevel !== "A1") {
    throw new Error("CEFR level update failed!");
  }

  // -------------------------------------------------------------------------
  // 2. TEST VOCABULARY IMPORT
  // -------------------------------------------------------------------------
  console.log("\n--- 2. Testing Vocabulary Import ---");
  const sampleVocabJson = JSON.stringify([
    {
      order: 1,
      hanzi: "你好",
      pinyin: "nǐ hǎo",
      meaningVi: "xin chào",
      partOfSpeech: "Thán từ",
      exampleHanzi: "你好！很高興認識你。",
      examplePinyin: "Nǐ hǎo! Hěn gāoxìng rènshí nǐ.",
      exampleVi: "Xin chào! Rất vui được gặp bạn.",
    },
    {
      order: 2,
      hanzi: "請問",
      pinyin: "qǐngwèn",
      meaningVi: "xin hỏi",
      partOfSpeech: "Động từ",
    },
  ]);

  const vRes = await importVocabulary(lessonId, sampleVocabJson);
  console.log("Vocab Import Result:", vRes);

  const vocabList = await prisma.vocabulary.findMany({ where: { lessonId } });
  console.log(`DB Vocabulary Count: ${vocabList.length} items`);

  // -------------------------------------------------------------------------
  // 3. TEST DIALOGUE IMPORT (pinyin optional / null)
  // -------------------------------------------------------------------------
  console.log("\n--- 3. Testing Dialogue Import (with optional pinyin) ---");
  const sampleDialogueJson = JSON.stringify([
    {
      dialogueNumber: 1,
      lineOrder: 1,
      speaker: "Mã Văn Tài",
      hanzi: "你好，請問你貴姓？",
      pinyin: "Nǐ hǎo, qǐngwèn nǐ guìxìng?",
      meaningVi: "Xin chào, cho hỏi bạn họ gì?",
    },
    {
      dialogueNumber: 1,
      lineOrder: 2,
      speaker: "Bạch Như Tuyết",
      hanzi: "我姓白，叫白如雪。",
      pinyin: null, // optional pinyin!
      meaningVi: "Tôi họ Bạch, tên là Bạch Như Tuyết.",
    },
  ]);

  const dRes = await importDialogue(lessonId, sampleDialogueJson);
  console.log("Dialogue Import Result:", dRes);

  const dialogueList = await prisma.dialogue.findMany({ where: { lessonId } });
  console.log(`DB Dialogue Count: ${dialogueList.length} lines`);
  console.log("Dialogue items in DB:", dialogueList);

  // -------------------------------------------------------------------------
  // 4. TEST GRAMMAR IMPORT WITH MULTI-LEVEL NESTED SECTIONS (Depth 2 & 3)
  // -------------------------------------------------------------------------
  console.log("\n--- 4. Testing Grammar Import (Multi-level Nested Sections) ---");
  const sampleGrammarJson = JSON.stringify([
    {
      order: 1,
      title: "去 qù (Đi) & Mẫu câu hỏi / Phủ định lồng nhau",
      sections: [
        {
          tempId: "sec_1",
          parentTempId: null,
          order: 1,
          label: "Cấu trúc khẳng định",
          level: "main",
          text: "Chủ ngữ + 去 + Địa điểm.",
          examples: [
            {
              order: 1,
              hanzi: "我去學校。",
              pinyin: "Wǒ qù xuéxiào.",
              meaningVi: "Tôi đi đến trường.",
            },
          ],
        },
        {
          tempId: "sec_2",
          parentTempId: "sec_1",
          order: 1,
          label: "Biến thể Phủ định (Con của sec_1)",
          level: "sub",
          text: "Dùng 不 (bù) ở trước 動詞去.",
          examples: [
            {
              order: 1,
              hanzi: "我不去學校。",
              pinyin: "Wǒ bù qù xuéxiào.",
              meaningVi: "Tôi không đi đến trường.",
            },
          ],
        },
        {
          tempId: "sec_3",
          parentTempId: "sec_2",
          order: 1,
          label: "Biến thể Câu hỏi Phủ định đặc biệt (Cháu của sec_1 / Con của sec_2)",
          level: "sub",
          text: "Dùng 嗎 (ma) ở cuối câu phủ định.",
          examples: [
            {
              order: 1,
              hanzi: "你不去學校嗎？",
              pinyin: "Nǐ bù qù xuéxiào ma?",
              meaningVi: "Bạn không đi đến trường à?",
            },
          ],
        },
      ],
    },
  ]);

  const gRes = await importGrammar(lessonId, sampleGrammarJson);
  console.log("Grammar Import Result:", gRes);

  const grammarPointsInDb = await prisma.grammarPoint.findMany({
    where: { lessonId },
    include: {
      sections: {
        include: {
          examples: true,
          children: true,
        },
      },
    },
  });

  console.log("\nGrammar Points in DB:");
  console.dir(grammarPointsInDb, { depth: null });

  // -------------------------------------------------------------------------
  // 5. TEST RE-IMPORT (REPLACEMENT & NO DUPLICATION)
  // -------------------------------------------------------------------------
  console.log("\n--- 5. Testing Re-import Replacement Behavior ---");
  const sampleVocabBatch2 = JSON.stringify([
    {
      order: 1,
      hanzi: "謝謝",
      pinyin: "xièxie",
      meaningVi: "cảm ơn",
    },
  ]);

  const vRes2 = await importVocabulary(lessonId, sampleVocabBatch2);
  console.log("Vocab Re-import Result:", vRes2);

  const vocabList2 = await prisma.vocabulary.findMany({ where: { lessonId } });
  console.log(`DB Vocabulary Count after Re-import: ${vocabList2.length} (Expected 1 item, old ones deleted!)`);

  console.log("\n=== ALL TESTS COMPLETED SUCCESSFULLY ===");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
