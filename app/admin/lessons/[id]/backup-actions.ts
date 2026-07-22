"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../db";
import { importVocabulary, importDialogue, importGrammar } from "./import-actions";

export async function createBackupHelper(
  lessonId: number,
  type: "vocab" | "dialogue" | "grammar",
  action: string,
  note: string
) {
  try {
    let dataJson = "[]";

    if (type === "vocab") {
      const items = await prisma.vocabulary.findMany({
        where: { lessonId },
        orderBy: { order: "asc" },
      });
      dataJson = JSON.stringify(items);
    } else if (type === "dialogue") {
      const items = await prisma.dialogue.findMany({
        where: { lessonId },
        orderBy: [{ dialogueNumber: "asc" }, { lineOrder: "asc" }],
      });
      dataJson = JSON.stringify(items);
    } else if (type === "grammar") {
      const points = await prisma.grammarPoint.findMany({
        where: { lessonId },
        orderBy: { order: "asc" },
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: {
              examples: {
                orderBy: [{ groupOrder: "asc" }, { order: "asc" }],
              },
            },
          },
        },
      });

      // Format grammar points into importable JSON format
      const formattedPoints = points.map((gp) => ({
        order: gp.order,
        title: gp.title,
        sections: gp.sections.map((sec) => {
          // Group examples by groupOrder
          const exampleGroups = sec.examples.reduce((acc, ex) => {
            const gNum = ex.groupOrder || ex.order;
            if (!acc[gNum]) acc[gNum] = [];
            acc[gNum].push(ex);
            return acc;
          }, {} as Record<number, typeof sec.examples>);

          const groupKeys = Object.keys(exampleGroups).map(Number).sort((a, b) => a - b);

          const formattedExamples = groupKeys.map((gNum) => ({
            example_order: gNum,
            sentences: exampleGroups[gNum].map((st) => ({
              hanzi: st.hanzi,
              pinyin: st.pinyin,
              meaning_vi: st.meaningVi,
            })),
          }));

          return {
            tempId: `sec_${sec.id}`,
            parentTempId: sec.parentId ? `sec_${sec.parentId}` : null,
            order: sec.order,
            label: sec.label,
            level: sec.level,
            text: sec.text,
            examples: formattedExamples,
          };
        }),
      }));

      dataJson = JSON.stringify(formattedPoints);
    }

    // Insert backup record
    await prisma.lessonBackup.create({
      data: {
        lessonId,
        type,
        action,
        note,
        data: dataJson,
      },
    });

    // Clean up old backups if count > 25
    const oldBackups = await prisma.lessonBackup.findMany({
      where: { lessonId, type },
      orderBy: { createdAt: "desc" },
      skip: 25,
      select: { id: true },
    });

    if (oldBackups.length > 0) {
      await prisma.lessonBackup.deleteMany({
        where: { id: { in: oldBackups.map((b) => b.id) } },
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error("Create Backup Error:", err);
    return { success: false, error: err.message };
  }
}

export async function getLessonBackups(lessonId: number, type?: string) {
  try {
    const where: any = { lessonId };
    if (type) where.type = type;

    const backups = await prisma.lessonBackup.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return { success: true, backups };
  } catch (err: any) {
    return { success: false, error: err.message, backups: [] };
  }
}

export async function restoreBackup(backupId: number, lessonId: number) {
  try {
    const backup = await prisma.lessonBackup.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      return { success: false, error: "Không tìm thấy bản sao lưu này." };
    }

    // 1. Create a backup of CURRENT state before restoring
    const typeLabel =
      backup.type === "vocab"
        ? "Từ vựng"
        : backup.type === "dialogue"
        ? "Hội thoại"
        : "Ngữ pháp";

    await createBackupHelper(
      lessonId,
      backup.type as any,
      "BEFORE_RESTORE",
      `Sao lưu tự động trước khi khôi phục bản ngày ${new Date(backup.createdAt).toLocaleString("vi-VN")}`
    );

    // 2. Perform restore based on type
    if (backup.type === "vocab") {
      const res = await importVocabulary(lessonId, backup.data);
      if (!res.success) return res;
    } else if (backup.type === "dialogue") {
      const res = await importDialogue(lessonId, backup.data);
      if (!res.success) return res;
    } else if (backup.type === "grammar") {
      const res = await importGrammar(lessonId, backup.data);
      if (!res.success) return res;
    }

    try {
      revalidatePath(`/admin/lessons/${lessonId}`);
    } catch {
      // Ignore outside Next.js request context
    }
    return { success: true, typeLabel };
  } catch (err: any) {
    console.error("Restore Backup Error:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteBackup(backupId: number, lessonId: number) {
  try {
    await prisma.lessonBackup.delete({
      where: { id: backupId },
    });
    revalidatePath(`/admin/lessons/${lessonId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
