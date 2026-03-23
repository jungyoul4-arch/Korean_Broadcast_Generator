import { NextRequest, NextResponse } from "next/server";
import { renderMultiple } from "@/lib/renderer";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: Array<{ html: string; number: number }> = body.items;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "렌더링할 항목이 없습니다" },
        { status: 400 }
      );
    }

    const results = await renderMultiple(items);

    const pngResults = results.map((r) => ({
      number: r.number,
      pngBase64: r.pngBuffer.toString("base64"),
      width: r.width,
      height: r.height,
    }));

    return NextResponse.json({ success: true, results: pngResults });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "렌더링 중 오류가 발생했습니다";
    console.error("Render error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
