import path from "path";
import { pathToFileURL } from "url";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { pdfToPng } from "pdf-to-png-converter";

async function testWinUrl() {
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs"
  );
  const fileUrl = pathToFileURL(workerPath).href;
  console.log("Converted Windows path to file URL:", fileUrl);
  pdfjsLib.GlobalWorkerOptions.workerSrc = fileUrl;

  const testPdf = path.join(process.cwd(), "storage", "lessons", "1", "sgk.pdf");
  const pages = await pdfToPng(testPdf, { viewportScale: 2.0 });
  console.log("Success! Converted pages count:", pages.length);
  process.exit(0);
}

testWinUrl().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
