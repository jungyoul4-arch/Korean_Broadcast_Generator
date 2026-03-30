import { NextRequest, NextResponse } from "next/server";
import { analyzeLectureNoteImage } from "@/lib/claude";
import { generateLectureNoteHtml, type RenderOptions } from "@/lib/template";
import type { BackgroundPreset } from "@/lib/theme";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "이미지가 없습니다" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    let mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif" =
      "image/png";
    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      mediaType = "image/jpeg";
    } else if (file.type === "image/webp") {
      mediaType = "image/webp";
    } else if (file.type === "image/gif") {
      mediaType = "image/gif";
    }

    const source = formData.get("source") as string | null;
    const headerText = formData.get("headerText") as string | null;
    const background = (formData.get("background") as BackgroundPreset) || "transparent";
    const renderOptions: RenderOptions = { background };
    const result = await analyzeLectureNoteImage(base64, mediaType, source || undefined);

    const html = generateLectureNoteHtml({
      noteHtml: result.noteHtml,
      noteTitle: result.noteTitle,
      subject: result.noteSubject,
      source: source || undefined,
      headerText: headerText || undefined,
    }, renderOptions);

    return NextResponse.json({
      success: true,
      ...result,
      html,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "강의노트 분석 중 오류가 발생했습니다";
    console.error("Note analyze error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
