import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "path";
import { pdfToPng } from "pdf-to-png-converter";

async function testPdfWorker() {
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs"
  );
  console.log("Setting workerSrc to:", workerPath);
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

  const testPdf = path.join(process.cwd(), "storage", "lessons", "1", "sgk.pdf");
  const pages = await pdfToPng(testPdf, { viewportScale: 2.0 });
  console.log("Success! Converted pages count:", pages.length);
  process.exit(0);
}

testPdfWorker().catch((err) => {
  console.error("Worker test error:", err);
  process.exit(1);
});
