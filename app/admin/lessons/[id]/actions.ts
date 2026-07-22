"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { PDFDocument } from "pdf-lib";
import { prisma } from "../../db";

export type DocType = "sgk" | "sbt" | "teacher" | "sbt_answer";

export async function cutLessonPdf(formData: FormData) {
  try {
    const lessonIdStr = formData.get("lessonId") as string;
    const docType = formData.get("docType") as DocType;
    const pageStartStr = formData.get("pageStart") as string;
    const pageEndStr = formData.get("pageEnd") as string;

    if (!lessonIdStr || !docType || !pageStartStr || !pageEndStr) {
      return { success: false, error: "Vui lòng nhập đầy đủ thông tin trang bắt đầu và kết thúc." };
    }

    const lessonId = parseInt(lessonIdStr, 10);
    const pageStart = parseInt(pageStartStr, 10);
    const pageEnd = parseInt(pageEndStr, 10);

    if (isNaN(lessonId) || isNaN(pageStart) || isNaN(pageEnd)) {
      return { success: false, error: "Số trang nhập vào không hợp lệ." };
    }

    if (pageStart < 1 || pageEnd < pageStart) {
      return { success: false, error: "Trang kết thúc phải lớn hơn hoặc bằng trang bắt đầu (>= 1)." };
    }

    // 1. Fetch Lesson with Volume
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { volume: true },
    });

    if (!lesson) {
      return { success: false, error: "Không tìm thấy bài học." };
    }

    const volume = lesson.volume;
    const docLabels: Record<DocType, string> = {
      sgk: "SGK",
      sbt: "SBT",
      teacher: "Sách giáo viên",
      sbt_answer: "Đáp án SBT",
    };
    const docLabel = docLabels[docType] || docType;

    let pdfPath: string | null = null;
    let offset: number | null = null;

    if (docType === "sgk") {
      pdfPath = volume.sgkPdfPath;
      offset = volume.sgkOffset;
    } else if (docType === "sbt" || docType === "sbt_answer") {
      pdfPath = volume.sbtPdfPath;
      offset = volume.sbtOffset;
    } else if (docType === "teacher") {
      pdfPath = volume.teacherPdfPath;
      offset = volume.teacherOffset;
    }

    // 2. Check if Volume has PDF & offset for this type
    if (!pdfPath || offset === null || offset === undefined) {
      return {
        success: false,
        error: `Chưa upload file gốc cho Volume này ở loại ${docLabel} — vào trang Volume để upload trước`,
      };
    }

    const fullOriginalPdfPath = path.join(process.cwd(), pdfPath);
    if (!fs.existsSync(fullOriginalPdfPath)) {
      return {
        success: false,
        error: `Chưa upload file gốc cho Volume này ở loại ${docLabel} — vào trang Volume để upload trước`,
      };
    }

    // 3. Calculate actual PDF pages
    const actualStart = pageStart + offset;
    const actualEnd = pageEnd + offset;

    // 4. Read PDF & copy pages using pdf-lib
    const originalBytes = fs.readFileSync(fullOriginalPdfPath);
    const srcDoc = await PDFDocument.load(originalBytes);
    const totalPages = srcDoc.getPageCount();

    if (actualStart < 1 || actualEnd > totalPages) {
      return {
        success: false,
        error: `Khoảng trang PDF thực tế (${actualStart} - ${actualEnd}) vượt quá số trang file gốc (1 - ${totalPages} trang).`,
      };
    }

    const destDoc = await PDFDocument.create();
    const pageIndices: number[] = [];
    for (let p = actualStart - 1; p <= actualEnd - 1; p++) {
      pageIndices.push(p);
    }

    const copiedPages = await destDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((page) => destDoc.addPage(page));

    const newPdfBytes = await destDoc.save();

    // 5. Save cut file to storage/lessons/{lessonId}/{docType}.pdf
    const outDir = path.join(process.cwd(), "storage", "lessons", lessonId.toString());
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const fileName = `${docType}.pdf`;
    const outFullPath = path.join(outDir, fileName);
    const relativeCutPath = `storage/lessons/${lessonId}/${fileName}`;

    fs.writeFileSync(outFullPath, newPdfBytes);

    // 6. Update Lesson in Database
    const updateData: Record<string, any> = {};
    if (docType === "sgk") {
      updateData.sgkCutPath = relativeCutPath;
      updateData.sgkPageStart = pageStart;
      updateData.sgkPageEnd = pageEnd;
    } else if (docType === "sbt") {
      updateData.sbtCutPath = relativeCutPath;
      updateData.sbtPageStart = pageStart;
      updateData.sbtPageEnd = pageEnd;
    } else if (docType === "teacher") {
      updateData.teacherCutPath = relativeCutPath;
      updateData.teacherPageStart = pageStart;
      updateData.teacherPageEnd = pageEnd;
    } else if (docType === "sbt_answer") {
      updateData.sbtAnswerCutPath = relativeCutPath;
      updateData.sbtAnswerPageStart = pageStart;
      updateData.sbtAnswerPageEnd = pageEnd;
    }

    await prisma.lesson.update({
      where: { id: lessonId },
      data: updateData,
    });

    try {
      revalidatePath(`/admin/lessons/${lessonId}`);
    } catch {
      // Ignore outside Next.js request context
    }

    return { success: true };
  } catch (err: any) {
    console.error("Cut Lesson PDF Error:", err);
    return { success: false, error: err.message || "Đã xảy ra lỗi khi cắt PDF." };
  }
}
