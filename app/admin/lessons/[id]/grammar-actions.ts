"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../../db";

// --- GrammarPoint CRUD ---
export async function createGrammarPoint(lessonId: number, title: string, order: number) {
  try {
    const created = await prisma.grammarPoint.create({
      data: {
        lessonId,
        title: title.trim() || "Điểm ngữ pháp mới",
        order: order || 1,
      },
    });
    revalidatePath(`/admin/lessons/${lessonId}`);
    return { success: true, item: created };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateGrammarPoint(id: number, lessonId: number, title: string, order: number) {
  try {
    const updated = await prisma.grammarPoint.update({
      where: { id },
      data: {
        title: title.trim(),
        order: order,
      },
    });
    revalidatePath(`/admin/lessons/${lessonId}`);
    return { success: true, item: updated };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteGrammarPoint(id: number, lessonId: number) {
  try {
    // 1. Delete examples referencing sections of this point
    await prisma.grammarExample.deleteMany({
      where: { section: { grammarPointId: id } },
    });
    // 2. Clear parentId on sections
    await prisma.grammarSection.updateMany({
      where: { grammarPointId: id },
      data: { parentId: null },
    });
    // 3. Delete sections
    await prisma.grammarSection.deleteMany({
      where: { grammarPointId: id },
    });
    // 4. Delete point
    await prisma.grammarPoint.delete({
      where: { id },
    });
    revalidatePath(`/admin/lessons/${lessonId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- GrammarSection CRUD ---
export async function createGrammarSection(
  grammarPointId: number,
  lessonId: number,
  label: string,
  text: string,
  level: string,
  parentId: number | null,
  order: number
) {
  try {
    const created = await prisma.grammarSection.create({
      data: {
        grammarPointId,
        label: label.trim() || "Khối nội dung",
        text: text.trim(),
        level: parentId ? "sub" : level || "main",
        parentId: parentId || null,
        order: order || 1,
      },
    });
    revalidatePath(`/admin/lessons/${lessonId}`);
    return { success: true, item: created };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateGrammarSection(
  id: number,
  lessonId: number,
  label: string,
  text: string,
  level: string,
  parentId: number | null
) {
  try {
    const updated = await prisma.grammarSection.update({
      where: { id },
      data: {
        label: label.trim(),
        text: text.trim(),
        level: parentId ? "sub" : level || "main",
        parentId: parentId || null,
      },
    });
    revalidatePath(`/admin/lessons/${lessonId}`);
    return { success: true, item: updated };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteGrammarSection(id: number, lessonId: number) {
  try {
    // Clear parentId for child sections
    await prisma.grammarSection.updateMany({
      where: { parentId: id },
      data: { parentId: null, level: "main" },
    });
    // Delete examples
    await prisma.grammarExample.deleteMany({
      where: { sectionId: id },
    });
    // Delete section
    await prisma.grammarSection.delete({
      where: { id },
    });
    revalidatePath(`/admin/lessons/${lessonId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// --- GrammarExample Group CRUD ---
export async function createGrammarExampleGroup(
  sectionId: number,
  lessonId: number,
  groupOrder: number,
  sentences: Array<{ hanzi: string; pinyin: string; meaningVi: string }>
) {
  try {
    const existingExamples = await prisma.grammarExample.findMany({
      where: { sectionId },
      orderBy: { order: "desc" },
      take: 1,
    });
    let startOrder = existingExamples[0] ? existingExamples[0].order + 1 : 1;

    for (const s of sentences) {
      await prisma.grammarExample.create({
        data: {
          sectionId,
          groupOrder,
          order: startOrder++,
          hanzi: s.hanzi.trim(),
          pinyin: s.pinyin.trim(),
          meaningVi: s.meaningVi.trim(),
        },
      });
    }

    revalidatePath(`/admin/lessons/${lessonId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateGrammarExampleGroup(
  sectionId: number,
  lessonId: number,
  groupOrder: number,
  sentences: Array<{ id?: number; hanzi: string; pinyin: string; meaningVi: string }>
) {
  try {
    // Delete old sentences in this group
    await prisma.grammarExample.deleteMany({
      where: { sectionId, groupOrder },
    });

    let startOrder = 1;
    for (const s of sentences) {
      await prisma.grammarExample.create({
        data: {
          sectionId,
          groupOrder,
          order: startOrder++,
          hanzi: s.hanzi.trim(),
          pinyin: s.pinyin.trim(),
          meaningVi: s.meaningVi.trim(),
        },
      });
    }

    revalidatePath(`/admin/lessons/${lessonId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteGrammarExampleGroup(sectionId: number, groupOrder: number, lessonId: number) {
  try {
    await prisma.grammarExample.deleteMany({
      where: { sectionId, groupOrder },
    });
    revalidatePath(`/admin/lessons/${lessonId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
