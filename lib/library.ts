/**
 * 라이브러리 — PostgreSQL + Prisma 기반 (파일은 Volume 유지)
 * 메타데이터: PostgreSQL
 * 파일: data/libraries/{userId}/problems/{id}/
 */
import fs from "fs";
import path from "path";
import { ItemType, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { getGroupByUserId } from "./groups";

// ── 타입 ──────────────────────────────────────

export interface SavedProblem {
  id: string;
  createdAt: string;
  ownerId: string;
  ownerName?: string;

  itemType: "problem" | "lecture-note";
  linkedProblemNumber?: number;

  subject: string;
  unitName: string;
  type: string;
  points: number;
  difficulty: number;
  source: string;
  tags: string[];

  hasOriginal: boolean;
  hasProblemPng: boolean;
  hasContiPng: boolean;
  hasHtml: boolean;
  hasContiHtml: boolean;

  bodyHtml: string;
  headerText?: string;
  footerText?: string;
}

export interface SaveProblemInput {
  itemType?: "problem" | "lecture-note";
  linkedProblemNumber?: number;
  subject: string;
  unitName: string;
  type: string;
  points: number;
  difficulty: number;
  source: string;
  bodyHtml: string;
  headerText?: string;
  footerText?: string;
  tags?: string[];
  originalImageBase64?: string;
  problemPngBase64: string;
  contiPngBase64?: string;
  html: string;
  contiHtml?: string;
}

export interface LibraryFilter {
  subject?: string;
  unitName?: string;
  type?: string;
  tag?: string;
  search?: string;
  difficulty?: number;
  ownerId?: string;
  itemType?: "problem" | "lecture-note";
  offset?: number;
  limit?: number;
}

// ── 경로 헬퍼 (파일 저장용) ──────────────────────

const DATA_DIR = path.join(process.cwd(), "data");
const LIBRARIES_DIR = path.join(DATA_DIR, "libraries");

function userProblemsDir(userId: string) {
  return path.join(LIBRARIES_DIR, userId, "problems");
}

function ensureUserDirs(userId: string) {
  const probDir = userProblemsDir(userId);
  if (!fs.existsSync(probDir)) fs.mkdirSync(probDir, { recursive: true });
}

// ── ItemType 변환 ────────────────────────────

function toItemTypeString(itemType: ItemType): "problem" | "lecture-note" {
  return itemType === ItemType.LECTURE_NOTE ? "lecture-note" : "problem";
}

function toItemTypeEnum(itemType: "problem" | "lecture-note"): ItemType {
  return itemType === "lecture-note" ? ItemType.LECTURE_NOTE : ItemType.PROBLEM;
}

// ── Prisma → 기존 인터페이스 변환 ──────────────

function toSavedProblem(
  dbProblem: {
    id: string;
    ownerId: string;
    itemType: ItemType;
    linkedProblemNumber: number | null;
    subject: string;
    unitName: string;
    type: string;
    points: number;
    difficulty: number;
    source: string;
    tags: string[];
    bodyHtml: string;
    headerText: string | null;
    footerText: string | null;
    hasOriginal: boolean;
    hasProblemPng: boolean;
    hasContiPng: boolean;
    hasHtml: boolean;
    hasContiHtml: boolean;
    createdAt: Date;
    owner?: { displayName: string } | null;
  },
  ownerName?: string
): SavedProblem {
  return {
    id: dbProblem.id,
    createdAt: dbProblem.createdAt.toISOString(),
    ownerId: dbProblem.ownerId,
    ownerName: ownerName || dbProblem.owner?.displayName,
    itemType: toItemTypeString(dbProblem.itemType),
    linkedProblemNumber: dbProblem.linkedProblemNumber || undefined,
    subject: dbProblem.subject,
    unitName: dbProblem.unitName,
    type: dbProblem.type,
    points: dbProblem.points,
    difficulty: dbProblem.difficulty,
    source: dbProblem.source,
    tags: dbProblem.tags,
    hasOriginal: dbProblem.hasOriginal,
    hasProblemPng: dbProblem.hasProblemPng,
    hasContiPng: dbProblem.hasContiPng,
    hasHtml: dbProblem.hasHtml,
    hasContiHtml: dbProblem.hasContiHtml,
    bodyHtml: dbProblem.bodyHtml,
    headerText: dbProblem.headerText || undefined,
    footerText: dbProblem.footerText || undefined,
  };
}

// ── 자동 태그 생성 ────────────────────────────

export function generateAutoTags(input: {
  subject?: string;
  unitName?: string;
  type?: string;
  difficulty?: number;
  points?: number;
  source?: string;
  hasDiagram?: boolean;
}): string[] {
  const tags: string[] = [];
  if (input.subject) tags.push(input.subject);
  if (input.unitName) tags.push(input.unitName);
  if (input.type) tags.push(input.type);

  const diffLabels: Record<number, string> = {
    1: "기본",
    2: "쉬움",
    3: "보통",
    4: "준킬러",
    5: "킬러",
  };
  if (input.difficulty && diffLabels[input.difficulty]) {
    tags.push(diffLabels[input.difficulty]);
  }
  if (input.points) tags.push(`${input.points}점`);

  if (input.source) {
    const patterns: RegExp[] = [
      /(\d{4})/,
      /(수능|모의고사|학력평가|교육청|평가원)/,
      /(6월|9월|3월|4월|7월|10월|11월)/,
      /(고[123]|중[123])/,
      /(기출)/,
    ];
    for (const pat of patterns) {
      const m = input.source.match(pat);
      if (m) tags.push(m[1]);
    }
  }
  if (input.hasDiagram) tags.push("도형");
  return [...new Set(tags)];
}

// ── ID 생성 ───────────────────────────────────

function generateId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8);
  return `${date}-${rand}`;
}

// ── CRUD ─────────────────────────────────────

/** 문제 저장 (DB + 파일) */
export async function saveProblem(
  userId: string,
  input: SaveProblemInput
): Promise<SavedProblem> {
  const id = generateId();
  const problemDir = path.join(userProblemsDir(userId), id);
  ensureUserDirs(userId);
  fs.mkdirSync(problemDir, { recursive: true });

  // 파일 저장 (Volume)
  if (input.originalImageBase64) {
    fs.writeFileSync(
      path.join(problemDir, "original.png"),
      Buffer.from(input.originalImageBase64, "base64")
    );
  }
  fs.writeFileSync(
    path.join(problemDir, "problem.png"),
    Buffer.from(input.problemPngBase64, "base64")
  );
  if (input.contiPngBase64) {
    fs.writeFileSync(
      path.join(problemDir, "conti.png"),
      Buffer.from(input.contiPngBase64, "base64")
    );
  }
  fs.writeFileSync(path.join(problemDir, "problem.html"), input.html, "utf-8");
  if (input.contiHtml) {
    fs.writeFileSync(path.join(problemDir, "conti.html"), input.contiHtml, "utf-8");
  }

  // 태그 생성
  const itemType = input.itemType || "problem";
  const autoTags = generateAutoTags({
    subject: input.subject,
    unitName: input.unitName,
    type: input.type,
    difficulty: input.difficulty,
    points: input.points,
    source: input.source,
    hasDiagram: input.html?.includes("diagram") || false,
  });
  if (itemType === "lecture-note") autoTags.push("강의노트");
  const allTags = [...new Set([...autoTags, ...(input.tags || [])])];

  // DB 저장
  const dbProblem = await prisma.savedProblem.create({
    data: {
      id,
      ownerId: userId,
      itemType: toItemTypeEnum(itemType),
      linkedProblemNumber: input.linkedProblemNumber || null,
      subject: input.subject || "",
      unitName: input.unitName || "",
      type: input.type || "",
      points: input.points || 0,
      difficulty: input.difficulty || 0,
      source: input.source || "",
      tags: allTags,
      bodyHtml: input.bodyHtml || "",
      headerText: input.headerText || null,
      footerText: input.footerText || null,
      hasOriginal: !!input.originalImageBase64,
      hasProblemPng: true,
      hasContiPng: !!input.contiPngBase64,
      hasHtml: true,
      hasContiHtml: !!input.contiHtml,
    },
    include: { owner: { select: { displayName: true } } },
  });

  const saved = toSavedProblem(dbProblem);

  // meta.json 백업 (선택적)
  fs.writeFileSync(
    path.join(problemDir, "meta.json"),
    JSON.stringify(saved, null, 2),
    "utf-8"
  );

  return saved;
}

/** 라이브러리에 접근 가능한 유저 ID 목록 */
async function getAccessibleUserIds(userId: string): Promise<string[]> {
  const group = await getGroupByUserId(userId);
  if (group) {
    return [...new Set([userId, ...group.memberIds])];
  }
  return [userId];
}

/** 목록 조회 (유저 + 그룹 통합) */
export async function listProblems(
  userId: string,
  filter: LibraryFilter = {}
): Promise<{
  problems: SavedProblem[];
  total: number;
  subjects: string[];
  units: string[];
  allTags: string[];
  owners: { id: string; name: string }[];
}> {
  const userIds = await getAccessibleUserIds(userId);

  // Prisma where 조건 구성
  const where: Prisma.SavedProblemWhereInput = {
    ownerId: { in: userIds },
  };

  if (filter.itemType) {
    where.itemType = toItemTypeEnum(filter.itemType);
  }
  if (filter.subject) {
    where.subject = filter.subject;
  }
  if (filter.unitName) {
    where.unitName = filter.unitName;
  }
  if (filter.type) {
    where.type = filter.type;
  }
  if (filter.difficulty) {
    where.difficulty = filter.difficulty;
  }
  if (filter.tag) {
    where.tags = { has: filter.tag };
  }
  if (filter.ownerId) {
    where.ownerId = filter.ownerId;
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    where.OR = [
      { bodyHtml: { contains: q, mode: "insensitive" } },
      { source: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { unitName: { contains: q, mode: "insensitive" } },
      { tags: { hasSome: [filter.search] } },
    ];
  }

  // 전체 개수
  const total = await prisma.savedProblem.count({ where });

  // 집계 데이터
  const allProblems = await prisma.savedProblem.findMany({
    where: { ownerId: { in: userIds } },
    select: {
      subject: true,
      unitName: true,
      tags: true,
      ownerId: true,
      owner: { select: { displayName: true } },
    },
  });

  const subjects = [...new Set(allProblems.map((p) => p.subject).filter(Boolean))];
  const units = filter.subject
    ? [
        ...new Set(
          allProblems
            .filter((p) => p.subject === filter.subject)
            .map((p) => p.unitName)
            .filter(Boolean)
        ),
      ]
    : [...new Set(allProblems.map((p) => p.unitName).filter(Boolean))];
  const allTags = [...new Set(allProblems.flatMap((p) => p.tags))].sort();
  const owners = [
    ...new Map(
      allProblems.map((p) => [
        p.ownerId,
        { id: p.ownerId, name: p.owner?.displayName || p.ownerId },
      ])
    ).values(),
  ];

  // 페이지네이션된 결과
  const offset = filter.offset || 0;
  const limit = filter.limit || 50;

  const problems = await prisma.savedProblem.findMany({
    where,
    include: { owner: { select: { displayName: true } } },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
  });

  return {
    problems: problems.map((p) => toSavedProblem(p)),
    total,
    subjects,
    units,
    allTags,
    owners,
  };
}

/** 관리자: 전체 유저 라이브러리 조회 */
export async function listAllProblems(
  filter: LibraryFilter = {}
): Promise<ReturnType<typeof listProblems>> {
  // Prisma where 조건 구성
  const where: Prisma.SavedProblemWhereInput = {};

  if (filter.itemType) {
    where.itemType = toItemTypeEnum(filter.itemType);
  }
  if (filter.subject) {
    where.subject = filter.subject;
  }
  if (filter.unitName) {
    where.unitName = filter.unitName;
  }
  if (filter.type) {
    where.type = filter.type;
  }
  if (filter.difficulty) {
    where.difficulty = filter.difficulty;
  }
  if (filter.tag) {
    where.tags = { has: filter.tag };
  }
  if (filter.ownerId) {
    where.ownerId = filter.ownerId;
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    where.OR = [
      { bodyHtml: { contains: q, mode: "insensitive" } },
      { source: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
      { unitName: { contains: q, mode: "insensitive" } },
      { tags: { hasSome: [filter.search] } },
    ];
  }

  const total = await prisma.savedProblem.count({ where });

  // 집계 데이터
  const allProblems = await prisma.savedProblem.findMany({
    select: {
      subject: true,
      unitName: true,
      tags: true,
      ownerId: true,
      owner: { select: { displayName: true } },
    },
  });

  const subjects = [...new Set(allProblems.map((p) => p.subject).filter(Boolean))];
  const units = [...new Set(allProblems.map((p) => p.unitName).filter(Boolean))];
  const allTags = [...new Set(allProblems.flatMap((p) => p.tags))].sort();
  const owners = [
    ...new Map(
      allProblems.map((p) => [
        p.ownerId,
        { id: p.ownerId, name: p.owner?.displayName || p.ownerId },
      ])
    ).values(),
  ];

  const offset = filter.offset || 0;
  const limit = filter.limit || 50;

  const problems = await prisma.savedProblem.findMany({
    where,
    include: { owner: { select: { displayName: true } } },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
  });

  return {
    problems: problems.map((p) => toSavedProblem(p)),
    total,
    subjects,
    units,
    allTags,
    owners,
  };
}

/** 개별 문제 조회 */
export async function getProblem(
  problemId: string,
  userId?: string
): Promise<SavedProblem | null> {
  const where: Prisma.SavedProblemWhereInput = {
    id: problemId,
  };

  if (userId) {
    const userIds = await getAccessibleUserIds(userId);
    where.ownerId = { in: userIds };
  }

  const problem = await prisma.savedProblem.findFirst({
    where,
    include: { owner: { select: { displayName: true } } },
  });

  return problem ? toSavedProblem(problem) : null;
}

/** 문제 파일 읽기 (PNG) - 파일 시스템에서 직접 읽기 */
export async function getProblemFile(
  problemId: string,
  fileType: "original" | "problem" | "conti",
  userId?: string
): Promise<Buffer | null> {
  // DB에서 문제 조회하여 ownerId 확인
  const problem = await getProblem(problemId, userId);
  if (!problem) return null;

  const filenames: Record<string, string> = {
    original: "original.png",
    problem: "problem.png",
    conti: "conti.png",
  };

  const filePath = path.join(
    userProblemsDir(problem.ownerId),
    problemId,
    filenames[fileType]
  );

  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}

/** 태그 수정 (본인 문제만) */
export async function updateProblemTags(
  userId: string,
  problemId: string,
  tags: string[]
): Promise<SavedProblem | null> {
  // 본인 문제인지 확인
  const existing = await prisma.savedProblem.findFirst({
    where: { id: problemId, ownerId: userId },
  });

  if (!existing) return null;

  const uniqueTags = [...new Set(tags)];

  const updated = await prisma.savedProblem.update({
    where: { id: problemId },
    data: { tags: uniqueTags },
    include: { owner: { select: { displayName: true } } },
  });

  // meta.json 백업 업데이트
  const metaPath = path.join(userProblemsDir(userId), problemId, "meta.json");
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      meta.tags = uniqueTags;
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
    } catch {
      // 무시
    }
  }

  return toSavedProblem(updated);
}

/** 문제 삭제 (본인 문제만) */
export async function deleteProblem(
  userId: string,
  problemId: string
): Promise<boolean> {
  // 본인 문제인지 확인
  const existing = await prisma.savedProblem.findFirst({
    where: { id: problemId, ownerId: userId },
  });

  if (!existing) return false;

  // DB 삭제
  await prisma.savedProblem.delete({
    where: { id: problemId },
  });

  // 파일 삭제
  const problemDir = path.join(userProblemsDir(userId), problemId);
  if (fs.existsSync(problemDir)) {
    fs.rmSync(problemDir, { recursive: true, force: true });
  }

  return true;
}
