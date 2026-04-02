/**
 * 유저 관리 — PostgreSQL + Prisma 기반 CRUD
 */
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "./prisma";

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  role: "admin" | "user";
  groupId?: string;
  createdAt: string;
}

const BCRYPT_ROUNDS = 10;

/** Prisma Role enum ↔ string 변환 */
function toRoleString(role: Role): "admin" | "user" {
  return role === Role.ADMIN ? "admin" : "user";
}

function toRoleEnum(role: "admin" | "user"): Role {
  return role === "admin" ? Role.ADMIN : Role.USER;
}

/** Prisma User → 기존 User 인터페이스 변환 */
function toUser(dbUser: {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  role: Role;
  groupId: string | null;
  createdAt: Date;
}): User {
  return {
    id: dbUser.id,
    username: dbUser.username,
    passwordHash: dbUser.passwordHash,
    displayName: dbUser.displayName,
    role: toRoleString(dbUser.role),
    groupId: dbUser.groupId || undefined,
    createdAt: dbUser.createdAt.toISOString(),
  };
}

/** 초기 admin 계정 자동 생성 */
export async function ensureAdminExists(): Promise<void> {
  const adminCount = await prisma.user.count({
    where: { role: Role.ADMIN },
  });

  if (adminCount > 0) return;

  const password = process.env.ADMIN_PASSWORD || "admin1234";
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.user.create({
    data: {
      username: "admin",
      passwordHash: hash,
      displayName: "관리자",
      role: Role.ADMIN,
    },
  });

  console.log("초기 관리자 계정 생성됨 (admin / ADMIN_PASSWORD 환경변수)");
}

/** 로그인 인증 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<User | null> {
  await ensureAdminExists();

  const dbUser = await prisma.user.findUnique({
    where: { username },
  });

  if (!dbUser) return null;

  const valid = await bcrypt.compare(password, dbUser.passwordHash);
  return valid ? toUser(dbUser) : null;
}

/** 유저 조회 (ID) */
export async function getUserById(id: string): Promise<User | null> {
  const dbUser = await prisma.user.findUnique({
    where: { id },
  });

  return dbUser ? toUser(dbUser) : null;
}

/** 유저 조회 (username) */
export async function getUserByUsername(username: string): Promise<User | null> {
  const dbUser = await prisma.user.findUnique({
    where: { username },
  });

  return dbUser ? toUser(dbUser) : null;
}

/** 전체 유저 목록 (비밀번호 제외) */
export async function listUsers(): Promise<Omit<User, "passwordHash">[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: toRoleString(u.role),
    groupId: u.groupId || undefined,
    createdAt: u.createdAt.toISOString(),
  }));
}

/** 유저 생성 (관리자용) */
export async function createUser(input: {
  username: string;
  password: string;
  displayName: string;
  role?: "admin" | "user";
}): Promise<Omit<User, "passwordHash">> {
  const existing = await prisma.user.findUnique({
    where: { username: input.username },
  });

  if (existing) {
    throw new Error("이미 존재하는 아이디입니다");
  }

  const hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      passwordHash: hash,
      displayName: input.displayName,
      role: toRoleEnum(input.role || "user"),
    },
  });

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: toRoleString(user.role),
    groupId: user.groupId || undefined,
    createdAt: user.createdAt.toISOString(),
  };
}

/** 유저 수정 (관리자용) */
export async function updateUser(
  id: string,
  updates: {
    displayName?: string;
    role?: "admin" | "user";
    groupId?: string | null;
    password?: string;
  }
): Promise<Omit<User, "passwordHash"> | null> {
  const existing = await prisma.user.findUnique({
    where: { id },
  });

  if (!existing) return null;

  const data: {
    displayName?: string;
    role?: Role;
    groupId?: string | null;
    passwordHash?: string;
  } = {};

  if (updates.displayName !== undefined) {
    data.displayName = updates.displayName;
  }
  if (updates.role !== undefined) {
    data.role = toRoleEnum(updates.role);
  }
  if (updates.groupId !== undefined) {
    data.groupId = updates.groupId || null;
  }
  if (updates.password) {
    data.passwordHash = await bcrypt.hash(updates.password, BCRYPT_ROUNDS);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
  });

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: toRoleString(user.role),
    groupId: user.groupId || undefined,
    createdAt: user.createdAt.toISOString(),
  };
}

/** 유저의 그룹 설정 (그룹 관리에서 사용) */
export async function setUserGroup(
  userId: string,
  groupId: string | undefined
): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { groupId: groupId || null },
    });
    return true;
  } catch {
    return false;
  }
}

/** 유저 삭제 */
export async function deleteUser(id: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) return false;

  // admin은 최소 1명 유지
  if (user.role === Role.ADMIN) {
    const adminCount = await prisma.user.count({
      where: { role: Role.ADMIN },
    });
    if (adminCount <= 1) {
      throw new Error("마지막 관리자는 삭제할 수 없습니다");
    }
  }

  await prisma.user.delete({
    where: { id },
  });

  return true;
}
