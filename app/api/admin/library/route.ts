import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listAllProblems } from "@/lib/library";

/** GET /api/admin/library — 전체 유저 통합 라이브러리 (관리자용) */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const result = await listAllProblems({
    subject: searchParams.get("subject") || undefined,
    unitName: searchParams.get("unit") || undefined,
    type: searchParams.get("type") || undefined,
    tag: searchParams.get("tag") || undefined,
    search: searchParams.get("search") || undefined,
    difficulty: searchParams.get("difficulty") ? parseInt(searchParams.get("difficulty")!) : undefined,
    ownerId: searchParams.get("owner") || undefined,
    offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50,
  });

  return NextResponse.json(result);
}
