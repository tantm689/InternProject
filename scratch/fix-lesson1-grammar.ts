import { prisma } from "E:/InternProjectV3/dangdai-app/app/admin/db";
import { importGrammar } from "E:/InternProjectV3/dangdai-app/app/admin/lessons/[id]/import-actions";

async function fixLesson1Grammar() {
  console.log("=== FIXING LESSON 1 GRAMMAR WITH ALL BOLD HEADERS PRESERVED ===");
  const lessonId = 1;

  const fullData = [
    {
      order: 1,
      title: "I. Cách đặt câu hỏi bằng tiếng Trung (A. Câu hỏi với A 不 A)",
      sections: [
        {
          tempId: "sec_1",
          parentTempId: null,
          order: 1,
          label: "Chức năng",
          text: 'Dạng câu hỏi A 不 A là câu hỏi chính phản trong tiếng Trung, tương đương với dạng câu hỏi "(có) ... (hay) không" trong tiếng Việt.',
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
          parentTempId: null,
          order: 2,
          label: "Cấu trúc",
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
            {
              example_order: 3,
              sentences: [
                { hanzi: "他來臺灣。", pinyin: "Tā lái Táiwān.", meaning_vi: "Anh ấy đến Đài Loan." },
                { hanzi: "他來不來臺灣？", pinyin: "Tā lái bù lái Táiwān?", meaning_vi: "Anh ấy có đến Đài Loan hay không?" },
              ],
            },
          ],
        },
        {
          tempId: "sec_3",
          parentTempId: null,
          order: 3,
          label: "Thông thường",
          text: 'Khi thành phần động từ trong câu hỏi A 不 A là dạng có 2 âm tiết (XY), âm tiết thứ 2 (Y) có thể được bỏ ở chữ "A" đầu tiên, vì vậy "XY 不 XY" cũng giống như "X 不 XY". Ví dụ: 你喜歡不喜歡我？ Nǐ xǐhuān bù xǐhuān wǒ? cũng giống như 你喜不喜歡我？ Nǐ xǐ bù xǐhuān wǒ? (Bạn có thích mình không?)',
          examples: [],
        },
      ],
    },
    {
      order: 2,
      title: "II. Trả lời câu hỏi bằng tiếng Trung",
      sections: [
        {
          tempId: "sec_4",
          parentTempId: null,
          order: 1,
          label: "Chức năng",
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
          tempId: "sec_5",
          parentTempId: null,
          order: 1,
          label: "Cấu trúc",
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
          tempId: "sec_6",
          parentTempId: null,
          order: 1,
          label: "1. Tân ngữ giống nhau, chủ ngữ khác nhau",
          text: "S1 V O, S2 呢 ne?",
          examples: [
            {
              example_order: 1,
              sentences: [
                { hanzi: "他是美國人，你呢？", pinyin: "Tā shì Měiguó rén, nǐ ne?", meaning_vi: "Anh ấy là người Mỹ, còn bạn?" },
              ],
            },
            {
              example_order: 2,
              sentences: [
                { hanzi: "他喜歡我們，你呢？", pinyin: "Tā xǐhuān wǒmen, nǐ ne?", meaning_vi: "Ông ấy thích chúng tớ, cậu thì sao?" },
              ],
            },
          ],
        },
        {
          tempId: "sec_7",
          parentTempId: null,
          order: 2,
          label: "2. Chủ ngữ giống nhau, tân ngữ khác nhau",
          text: "S V O1, O2 呢 ne?",
          examples: [
            {
              example_order: 1,
              sentences: [
                { hanzi: "你喜歡喝茶，咖啡呢？", pinyin: "Nǐ xǐhuān hē chá, kāfēi ne?", meaning_vi: "Cậu thích uống trà, thế còn cà phê?" },
              ],
            },
            {
              example_order: 2,
              sentences: [
                { hanzi: "他不喝咖啡，茶呢？", pinyin: "Tā bù hē kāfēi, chá ne?", meaning_vi: "Anh ấy không uống cà phê, còn trà thì sao?" },
              ],
            },
          ],
        },
      ],
    },
  ];

  const res = await importGrammar(lessonId, JSON.stringify(fullData));
  console.log("Import result:", res);

  const points = await prisma.grammarPoint.findMany({
    where: { lessonId: 1 },
    include: { sections: true },
  });

  console.log(`\nImported Points Count: ${points.length}`);
  points.forEach((p) => {
    console.log(`\n[Point ${p.order}] ${p.title}`);
    p.sections.forEach((s) => {
      console.log(`  - Section: ${s.label} | Text: "${s.text.slice(0, 40)}..."`);
    });
  });

  process.exit(0);
}

fixLesson1Grammar().catch(console.error);
