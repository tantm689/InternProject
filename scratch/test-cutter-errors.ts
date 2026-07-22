import { cutLessonPdf } from "E:/InternProjectV3/dangdai-app/app/admin/lessons/[id]/actions";
import { prisma } from "E:/InternProjectV3/dangdai-app/app/admin/db";

async function testErrors() {
  console.log("=== TESTING ERROR HANDLING ===");

  // 1. Temporarily unset teacherPdfPath in Volume 1
  await prisma.volume.update({
    where: { id: 1 },
    data: { teacherPdfPath: null },
  });

  const fdTeacher = new FormData();
  fdTeacher.append("lessonId", "1");
  fdTeacher.append("docType", "teacher");
  fdTeacher.append("pageStart", "2");
  fdTeacher.append("pageEnd", "4");

  const resError1 = await cutLessonPdf(fdTeacher);
  console.log("Error Test (Missing Volume PDF):", resError1);

  // Restore teacherPdfPath
  await prisma.volume.update({
    where: { id: 1 },
    data: { teacherPdfPath: "storage/volumes/1/teacher.pdf" },
  });

  // 2. Test Out of Bounds pages (e.g. printed page 100 to 120, when PDF has only 30 pages)
  const fdOob = new FormData();
  fdOob.append("lessonId", "1");
  fdOob.append("docType", "teacher");
  fdOob.append("pageStart", "100");
  fdOob.append("pageEnd", "120");

  const resError2 = await cutLessonPdf(fdOob);
  console.log("Error Test (Out of Bounds):", resError2);

  process.exit(0);
}

testErrors().catch((err) => {
  console.error("Error test failed:", err);
  process.exit(1);
});
