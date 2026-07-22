import { prisma } from "E:/InternProjectV3/dangdai-app/app/admin/db";
import { importGrammar } from "E:/InternProjectV3/dangdai-app/app/admin/lessons/[id]/import-actions";

async function restoreFull4Points() {
  console.log("=== RESTORING FULL 4 GRAMMAR POINTS FOR LESSON 1 ===");
  const lessonId = 1;

  const full4PointsJson = JSON.stringify([
    {
      order: 1,
      title: "I. Cách đặt câu hỏi bằng tiếng Trung",
      sections: [
        {
          tempId: "sec_1",
          parentTempId: null,
          order: 1,
          label: "A. Câu hỏi với A 不 A",
          level: "main",
          text: "Chức năng: Dạng câu hỏi A 不 A là câu hỏi chính phản trong tiếng Trung, tương đương với dạng câu hỏi '(có) ... (hay) không' trong tiếng Việt.",
          examples: [
            {
              example_order: 1,
              sentences: [
                { hanzi: "王先生要不要喝咖啡？", pinyin: "Wáng Xiānshēng yào bù yào hē kāfēi?", meaning_vi: "Ngài Vương có muốn uống cà phê hay không?" },
              ],
            },
            {
              example_order: 2,
              sentences: [
                { hanzi: "這是是不是烏龍茶？", pinyin: "Zhè shì bù shì Wūlóng chá?", meaning_vi: "Đây có phải là trà Ô Long không?" },
              ],
            },
            {
              example_order: 3,
              sentences: [
                { hanzi: "臺灣人喜歡不喜歡喝茶？", pinyin: "Táiwān rén xǐhuān bù xǐhuān hē chá?", meaning_vi: "Người Đài Loan thích uống trà không?" },
              ],
            },
          ],
        },
        {
          tempId: "sec_2",
          parentTempId: "sec_1",
          order: 2,
          label: "Cấu trúc",
          level: "sub",
          text: '"A" trong cấu trúc đề cập đến thành phần động từ đầu tiên.',
          examples: [
            {
              example_order: 1,
              sentences: [
                { hanzi: "他喝咖啡。", pinyin: "Tā hē kāfēi.", meaning_vi: "Anh ấy uống cà phê." },
                { hanzi: "他喝不喝咖啡？", pinyin: "Tā hē bù hē kāfēi?", meaning_vi: "Anh ấy có uống cà phê hay không?" },
              ],
            },
            {
              example_order: 2,
              sentences: [
                { hanzi: "你是日本人。", pinyin: "Nǐ shì Rìběn rén.", meaning_vi: "Bạn là người Nhật." },
                { hanzi: "คุณ是不是日本人？", pinyin: "Nǐ shì bù shì Rìběn rén?", meaning_vi: "Bạn có phải là người Nhật không?" },
              ],
            },
          ],
        },
      ],
    },
    {
      order: 2,
      title: "II. Trả lời câu hỏi bằng tiếng Trung",
      sections: [
        {
          tempId: "sec_3",
          parentTempId: null,
          order: 1,
          label: "Chức năng",
          level: "main",
          text: "Trả lời khẳng định hoặc phủ định cho câu hỏi nghi vấn.",
          examples: [],
        },
      ],
    },
    {
      order: 3,
      title: "III. Tăng mức độ với 很 hěn",
      sections: [
        {
          tempId: "sec_4",
          parentTempId: null,
          order: 1,
          label: "Cấu trúc",
          level: "main",
          text: "S + 很 + Adj.",
          examples: [],
        },
      ],
    },
    {
      order: 4,
      title: "IV. Câu hỏi nghi vấn với 呢 ne",
      sections: [
        {
          tempId: "sec_5",
          parentTempId: null,
          order: 1,
          label: "Cấu trúc",
          level: "main",
          text: "Chủ ngữ + 呢 ne?",
          examples: [],
        },
      ],
    },
  ]);

  const res = await importGrammar(lessonId, full4PointsJson);
  console.log("Import result:", res);

  const currentPoints = await prisma.grammarPoint.findMany({
    where: { lessonId: 1 },
    orderBy: { order: "asc" },
  });
  console.log(`\nRestored Grammar Points total count (${currentPoints.length}):`);
  currentPoints.forEach((p) => console.log(` - ID ${p.id} (Order ${p.order}): ${p.title}`));

  process.exit(0);
}

restoreFull4Points().catch(console.error);
