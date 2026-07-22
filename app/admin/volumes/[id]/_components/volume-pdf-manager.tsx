"use client";

import { useState, useTransition } from "react";
import { uploadVolumePdf, updateVolumeCefrLevel, DocType } from "../actions";

interface VolumeData {
  id: number;
  number: number;
  title: string;
  cefrLevel?: string | null;
  sgkPdfPath: string | null;
  sgkOffset: number | null;
}

interface VolumePdfManagerProps {
  volume: VolumeData;
}

interface BlockConfig {
  key: DocType;
  title: string;
  pdfPath: string | null;
  offset: number | null;
}

export default function VolumePdfManager({ volume }: VolumePdfManagerProps) {
  const [isEditingCefr, setIsEditingCefr] = useState(false);
  const [cefrValue, setCefrValue] = useState(volume.cefrLevel || "");
  const [isPendingCefr, startTransitionCefr] = useTransition();
  const [cefrError, setCefrError] = useState<string | null>(null);

  const handleSaveCefr = (e: React.FormEvent) => {
    e.preventDefault();
    setCefrError(null);

    startTransitionCefr(async () => {
      try {
        const res = await updateVolumeCefrLevel(volume.id, cefrValue);
        if (!res.success) {
          setCefrError(res.error || "Lỗi khi lưu CEFR.");
        } else {
          setIsEditingCefr(false);
        }
      } catch (err: any) {
        setCefrError(err.message || "Đã xảy ra lỗi khi lưu cấp độ CEFR.");
      }
    });
  };

  const blocks: BlockConfig[] = [
    {
      key: "sgk",
      title: "SGK (Sách giáo khoa)",
      pdfPath: volume.sgkPdfPath,
      offset: volume.sgkOffset,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Volume Header & CEFR Input */}
      <div className="border-b border-gray-200 pb-4 space-y-3">
        <div>
          <span className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Tập {volume.number}
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{volume.title}</h1>
        </div>

        {/* CEFR Level Form / Display */}
        <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 max-w-md">
          {volume.cefrLevel && !isEditingCefr ? (
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-blue-900 flex items-center gap-2">
                <span>Cấp độ CEFR:</span>
                <span className="bg-blue-600 text-white font-bold text-xs px-2.5 py-1 rounded-md">
                  {volume.cefrLevel}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingCefr(true)}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-white border border-blue-300 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors"
              >
                Sửa
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveCefr} className="space-y-2">
              <label className="block text-xs font-bold text-blue-900">
                Cấp độ CEFR cho Tập sách:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={cefrValue}
                  onChange={(e) => setCefrValue(e.target.value)}
                  placeholder="Ví dụ: A1, A2, B1..."
                  className="flex-1 px-3 py-1.5 border border-blue-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <button
                  type="submit"
                  disabled={isPendingCefr}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                >
                  {isPendingCefr ? "Đang lưu..." : "Lưu"}
                </button>
                {volume.cefrLevel && (
                  <button
                    type="button"
                    onClick={() => {
                      setCefrValue(volume.cefrLevel || "");
                      setIsEditingCefr(false);
                    }}
                    className="px-3 py-1.5 text-xs text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
                  >
                    Hủy
                  </button>
                )}
              </div>
              {cefrError && (
                <p className="text-xs font-medium text-red-600">{cefrError}</p>
              )}
            </form>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Quản lý file PDF Sách Giáo Khoa gốc và cấu hình trang offset cho tập sách này.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {blocks.map((block) => (
          <PdfBlockCard key={block.key} volumeId={volume.id} block={block} />
        ))}
      </div>
    </div>
  );
}

function PdfBlockCard({
  volumeId,
  block,
}: {
  volumeId: number;
  block: BlockConfig;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasFile = Boolean(block.pdfPath);
  const showForm = !hasFile || isEditing;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.append("volumeId", volumeId.toString());
    formData.append("docType", block.key);

    startTransition(async () => {
      try {
        const res = await uploadVolumePdf(formData);
        if (!res.success) {
          setErrorMsg(res.error || "Đã xảy ra lỗi.");
        } else {
          setIsEditing(false);
        }
      } catch (err: any) {
        console.error("Upload error:", err);
        setErrorMsg("Đã xảy ra lỗi khi tải file.");
      }
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            {block.key.toUpperCase()}
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{block.title}</h2>
        </div>

        {hasFile && !isEditing && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Đã có file
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {errorMsg}
        </div>
      )}

      {!showForm && hasFile ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-gray-50 rounded-lg p-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-700">
              Đường dẫn file:{" "}
              <code className="bg-gray-200 px-2 py-0.5 rounded text-gray-900 text-xs font-mono">
                {block.pdfPath}
              </code>
            </p>
            <p className="text-sm font-semibold text-blue-700">
              Offset:{" "}
              <span className="text-base font-bold">
                {block.offset !== null && block.offset > 0
                  ? `+${block.offset}`
                  : block.offset}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            Thay file khác
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File PDF ({block.title}) <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              name="file"
              accept=".pdf"
              required
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trang in sách <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="printedPage"
                placeholder="Ví dụ: 29"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Số trang được in ở góc trang sách.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trang PDF thật tương ứng <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="actualPdfPage"
                placeholder="Ví dụ: 45"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Số trang thực tế hiển thị trên trình đọc PDF.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            {hasFile && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setErrorMsg(null);
                }}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
