import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/users";
import { createToken, createSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: "아이디와 비밀번호를 입력하세요" }, { status: 400 });
    }

    const user = await authenticateUser(username, password);
    if (!user) {
      return NextResponse.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다" }, { status: 401 });
    }

    const token = await createToken({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      groupId: user.groupId,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    });

    res.headers.set("Set-Cookie", createSessionCookie(token));
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "로그인 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
