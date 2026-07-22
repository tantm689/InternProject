"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../db";

interface VocabInput {
  lessonId: number;
  order: number;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  partOfSpeech: string | null;
  exampleHanzi: string | null;
  examplePinyin: string | null;
  exampleVi: string | null;
}

interface DialogueInput {
  lessonId: number;
  dialogueNumber: number;
  lineOrder: number;
  speaker: string | null;
  hanzi: string;
  pinyin: string | null;
  meaningVi: string;
  audioUrl: string | null;
}

export async function importVocabulary(lessonId: number, jsonText: string) {
  try {
    if (!jsonText || !jsonText.trim()) {
      return { success: false, error: "Vui lòng dán nội dung JSON vào ô nhập." };
    }

    let items: any[];
    try {
      items = JSON.parse(jsonText);
    } catch (parseErr: any) {
      return {
        success: false,
        error: `Lỗi cú pháp JSON: ${parseErr.message || "Định dạng JSON không hợp lệ."}`,
      };
    }

    if (!Array.isArray(items)) {
      return { success: false, error: "Dữ liệu JSON phải là một mảng [...] chứa các từ vựng." };
    }

    // Validate and sanitize each item
    const sanitizedItems: VocabInput[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (
        item.order === undefined ||
        item.order === null ||
        !item.hanzi ||
        !item.pinyin ||
        !item.meaningVi
      ) {
        return {
          success: false,
          error: `Phần tử thứ ${i + 1} thiếu trường bắt buộc (cần có order, hanzi, pinyin, meaningVi).`,
        };
      }

      const orderNum = parseInt(item.order, 10);
      if (isNaN(orderNum)) {
        return { success: false, error: `Phần tử thứ ${i + 1} có 'order' không phải là số hợp lệ.` };
      }

      sanitizedItems.push({
        lessonId,
        order: orderNum,
        hanzi: String(item.hanzi).trim(),
        pinyin: String(item.pinyin).trim(),
        meaningVi: String(item.meaningVi).trim(),
        partOfSpeech: item.partOfSpeech ? String(item.partOfSpeech).trim() : null,
        exampleHanzi: item.exampleHanzi ? String(item.exampleHanzi).trim() : null,
        examplePinyin: item.examplePinyin ? String(item.examplePinyin).trim() : null,
        exampleVi: item.exampleVi ? String(item.exampleVi).trim() : null,
      });
    }

    // Prisma Transaction: Delete old records of this lesson & Insert new ones
    await prisma.$transaction(async (tx) => {
      await tx.vocabulary.deleteMany({
        where: { lessonId },
      });
      if (sanitizedItems.length > 0) {
        await tx.vocabulary.createMany({
          data: sanitizedItems,
        });
      }
    });

    try {
      revalidatePath(`/admin/lessons/${lessonId}`);
    } catch {
      // Ignore outside server context
    }

    return { success: true, count: sanitizedItems.length };
  } catch (err: any) {
    console.error("Import Vocabulary Error:", err);
    return { success: false, error: err.message || "Đã xảy ra lỗi khi import từ vựng vào DB." };
  }
}

export async function importDialogue(lessonId: number, jsonText: string) {
  try {
    if (!jsonText || !jsonText.trim()) {
      return { success: false, error: "Vui lòng dán nội dung JSON vào ô nhập." };
    }

    let items: any[];
    try {
      items = JSON.parse(jsonText);
    } catch (parseErr: any) {
      return {
        success: false,
        error: `Lỗi cú pháp JSON: ${parseErr.message || "Định dạng JSON không hợp lệ."}`,
      };
    }

    if (!Array.isArray(items)) {
      return { success: false, error: "Dữ liệu JSON phải là một mảng [...] chứa các đoạn hội thoại." };
    }

    const sanitizedItems: DialogueInput[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (
        item.dialogueNumber === undefined ||
        item.lineOrder === undefined ||
        !item.hanzi ||
        !item.meaningVi
      ) {
        return {
          success: false,
          error: `Phần tử thứ ${i + 1} thiếu trường bắt buộc (cần có dialogueNumber, lineOrder, hanzi, meaningVi).`,
        };
      }

      const dNum = parseInt(item.dialogueNumber, 10);
      const lOrder = parseInt(item.lineOrder, 10);
      if (isNaN(dNum) || isNaN(lOrder)) {
        return { success: false, error: `Phần tử thứ ${i + 1} có 'dialogueNumber' hoặc 'lineOrder' không phải là số hợp lệ.` };
      }

      sanitizedItems.push({
        lessonId,
        dialogueNumber: dNum,
        lineOrder: lOrder,
        speaker: item.speaker ? String(item.speaker).trim() : null,
        hanzi: String(item.hanzi).trim(),
        pinyin: item.pinyin ? String(item.pinyin).trim() : null,
        meaningVi: String(item.meaningVi).trim(),
        audioUrl: item.audioUrl ? String(item.audioUrl).trim() : null,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.dialogue.deleteMany({
        where: { lessonId },
      });
      if (sanitizedItems.length > 0) {
        await tx.dialogue.createMany({
          data: sanitizedItems,
        });
      }
    });

    try {
      revalidatePath(`/admin/lessons/${lessonId}`);
    } catch {
      // Ignore
    }

    return { success: true, count: sanitizedItems.length };
  } catch (err: any) {
    console.error("Import Dialogue Error:", err);
    return { success: false, error: err.message || "Đã xảy ra lỗi khi import hội thoại vào DB." };
  }
}

async function insertSectionExamples(tx: any, sectionId: number, rawExamples: any[]) {
  let sentenceOrderCounter = 1;

  for (let gIdx = 0; gIdx < rawExamples.length; gIdx++) {
    const exGroup = rawExamples[gIdx];
    const groupOrder = parseInt(exGroup.example_order || exGroup.order, 10) || gIdx + 1;

    // New format with sentences array
    if (exGroup.sentences && Array.isArray(exGroup.sentences)) {
      for (const s of exGroup.sentences) {
        let hanziText = String(s.hanzi || "").trim();
        if (s.speaker && String(s.speaker).trim()) {
          hanziText = `${String(s.speaker).trim()}：${hanziText}`;
        }

        await tx.grammarExample.create({
          data: {
            sectionId: sectionId,
            order: sentenceOrderCounter++,
            groupOrder: groupOrder,
            hanzi: hanziText,
            pinyin: String(s.pinyin || "").trim(),
            meaningVi: String(s.meaning_vi || s.meaningVi || "").trim(),
          },
        });
      }
    } else {
      // Old flat format fallback
      let hanziText = String(exGroup.hanzi || "").trim();
      if (exGroup.speaker && String(exGroup.speaker).trim()) {
        hanziText = `${String(exGroup.speaker).trim()}：${hanziText}`;
      }

      await tx.grammarExample.create({
        data: {
          sectionId: sectionId,
          order: sentenceOrderCounter++,
          groupOrder: groupOrder,
          hanzi: hanziText,
          pinyin: String(exGroup.pinyin || "").trim(),
          meaningVi: String(exGroup.meaning_vi || exGroup.meaningVi || "").trim(),
        },
      });
    }
  }
}

export async function importGrammar(lessonId: number, jsonText: string) {
  try {
    if (!jsonText || !jsonText.trim()) {
      return { success: false, error: "Vui lòng dán nội dung JSON vào ô nhập." };
    }

    let items: any[];
    try {
      items = JSON.parse(jsonText);
    } catch (parseErr: any) {
      return {
        success: false,
        error: `Lỗi cú pháp JSON: ${parseErr.message || "Định dạng JSON không hợp lệ."}`,
      };
    }

    if (!Array.isArray(items)) {
      return { success: false, error: "Dữ liệu JSON phải là một mảng [...] chứa các điểm ngữ pháp." };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Find existing GrammarPoints for this lesson
      const existingPoints = await tx.grammarPoint.findMany({
        where: { lessonId },
        select: { id: true },
      });

      if (existingPoints.length > 0) {
        const pointIds = existingPoints.map((p) => p.id);

        // 2. Delete GrammarExamples referencing sections of these points
        await tx.grammarExample.deleteMany({
          where: {
            section: {
              grammarPointId: { in: pointIds },
            },
          },
        });

        // 3. Clear parentId on GrammarSections to break self-referencing FK constraints
        await tx.grammarSection.updateMany({
          where: { grammarPointId: { in: pointIds } },
          data: { parentId: null },
        });

        // 4. Delete GrammarSections
        await tx.grammarSection.deleteMany({
          where: { grammarPointId: { in: pointIds } },
        });

        // 5. Delete GrammarPoints
        await tx.grammarPoint.deleteMany({
          where: { lessonId },
        });
      }

      for (let i = 0; i < items.length; i++) {
        const gp = items[i];
        const pointOrder = parseInt(gp.order, 10) || i + 1;
        const title = String(gp.title || "").trim();

        const createdGp = await tx.grammarPoint.create({
          data: {
            lessonId,
            order: pointOrder,
            title: title || `Điểm ngữ pháp ${pointOrder}`,
          },
        });

        const tempIdToDbId = new Map<string, number>();
        let uninsertedSections = [...(gp.sections || [])];

        // Iteratively insert sections at arbitrary nesting depth
        while (uninsertedSections.length > 0) {
          const remaining: any[] = [];
          let progressMade = false;

          for (let sIdx = 0; sIdx < uninsertedSections.length; sIdx++) {
            const sec = uninsertedSections[sIdx];
            const parentTempId = sec.parentTempId ? String(sec.parentTempId) : null;

            if (!parentTempId || tempIdToDbId.has(parentTempId)) {
              const parentDbId = parentTempId ? tempIdToDbId.get(parentTempId)! : null;
              const level = parentDbId ? "sub" : "main";

              const createdSec = await tx.grammarSection.create({
                data: {
                  grammarPointId: createdGp.id,
                  parentId: parentDbId,
                  order: parseInt(sec.order, 10) || sIdx + 1,
                  label: String(sec.label || "").trim(),
                  level: level,
                  text: String(sec.text || "").trim(),
                },
              });

              if (sec.tempId) {
                tempIdToDbId.set(String(sec.tempId), createdSec.id);
              }

              // Insert examples for this section
              await insertSectionExamples(tx, createdSec.id, sec.examples || []);

              progressMade = true;
            } else {
              remaining.push(sec);
            }
          }

          if (!progressMade && remaining.length > 0) {
            // Fallback for unresolved parent IDs
            for (const sec of remaining) {
              const createdSec = await tx.grammarSection.create({
                data: {
                  grammarPointId: createdGp.id,
                  parentId: null,
                  order: parseInt(sec.order, 10) || 1,
                  label: String(sec.label || "").trim(),
                  level: "main",
                  text: String(sec.text || "").trim(),
                },
              });
              if (sec.tempId) tempIdToDbId.set(String(sec.tempId), createdSec.id);

              await insertSectionExamples(tx, createdSec.id, sec.examples || []);
            }
            break;
          }

          uninsertedSections = remaining;
        }
      }
    });

    try {
      revalidatePath(`/admin/lessons/${lessonId}`);
    } catch {
      // Ignore
    }

    return { success: true, count: items.length };
  } catch (err: any) {
    console.error("Import Grammar Error:", err);
    return { success: false, error: err.message || "Đã xảy ra lỗi khi import ngữ pháp vào DB." };
  }
}
