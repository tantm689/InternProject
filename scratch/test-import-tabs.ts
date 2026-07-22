import {
  importVocabulary,
  importDialogue,
} from "E:/InternProjectV3/dangdai-app/app/admin/lessons/[id]/import-actions";
import { prisma } from "E:/InternProjectV3/dangdai-app/app/admin/db";

async function testImportTabs() {
  console.log("=== STARTING IMPORT TABS TEST ===");
  const lessonId = 1;

  // -----------------------------------------------------------------------
  // 1. TEST VOCABULARY IMPORT
  // -----------------------------------------------------------------------
  console.log("\n--- 1. Testing Vocabulary Import ---");
  const vocabJsonBatch1 = JSON.stringify([
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

  const resVocab1 = await importVocabulary(lessonId, vocabJsonBatch1);
  console.log("Vocab Batch 1 Result:", resVocab1);

  const dbVocab1 = await prisma.vocabulary.findMany({ where: { lessonId } });
  console.log(`DB Vocab count after Batch 1: ${dbVocab1.length} (Expected 2)`);

  // -----------------------------------------------------------------------
  // 2. TEST DIALOGUE IMPORT (pinyin optional)
  // -----------------------------------------------------------------------
  console.log("\n--- 2. Testing Dialogue Import ---");
  const dialogueJsonBatch1 = JSON.stringify([
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
      pinyin: null, // optional pinyin
      meaningVi: "Tôi họ Bạch, tên là Bạch Như Tuyết.",
    },
  ]);

  const resDiag1 = await importDialogue(lessonId, dialogueJsonBatch1);
  console.log("Dialogue Batch 1 Result:", resDiag1);

  const dbDiag1 = await prisma.dialogue.findMany({ where: { lessonId } });
  console.log(`DB Dialogue count after Batch 1: ${dbDiag1.length} (Expected 2)`);

  console.log("\n=== ALL TESTS COMPLETED SUCCESSFULLY ===");
  process.exit(0);
}

testImportTabs().catch((err) => {
  console.error("Test import failed:", err);
  process.exit(1);
});
