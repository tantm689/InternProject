import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/app/admin/db";

interface RouteParams {
  params: Promise<{
    id: string;
    type: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, type } = await params;
    const lessonId = parseInt(id, 10);

    if (isNaN(lessonId) || !["sgk", "sbt", "teacher", "sbt_answer"].includes(type)) {
      return NextResponse.json({ error: "Tham số không hợp lệ" }, { status: 400 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Không tìm thấy bài học" }, { status: 404 });
    }

    let cutPath: string | null = null;
    if (type === "sgk") {
      cutPath = lesson.sgkCutPath;
    } else if (type === "sbt") {
      cutPath = lesson.sbtCutPath;
    } else if (type === "teacher") {
      cutPath = lesson.teacherCutPath;
    } else if (type === "sbt_answer") {
      cutPath = lesson.sbtAnswerCutPath;
    }

    if (!cutPath) {
      return NextResponse.json({ error: "Chưa có file PDF đã cắt" }, { status: 404 });
    }

    const fullPath = path.join(process.cwd(), cutPath);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "File PDF không tồn tại trên hệ thống" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(fullPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    console.error("API Get Lesson PDF Error:", error);
    return NextResponse.json({ error: "Lỗi máy chủ khi đọc file PDF" }, { status: 500 });
  }
}
