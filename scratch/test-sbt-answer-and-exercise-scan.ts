import "dotenv/config";
import { cutLessonPdf } from "E:/InternProjectV3/dangdai-app/app/admin/lessons/[id]/actions";
import { POST as scanExercise } from "E:/InternProjectV3/dangdai-app/app/api/admin/lessons/[id]/scan/exercise/route";
import { prisma } from "E:/InternProjectV3/dangdai-app/app/admin/db";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

async function runTest() {
  console.log("=== 1. TESTING CUT SBT ANSWER PAGES FOR LESSON 1 ===");

  // Ensure Volume 1 has SBT PDF
  const vol = await prisma.volume.findUnique({ where: { id: 1 } });
  console.log("Volume 1 SBT PDF Path:", vol?.sbtPdfPath, "Offset:", vol?.sbtOffset);

  if (!vol?.sbtPdfPath) {
    console.log("Creating dummy storage/volumes/1/sbt.pdf for testing...");
    const dir = path.join(process.cwd(), "storage", "volumes", "1");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "sbt.pdf"), Buffer.from("%PDF-1.4 dummy pdf for sbt testing"));
    await prisma.volume.update({
      where: { id: 1 },
      data: {
        sbtPdfPath: "storage/volumes/1/sbt.pdf",
        sbtOffset: 5,
      },
    });
  }

  // Perform cut for sbt_answer
  const formData = new FormData();
  formData.append("lessonId", "1");
  formData.append("docType", "sbt_answer");
  formData.append("pageStart", "10");
  formData.append("pageEnd", "12");

  const cutRes = await cutLessonPdf(formData);
  console.log("Cut SBT Answer Result:", cutRes);

  const updatedLesson = await prisma.lesson.findUnique({ where: { id: 1 } });
  console.log("Updated Lesson sbtAnswerCutPath:", (updatedLesson as any)?.sbtAnswerCutPath);
  console.log("Updated Lesson sbtAnswerPageStart-End:", (updatedLesson as any)?.sbtAnswerPageStart, "-", (updatedLesson as any)?.sbtAnswerPageEnd);

  console.log("\n=== 2. TESTING SCAN EXERCISE API ROUTE FOR LESSON 1 ===");

  if (!(updatedLesson as any)?.sbtCutPath) {
    console.log("Setting dummy sbtCutPath for Lesson 1 to test scan route...");
    // If no cut path yet, check process.cwd()/storage/lessons/1/sbt.pdf
    const lessonDir = path.join(process.cwd(), "storage", "lessons", "1");
    if (!fs.existsSync(lessonDir)) fs.mkdirSync(lessonDir, { recursive: true });
    // Use sgk.pdf if available as real PDF for testing rendering & scanning
    const sgkPath = path.join(lessonDir, "sgk.pdf");
    const sbtPath = path.join(lessonDir, "sbt.pdf");
    if (fs.existsSync(sgkPath)) {
      fs.copyFileSync(sgkPath, sbtPath);
    } else {
      fs.writeFileSync(sbtPath, Buffer.from("%PDF-1.4 dummy"));
    }
    await prisma.lesson.update({
      where: { id: 1 },
      data: { sbtCutPath: "storage/lessons/1/sbt.pdf" },
    });
  }

  const req = new NextRequest("http://localhost:3000/api/admin/lessons/1/scan/exercise", {
    method: "POST",
  });
  const params = Promise.resolve({ id: "1" });

  const scanRes = await scanExercise(req, { params });
  const scanData = await scanRes.json();

  console.log("Exercise Scan Status:", scanRes.status);
  console.log("Exercise Count Extracted:", scanData.exercise?.length || 0);
  if (scanData.exercise && scanData.exercise.length > 0) {
    console.log("Sample Exercise item:", scanData.exercise[0]);
  }

  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test Error:", err);
  process.exit(1);
});
