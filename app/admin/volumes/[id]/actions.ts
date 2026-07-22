"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { prisma } from "../../db";

export type DocType = "sgk" | "sbt" | "teacher";

export async function uploadVolumePdf(formData: FormData) {
  try {
    const volumeIdStr = formData.get("volumeId") as string;
    const docType = formData.get("docType") as DocType;
    const file = formData.get("file") as File | null;
    const printedPageStr = formData.get("printedPage") as string;
    const actualPdfPageStr = formData.get("actualPdfPage") as string;

    if (!volumeIdStr || !docType || !file || !printedPageStr || !actualPdfPageStr) {
      return { success: false, error: "Vui lòng nhập đầy đủ thông tin và chọn file PDF." };
    }

    if (file.size === 0) {
      return { success: false, error: "File PDF không hợp lệ hoặc bị rỗng." };
    }

    const volumeId = parseInt(volumeIdStr, 10);
    const printedPage = parseInt(printedPageStr, 10);
    const actualPdfPage = parseInt(actualPdfPageStr, 10);

    if (isNaN(volumeId) || isNaN(printedPage) || isNaN(actualPdfPage)) {
      return { success: false, error: "Số trang nhập vào không hợp lệ." };
    }

    // 1. Storage directory
    const storageDir = path.join(process.cwd(), "storage", "volumes", volumeId.toString());
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    // 2. Save file: storage/volumes/{volumeId}/{docType}.pdf
    const fileName = `${docType}.pdf`;
    const fullFilePath = path.join(storageDir, fileName);
    const relativePath = `storage/volumes/${volumeId}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(fullFilePath, buffer);

    // 3. Calculate offset
    const offset = actualPdfPage - printedPage;

    // 4. Update Database
    const updateData: Record<string, any> = {};
    if (docType === "sgk") {
      updateData.sgkPdfPath = relativePath;
      updateData.sgkOffset = offset;
    } else if (docType === "sbt") {
      updateData.sbtPdfPath = relativePath;
      updateData.sbtOffset = offset;
    } else if (docType === "teacher") {
      updateData.teacherPdfPath = relativePath;
      updateData.teacherOffset = offset;
    }

    await prisma.volume.update({
      where: { id: volumeId },
      data: updateData,
    });

    try {
      revalidatePath(`/admin/volumes/${volumeId}`);
    } catch {
      // Ignore outside of Next.js server context
    }

    return { success: true };
  } catch (err: any) {
    console.error("Upload Volume PDF Error:", err);
    return { success: false, error: err.message || "Đã xảy ra lỗi khi lưu file PDF." };
  }
}

export async function updateVolumeCefrLevel(volumeId: number, cefrLevel: string) {
  try {
    if (!volumeId) return { success: false, error: "Volume ID không hợp lệ." };

    await prisma.volume.update({
      where: { id: volumeId },
      data: { cefrLevel: cefrLevel.trim() || null },
    });

    try {
      revalidatePath(`/admin/volumes/${volumeId}`);
    } catch {
      // Ignore
    }

    return { success: true };
  } catch (err: any) {
    console.error("Update CEFR Level Error:", err);
    return { success: false, error: err.message || "Đã xảy ra lỗi khi cập nhật cấp độ CEFR." };
  }
}
