import path from "path";
import { pathToFileURL } from "url";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { pdfToPng } from "pdf-to-png-converter";

// Set workerSrc for pdfjs-dist using file:// URL format for Windows Node ESM compatibility
if (pdfjsLib.GlobalWorkerOptions) {
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs"
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
}

export async function renderPdfToPng(pdfPath: string) {
  return await pdfToPng(pdfPath, { viewportScale: 2.0 });
}
