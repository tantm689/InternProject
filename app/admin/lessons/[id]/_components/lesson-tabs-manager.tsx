"use client";

import React, { useState, useTransition } from "react";
import { importVocabulary, importDialogue, importGrammar } from "../import-actions";

export interface VocabularyItem {
  id: number;
  order: number;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  partOfSpeech: string | null;
  exampleHanzi: string | null;
  examplePinyin: string | null;
  exampleVi: string | null;
}

export interface DialogueItem {
  id: number;
  dialogueNumber: number;
  lineOrder: number;
  speaker: string | null;
  hanzi: string;
  pinyin: string | null;
  meaningVi: string;
  audioUrl: string | null;
}

export interface GrammarExampleItem {
  id: number;
  order: number;
  groupOrder?: number;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
}

export interface GrammarSectionItem {
  id: number;
  parentId: number | null;
  order: number;
  label: string;
  level: string;
  text: string;
  examples: GrammarExampleItem[];
}

export interface GrammarPointItem {
  id: number;
  order: number;
  title: string;
  sections: GrammarSectionItem[];
}

interface LessonTabsManagerProps {
  lessonId: number;
  vocabulary: VocabularyItem[];
  dialogues: DialogueItem[];
  grammarPoints: GrammarPointItem[];
  teacherCutPath?: string | null;
}

export default function LessonTabsManager({
  lessonId,
  vocabulary,
  dialogues,
  grammarPoints,
}: LessonTabsManagerProps) {
  const [activeTab, setActiveTab] = useState<"vocab" | "dialogue" | "grammar">("vocab");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 bg-gray-50/50 p-1.5 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab("vocab")}
          className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "vocab"
              ? "bg-white text-blue-700 shadow-sm border border-gray-200/80"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <span>📖 Từ vựng</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              activeTab === "vocab"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {vocabulary.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dialogue")}
          className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "dialogue"
              ? "bg-white text-blue-700 shadow-sm border border-gray-200/80"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <span>💬 Hội thoại</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              activeTab === "dialogue"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {dialogues.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("grammar")}
          className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === "grammar"
              ? "bg-white text-blue-700 shadow-sm border border-gray-200/80"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <span>🧩 Ngữ pháp</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              activeTab === "grammar"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {grammarPoints.length}
          </span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {activeTab === "vocab" && (
          <VocabTab lessonId={lessonId} items={vocabulary} />
        )}
        {activeTab === "dialogue" && (
          <DialogueTab lessonId={lessonId} items={dialogues} />
        )}
        {activeTab === "grammar" && (
          <GrammarTab lessonId={lessonId} items={grammarPoints} />
        )}
      </div>
    </div>
  );
}

// ==========================================
// 1. TAB TỪ VỰNG
// ==========================================
function VocabTab({ lessonId, items }: { lessonId: number; items: VocabularyItem[] }) {
  const [jsonInput, setJsonInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isScanning, setIsScanning] = useState(false);

  const sampleJson = `[
  {
    "order": 1,
    "hanzi": "你好",
    "pinyin": "nǐ hǎo",
    "meaningVi": "xin chào",
    "partOfSpeech": "thán từ",
    "exampleHanzi": "你好！很高興認識你。",
    "examplePinyin": "Nǐ hǎo! Hěn gāoxìng rènshì nǐ.",
    "exampleVi": "Xin chào! Rất vui được quen biết bạn."
  }
]`;

  const handleScanVocab = async () => {
    setIsScanning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/scan/vocab-dialogue`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Đã xảy ra lỗi khi quét AI.");
      } else {
        setJsonInput(JSON.stringify(data.vocabulary || [], null, 2));
        setSuccessMsg(
          `Đã quét AI xong! Tìm thấy ${data.vocabulary?.length || 0} từ vựng. Vui lòng kiểm tra và bấm "Import Từ vựng" ở dưới.`
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể kết nối tới server quét AI.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const res = await importVocabulary(lessonId, jsonInput);
        if (!res.success) {
          setErrorMsg(res.error || "Đã xảy ra lỗi khi import.");
        } else {
          setSuccessMsg(`Import thành công ${res.count} từ vựng!`);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Đã xảy ra lỗi không xác định.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
            <span>✨ Quét AI trích xuất Từ vựng</span>
          </h4>
          <p className="text-xs text-blue-700 mt-0.5">
            Tự động trích xuất danh sách Từ vựng từ file PDF SGK đã cắt.
          </p>
        </div>

        <button
          type="button"
          onClick={handleScanVocab}
          disabled={isScanning}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {isScanning ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Đang quét AI...</span>
            </>
          ) : (
            <span>✨ Quét AI tạo dữ liệu</span>
          )}
        </button>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">Cấu trúc JSON mẫu cho Từ vựng:</h3>
        <pre className="bg-gray-900 text-gray-100 text-xs p-4 rounded-lg overflow-x-auto font-mono">
          {sampleJson}
        </pre>
      </div>

      <form onSubmit={handleImport} className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">Dán dữ liệu JSON Từ vựng vào đây:</label>
        <textarea
          rows={6}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Dán mảng JSON từ vựng [...] vào đây"
          className="w-full p-3 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
        />

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
            {successMsg}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? "Đang import..." : "Import Từ vựng"}
          </button>
        </div>
      </form>

      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-base font-bold text-gray-900 mb-3">Dữ liệu Từ vựng hiện tại ({items.length} từ)</h3>
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Chưa có từ vựng nào trong cơ sở dữ liệu.</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-700 uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2.5 w-12 text-center">STT</th>
                  <th className="px-3 py-2.5">Chữ Hán</th>
                  <th className="px-3 py-2.5">Pinyin</th>
                  <th className="px-3 py-2.5">Từ loại</th>
                  <th className="px-3 py-2.5">Nghĩa tiếng Việt</th>
                  <th className="px-3 py-2.5">Câu ví dụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-center font-medium text-gray-500">{item.order}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-900 text-sm">{item.hanzi}</td>
                    <td className="px-3 py-2.5 text-blue-600 font-medium">{item.pinyin}</td>
                    <td className="px-3 py-2.5 text-gray-500 italic">{item.partOfSpeech || "-"}</td>
                    <td className="px-3 py-2.5 text-gray-800 font-medium">{item.meaningVi}</td>
                    <td className="px-3 py-2.5 space-y-0.5 text-gray-700">
                      {item.exampleHanzi ? (
                        <div>
                          <p className="font-semibold text-gray-900">{item.exampleHanzi}</p>
                          <p className="text-blue-600">{item.examplePinyin}</p>
                          <p className="text-gray-500">{item.exampleVi}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Không có</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. TAB HỘI THOẠI
// ==========================================
function DialogueTab({ lessonId, items }: { lessonId: number; items: DialogueItem[] }) {
  const [jsonInput, setJsonInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isScanning, setIsScanning] = useState(false);

  const sampleJson = `[
  {
    "dialogueNumber": 1,
    "lineOrder": 1,
    "speaker": "A",
    "hanzi": "你好！",
    "pinyin": "Nǐ hǎo!",
    "meaningVi": "Xin chào!"
  }
]`;

  const handleScanDialogue = async () => {
    setIsScanning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/scan/vocab-dialogue`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Đã xảy ra lỗi khi quét AI.");
      } else {
        const dialogueList = data.dialogues || data.dialogue || [];
        setJsonInput(JSON.stringify(dialogueList, null, 2));
        setSuccessMsg(
          `Đã quét AI xong! Tìm thấy ${dialogueList.length} câu hội thoại. Vui lòng kiểm tra và bấm "Import Hội thoại" ở dưới.`
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể kết nối tới server quét AI.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const res = await importDialogue(lessonId, jsonInput);
        if (!res.success) {
          setErrorMsg(res.error || "Đã xảy ra lỗi khi import.");
        } else {
          setSuccessMsg(`Import thành công ${res.count} câu hội thoại!`);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Đã xảy ra lỗi không xác định.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
            <span>✨ Quét AI trích xuất Hội thoại</span>
          </h4>
          <p className="text-xs text-blue-700 mt-0.5">
            Tự động trích xuất các bài Hội thoại từ file PDF SGK đã cắt.
          </p>
        </div>

        <button
          type="button"
          onClick={handleScanDialogue}
          disabled={isScanning}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {isScanning ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Đang quét AI...</span>
            </>
          ) : (
            <span>✨ Quét AI tạo dữ liệu</span>
          )}
        </button>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">Cấu trúc JSON mẫu cho Hội thoại:</h3>
        <pre className="bg-gray-900 text-gray-100 text-xs p-4 rounded-lg overflow-x-auto font-mono">
          {sampleJson}
        </pre>
      </div>

      <form onSubmit={handleImport} className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">Dán dữ liệu JSON Hội thoại vào đây:</label>
        <textarea
          rows={6}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Dán mảng JSON hội thoại [...] vào đây"
          className="w-full p-3 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
        />

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
            {successMsg}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? "Đang import..." : "Import Hội thoại"}
          </button>
        </div>
      </form>

      <div className="pt-4 border-t border-gray-200 space-y-6">
        <h3 className="text-base font-bold text-gray-900">
          Dữ liệu Hội thoại hiện tại ({items.length} câu)
        </h3>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Chưa có bài hội thoại nào trong cơ sở dữ liệu.</p>
        ) : (() => {
          // Group dialogues by dialogueNumber
          const grouped = items.reduce((acc, item) => {
            const dNum = item.dialogueNumber || 1;
            if (!acc[dNum]) acc[dNum] = [];
            acc[dNum].push(item);
            return acc;
          }, {} as Record<number, DialogueItem[]>);

          const dNumbers = Object.keys(grouped).map(Number).sort((a, b) => a - b);

          return (
            <div className="space-y-6">
              {dNumbers.map((dNum) => {
                const lines = grouped[dNum].sort((a, b) => a.lineOrder - b.lineOrder);
                return (
                  <div
                    key={dNum}
                    className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white"
                  >
                    {/* Header */}
                    <div className="bg-blue-900 text-white px-4 py-3 font-bold text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span>💬 Bài hội thoại {dNum}</span>
                      </span>
                      <span className="text-xs bg-blue-800 text-blue-200 px-2.5 py-0.5 rounded-full font-normal">
                        {lines.length} câu
                      </span>
                    </div>

                    {/* Dialogue turns list */}
                    <div className="divide-y divide-gray-100 p-2 sm:p-4 space-y-2">
                      {lines.map((line) => (
                        <div
                          key={line.id}
                          className="p-3 rounded-lg hover:bg-gray-50/80 transition-colors flex items-start gap-3 sm:gap-4"
                        >
                          {/* Line Order number */}
                          <span className="text-xs text-gray-400 font-mono w-5 shrink-0 pt-1 text-center">
                            #{line.lineOrder}
                          </span>

                          {/* Speaker badge */}
                          <div className="w-20 shrink-0 pt-0.5">
                            {line.speaker ? (
                              <span className="inline-block text-xs font-bold text-blue-900 bg-blue-100/90 border border-blue-200/80 px-2.5 py-1 rounded-full text-center w-full truncate">
                                {line.speaker}
                              </span>
                            ) : (
                              <span className="inline-block text-xs text-gray-400 italic text-center w-full">
                                -
                              </span>
                            )}
                          </div>

                          {/* Content block */}
                          <div className="flex-1 space-y-1 leading-snug">
                            <p className="text-base font-bold text-gray-900">
                              {line.hanzi}
                            </p>
                            {line.pinyin && (
                              <p className="text-xs font-medium text-blue-600">
                                {line.pinyin}
                              </p>
                            )}
                            <p className="text-xs text-gray-700 font-medium">
                              {line.meaningVi}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ==========================================
// 3. TAB NGỮ PHÁP (Trình bày sạch sẽ, đẹp mắt theo thiết kế bạn ưng ý)
// ==========================================
function GrammarTab({ lessonId, items }: { lessonId: number; items: GrammarPointItem[] }) {
  const [jsonInput, setJsonInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isScanning, setIsScanning] = useState(false);

  const sampleJson = `[
  {
    "order": 1,
    "title": "A. Câu hỏi với A 不 A",
    "sections": [
      {
        "tempId": "sec_1",
        "parentTempId": null,
        "order": 1,
        "label": "Cấu trúc",
        "level": "main",
        "text": "Câu hỏi nghi vấn A 不 A...",
        "examples": [
          {
            "example_order": 1,
            "sentences": [
              { "hanzi": "他喝咖啡。", "pinyin": "Tā hē kāfēi.", "meaning_vi": "Anh ấy uống cà phê." },
              { "hanzi": "他喝不喝咖啡？", "pinyin": "Tā hē bù hē kāfēi?", "meaning_vi": "Anh ấy có uống cà phê không?" }
            ]
          }
        ]
      }
    ]
  }
]`;

  const handleScanGrammar = async () => {
    setIsScanning(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}/scan/grammar`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Đã xảy ra lỗi khi quét AI điểm ngữ pháp.");
      } else {
        setJsonInput(JSON.stringify(data.grammarPoints || [], null, 2));
        setSuccessMsg(
          `Đã quét AI xong! Tự động tạo ${data.grammarPoints?.length || 0} điểm ngữ pháp. Bấm "Import Ngữ pháp" ở dưới để lưu.`
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Không thể kết nối tới server quét AI ngữ pháp.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const res = await importGrammar(lessonId, jsonInput);
        if (!res.success) {
          setErrorMsg(res.error || "Đã xảy ra lỗi khi import.");
        } else {
          setSuccessMsg(`Import thành công ${res.count} điểm ngữ pháp!`);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Đã xảy ra lỗi không xác định.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Scan Banner for Grammar */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
            <span>✨ Quét AI trích xuất Điểm Ngữ Pháp</span>
          </h4>
          <p className="text-xs text-blue-700 mt-0.5">
            Tự động trích xuất các điểm ngữ pháp, cấu trúc và mối quan hệ cha-con từ file PDF SGK.
          </p>
        </div>

        <button
          type="button"
          onClick={handleScanGrammar}
          disabled={isScanning}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {isScanning ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Đang quét AI... (10-30s)</span>
            </>
          ) : (
            <span>✨ Quét AI tạo dữ liệu</span>
          )}
        </button>
      </div>

      {/* JSON Schema sample */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">
          Cấu trúc JSON mẫu cho Ngữ pháp (bao gồm quan hệ Cha-Con):
        </h3>
        <pre className="bg-gray-900 text-gray-100 text-xs p-4 rounded-lg overflow-x-auto font-mono">
          {sampleJson}
        </pre>
      </div>

      {/* Form import JSON */}
      <form onSubmit={handleImport} className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700">Dán dữ liệu JSON Ngữ pháp vào đây:</label>
        <textarea
          rows={6}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Dán mảng JSON điểm ngữ pháp [...] vào đây hoặc bấm 'Quét AI tạo dữ liệu' ở trên"
          className="w-full p-3 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
        />

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
            {successMsg}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isPending ? "Đang import..." : "Import Ngữ pháp"}
          </button>
        </div>
      </form>

      {/* Display Grammar Points */}
      <div className="pt-4 border-t border-gray-200 space-y-4">
        <h3 className="text-base font-bold text-gray-900">
          Dữ liệu Ngữ pháp hiện tại ({items.length} điểm ngữ pháp)
        </h3>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Chưa có điểm ngữ pháp nào trong cơ sở dữ liệu.</p>
        ) : (
          items.map((gp) => (
            <div key={gp.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white space-y-0">
              <div className="bg-blue-900 text-white px-4 py-2.5 font-bold text-sm flex items-center justify-between">
                <span>{gp.title}</span>
                <span className="text-xs bg-blue-800 px-2 py-0.5 rounded text-blue-200 font-normal">
                  {gp.sections.length} khối nội dung
                </span>
              </div>

              <div className="p-4 space-y-4 bg-white">
                {gp.sections.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-4 rounded-xl border bg-gray-50/80 border-gray-200 shadow-2xs transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-100 text-blue-900 border border-blue-200">
                        {sec.label}
                      </span>
                    </div>

                    {sec.text && (
                      <p className="text-sm font-semibold text-gray-800 mt-1.5 mb-3 leading-relaxed">
                        {sec.text}
                      </p>
                    )}

                    {sec.examples && sec.examples.length > 0 && (() => {
                      // Group examples by groupOrder
                      const exampleGroups = sec.examples.reduce((acc, ex) => {
                        const gNum = ex.groupOrder || ex.order;
                        if (!acc[gNum]) acc[gNum] = [];
                        acc[gNum].push(ex);
                        return acc;
                      }, {} as Record<number, GrammarExampleItem[]>);

                      const groupKeys = Object.keys(exampleGroups).map(Number).sort((a, b) => a - b);

                      return (
                        <div className="mt-3 space-y-2 border-t border-gray-200/60 pt-2.5">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Ví dụ ({groupKeys.length} nhóm / {sec.examples.length} câu):
                          </p>
                          <div className="space-y-3">
                            {groupKeys.map((gNum) => {
                              const sentences = exampleGroups[gNum];
                              return (
                                <div
                                  key={gNum}
                                  className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm flex items-start gap-3"
                                >
                                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold shrink-0 mt-0.5">
                                    {gNum}
                                  </span>
                                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {sentences.map((st) => (
                                      <div key={st.id} className="space-y-0.5 leading-snug border-l-2 border-blue-200 pl-2 md:border-l-0 md:pl-0">
                                        <p className="font-bold text-gray-900 text-base">
                                          {st.hanzi}
                                        </p>
                                        <p className="text-xs font-medium text-blue-600">
                                          {st.pinyin}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          {st.meaningVi}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
