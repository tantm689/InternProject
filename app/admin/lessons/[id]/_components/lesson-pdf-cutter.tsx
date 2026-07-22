"use client";

import { useState, useTransition } from "react";
import { cutLessonPdf, DocType } from "../actions";

interface LessonData {
  id: number;
  number: number;
  title: string;
  volumeId: number;
  sgkCutPath: string | null;
  sgkPageStart: number | null;
  sgkPageEnd: number | null;
}

interface LessonPdfCutterProps {
  lesson: LessonData;
}

interface BlockConfig {
  key: DocType;
  title: string;
  cutPath: string | null | undefined;
  pageStart: number | null | undefined;
  pageEnd: number | null | undefined;
}

export default function LessonPdfCutter({ lesson }: LessonPdfCutterProps) {
  const blocks: BlockConfig[] = [
    {
      key: "sgk",
      title: "SGK (Sách giáo khoa)",
      cutPath: lesson.sgkCutPath,
      pageStart: lesson.sgkPageStart,
      pageEnd: lesson.sgkPageEnd,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8 space-y-6">
      <div className="border-b border-gray-100 pb-3">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 0L5 5m4.121 4.121L5 19"
            />
          </svg>
          <span>Cắt PDF Sách Giáo Khoa</span>
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Nhập số trang in trên sách để tự động cắt đoạn PDF tương ứng theo offset của Volume.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-md">
        {blocks.map((block) => (
          <CutterBlockCard key={block.key} lessonId={lesson.id} block={block} />
        ))}
      </div>
    </div>
  );
}

function CutterBlockCard({
  lessonId,
  block,
}: {
  lessonId: number;
  block: BlockConfig;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasCut = Boolean(block.cutPath);
  const showForm = !hasCut || isEditing;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.append("lessonId", lessonId.toString());
    formData.append("docType", block.key);

    startTransition(async () => {
      try {
        const res = await cutLessonPdf(formData);
        if (!res.success) {
          setErrorMsg(res.error || "Đã xảy ra lỗi.");
        } else {
          setIsEditing(false);
        }
      } catch (err: any) {
        console.error("Cut PDF error:", err);
        setErrorMsg("Đã xảy ra lỗi khi cắt PDF.");
      }
    });
  };

  const pdfApiUrl = `/api/files/lessons/${lessonId}/${block.key}`;

  return (
    <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-5 flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <h3 className="font-semibold text-gray-900">{block.title}</h3>
        {hasCut && !isEditing && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Đã cắt
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          {errorMsg}
        </div>
      )}

      {!showForm && hasCut ? (
        <div className="space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Khoảng trang đã cắt:{" "}
              <span className="font-bold text-gray-900">
                Trang {block.pageStart} - {block.pageEnd}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <a
              href={pdfApiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors gap-1.5"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span>Xem file đã cắt</span>
            </a>

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cắt lại
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Trang bắt đầu (số in sách) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="pageStart"
              defaultValue={block.pageStart ?? undefined}
              placeholder="Ví dụ: 29"
              required
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Trang kết thúc (số in sách) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="pageEnd"
              defaultValue={block.pageEnd ?? undefined}
              placeholder="Ví dụ: 42"
              required
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {hasCut && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setErrorMsg(null);
                }}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isPending ? (
                <>
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-white"
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
                  <span>Đang cắt...</span>
                </>
              ) : (
                <span>Cắt PDF SGK</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
