import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

async function generateSamplePdfs() {
  const dir = path.join(process.cwd(), "storage", "volumes", "1");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const createPdf = async (title: string, count: number) => {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    for (let i = 1; i <= count; i++) {
      const page = pdfDoc.addPage([600, 800]);
      page.drawText(`${title} - Trang PDF ${i}`, {
        x: 50,
        y: 700,
        size: 24,
        font,
        color: rgb(0.1, 0.3, 0.7),
      });
    }
    return await pdfDoc.save();
  };

  const sgkBytes = await createPdf("SGK Tap 1", 60);
  fs.writeFileSync(path.join(dir, "sgk.pdf"), sgkBytes);

  const sbtBytes = await createPdf("SBT Tap 1", 40);
  fs.writeFileSync(path.join(dir, "sbt.pdf"), sbtBytes);

  const teacherBytes = await createPdf("Sach Giao Vien Tap 1", 30);
  fs.writeFileSync(path.join(dir, "teacher.pdf"), teacherBytes);

  console.log("Sample PDFs generated successfully!");
  process.exit(0);
}

generateSamplePdfs().catch((err) => {
  console.error(err);
  process.exit(1);
});
