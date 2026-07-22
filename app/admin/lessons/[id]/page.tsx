import { notFound } from "next/navigation";
import { prisma } from "../../db";
import LessonPdfCutter from "./_components/lesson-pdf-cutter";
import LessonTabsManager from "./_components/lesson-tabs-manager";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LessonAdminPage({ params }: PageProps) {
  const { id } = await params;
  const lessonId = parseInt(id, 10);

  if (isNaN(lessonId)) {
    notFound();
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      volume: true,
      vocabulary: {
        orderBy: { order: "asc" },
      },
      dialogues: {
        orderBy: [{ dialogueNumber: "asc" }, { lineOrder: "asc" }],
      },
      grammarPoints: {
        orderBy: { order: "asc" },
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: {
              examples: {
                orderBy: [{ groupOrder: "asc" }, { order: "asc" }],
              },
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Tập {lesson.volume.number} ({lesson.volume.title}) — Bài {lesson.number}
            </span>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{lesson.title}</h1>
          </div>
        </div>

        {/* 1. PDF Cutter Section */}
        <LessonPdfCutter lesson={lesson} />

        {/* 2. Tabs Section (3 Tabs: Vocabulary, Dialogue, Grammar) */}
        <LessonTabsManager
          lessonId={lesson.id}
          vocabulary={lesson.vocabulary}
          dialogues={lesson.dialogues}
          grammarPoints={lesson.grammarPoints}
          teacherCutPath={lesson.teacherCutPath}
        />
      </div>
    </div>
  );
}
