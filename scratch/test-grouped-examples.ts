import { prisma } from "E:/InternProjectV3/dangdai-app/app/admin/db";
import { importGrammar } from "E:/InternProjectV3/dangdai-app/app/admin/lessons/[id]/import-actions";

async function testGroupedExamples() {
  console.log("=== TESTING GROUPED EXAMPLES IMPORT AND DB QUERY ===");
  const lessonId = 1;

  const sampleJsonGrouped = JSON.stringify([
    {
      order: 1,
      title: "A. Câu hỏi A 不 A",
      sections: [
        {
          tempId: "sec_1",
          parentTempId: null,
          order: 1,
          label: "Cấu trúc",
          level: "main",
          text: "Dùng để hỏi lựa chọn Yes/No.",
          examples: [
            {
              example_order: 1,
              sentences: [
                { hanzi: "他喝咖啡。", pinyin: "Tā hē kāfēi.", meaning_vi: "Anh ấy uống cà phê." },
                { hanzi: "他喝不喝咖啡？", pinyin: "Tā hē bù hē kāfēi?", meaning_vi: "Anh ấy có uống cà phê không?" },
              ],
            },
            {
              example_order: 2,
              sentences: [
                { hanzi: "你忙。 ", pinyin: "Nǐ máng.", meaning_vi: "Bạn bận." },
                { hanzi: "你忙不忙？", pinyin: "Nǐ máng bù máng?", meaning_vi: "Bạn có bận không?" },
              ],
            },
          ],
        },
      ],
    },
  ]);

  console.log("Importing Grouped Examples JSON...");
  const res = await importGrammar(lessonId, sampleJsonGrouped);
  console.log("Import Result:", res);

  const pointsInDb = await prisma.grammarPoint.findMany({
    where: { lessonId },
    include: {
      sections: {
        include: {
          examples: {
            orderBy: [{ groupOrder: "asc" }, { order: "asc" }],
          },
        },
      },
    },
  });

  console.log("\nQueried DB Grammar Points:");
  console.dir(pointsInDb, { depth: null });

  console.log("\n=== GROUPED EXAMPLES TEST COMPLETED SUCCESSFULLY ===");
  process.exit(0);
}

testGroupedExamples().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
