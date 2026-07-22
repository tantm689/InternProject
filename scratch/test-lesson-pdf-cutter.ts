import { cutLessonPdf } from "E:/InternProjectV3/dangdai-app/app/admin/lessons/[id]/actions";
import { prisma } from "E:/InternProjectV3/dangdai-app/app/admin/db";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";

async function testPdfCutting() {
  console.log("=== STARTING LESSON PDF CUTTER TEST ===");

  // 1. Cut SGK (printed 10 to 15, offset 16 => actual 26 to 31 => 6 pages)
  const fdSgk = new FormData();
  fdSgk.append("lessonId", "1");
  fdSgk.append("docType", "sgk");
  fdSgk.append("pageStart", "10");
  fdSgk.append("pageEnd", "15");

  const res1 = await cutLessonPdf(fdSgk);
  console.log("SGK Cut Result:", res1);

  // 2. Cut SBT (printed 5 to 8, offset 5 => actual 10 to 13 => 4 pages)
  const fdSbt = new FormData();
  fdSbt.append("lessonId", "1");
  fdSbt.append("docType", "sbt");
  fdSbt.append("pageStart", "5");
  fdSbt.append("pageEnd", "8");

  const res2 = await cutLessonPdf(fdSbt);
  console.log("SBT Cut Result:", res2);

  // 3. Cut Teacher (printed 2 to 4, offset 7 => actual 9 to 11 => 3 pages)
  const fdTeacher = new FormData();
  fdTeacher.append("lessonId", "1");
  fdTeacher.append("docType", "teacher");
  fdTeacher.append("pageStart", "2");
  fdTeacher.append("pageEnd", "4");

  const res3 = await cutLessonPdf(fdTeacher);
  console.log("Teacher Cut Result:", res3);

  // 4. Verify Lesson record in DB
  const lesson = await prisma.lesson.findUnique({ where: { id: 1 } });
  console.log("Lesson Record after cuts:", {
    sgkCutPath: lesson?.sgkCutPath,
    sgkPages: `${lesson?.sgkPageStart}-${lesson?.sgkPageEnd}`,
    sbtCutPath: lesson?.sbtCutPath,
    sbtPages: `${lesson?.sbtPageStart}-${lesson?.sbtPageEnd}`,
    teacherCutPath: lesson?.teacherCutPath,
    teacherPages: `${lesson?.teacherPageStart}-${lesson?.teacherPageEnd}`,
  });

  // 5. Verify created PDF files on disk & check page counts
  const checkPdfPageCount = async (relPath: string) => {
    const fullP = path.join(process.cwd(), relPath);
    if (!fs.existsSync(fullP)) return 0;
    const doc = await PDFDocument.load(fs.readFileSync(fullP));
    return doc.getPageCount();
  };

  const sgkPageCount = await checkPdfPageCount(lesson?.sgkCutPath || "");
  const sbtPageCount = await checkPdfPageCount(lesson?.sbtCutPath || "");
  const teacherPageCount = await checkPdfPageCount(lesson?.teacherCutPath || "");

  console.log("Extracted PDF Page Counts:");
  console.log(`- SGK Cut PDF (${lesson?.sgkCutPath}): ${sgkPageCount} pages (Expected 6)`);
  console.log(`- SBT Cut PDF (${lesson?.sbtCutPath}): ${sbtPageCount} pages (Expected 4)`);
  console.log(`- Teacher Cut PDF (${lesson?.teacherCutPath}): ${teacherPageCount} pages (Expected 3)`);

  process.exit(0);
}

testPdfCutting().catch((err) => {
  console.error("Test Error:", err);
  process.exit(1);
});
