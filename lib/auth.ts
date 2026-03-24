/**
 * 인증 — JWT 기반 세션 관리
 */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const COOKIE_NAME = "mbg-session";
const JWT_EXPIRY = "24h";

export interface Session {
  userId: string;
  username: string;
  displayName: string;
  role: "admin" | "user";
  groupId?: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "dev-secret-change-in-production-please";
  return new TextEncoder().encode(secret);
}

/** JWT 토큰 생성 */
export async function createToken(session: Session): Promise<string> {
  return new SignJWT({
    sub: session.userId,
    username: session.username,
    displayName: session.displayName,
    role: session.role,
    groupId: session.groupId || null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());
}

/** JWT 토큰 검증 */
export async function verifyToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.sub as string,
      username: payload.username as string,
      displayName: payload.displayName as string,
      role: payload.role as "admin" | "user",
      groupId: (payload.groupId as string) || undefined,
    };
  } catch {
    return null;
  }
}

/** 쿠키에서 세션 가져오기 (서버 컴포넌트 / Route Handler용) */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Request에서 세션 가져오기 (proxy.ts / API 라우트용) */
export async function getSessionFromRequest(
  request: NextRequest
): Promise<Session | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** 인증 필수 — 실패 시 throw */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

/** 관리자 필수 — 실패 시 throw */
export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth();
  if (session.role !== "admin") throw new Error("FORBIDDEN");
  return session;
}

/** 로그인 쿠키 설정 헤더 생성 */
export function createSessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400${secure}`;
}

/** 로그아웃 쿠키 (즉시 만료) */
export function createLogoutCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`;
}

export { COOKIE_NAME };
