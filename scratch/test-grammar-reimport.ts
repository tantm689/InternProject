import { importGrammar } from "E:/InternProjectV3/dangdai-app/app/admin/lessons/[id]/import-actions";
import { prisma } from "E:/InternProjectV3/dangdai-app/app/admin/db";

async function testReimport() {
  console.log("=== TESTING GRAMMAR RE-IMPORT DELETION ===");
  const lessonId = 1;

  const sampleJson1 = JSON.stringify([
    {
      order: 1,
      title: "Batch 1: Ngữ pháp 1",
      sections: [
        {
          tempId: "s1",
          parentTempId: null,
          order: 1,
          label: "Cấu trúc",
          level: "main",
          text: "Mẫu câu 1",
          examples: [{ order: 1, hanzi: "例1", pinyin: "lì1", meaningVi: "Ví dụ 1" }],
        },
        {
          tempId: "s2",
          parentTempId: "s1",
          order: 1,
          label: "Phủ định",
          level: "sub",
          text: "Mẫu câu 2",
          examples: [{ order: 1, hanzi: "例2", pinyin: "lì2", meaningVi: "Ví dụ 2" }],
        },
      ],
    },
  ]);

  console.log("Importing Batch 1...");
  const res1 = await importGrammar(lessonId, sampleJson1);
  console.log("Batch 1 Result:", res1);

  const sampleJson2 = JSON.stringify([
    {
      order: 1,
      title: "Batch 2: Ngữ pháp mới đã ghi đè",
      sections: [
        {
          tempId: "s1_new",
          parentTempId: null,
          order: 1,
          label: "Cấu trúc mới",
          level: "main",
          text: "Mẫu câu mới",
          examples: [],
        },
      ],
    },
  ]);

  console.log("Importing Batch 2 (Re-import over Batch 1)...");
  const res2 = await importGrammar(lessonId, sampleJson2);
  console.log("Batch 2 Result:", res2);

  const pointsInDb = await prisma.grammarPoint.findMany({
    where: { lessonId },
    include: { sections: { include: { examples: true } } },
  });

  console.log("DB Grammar Points after Batch 2:", JSON.stringify(pointsInDb, null, 2));
  console.log("=== GRAMMAR RE-IMPORT TEST COMPLETED SUCCESSFULLY ===");
  process.exit(0);
}

testReimport().catch((err) => {
  console.error("Grammar reimport error:", err);
  process.exit(1);
});
