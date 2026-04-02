/**
 * 그룹 관리 — PostgreSQL + Prisma 기반
 * 같은 그룹 유저들은 라이브러리를 통합 공유
 */
import { prisma } from "./prisma";

export interface Group {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  createdAt: string;
  createdBy: string;
}

/** Prisma Group + members → 기존 Group 인터페이스 변환 */
function toGroup(dbGroup: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  createdById: string;
  members?: { id: string }[];
}): Group {
  return {
    id: dbGroup.id,
    name: dbGroup.name,
    description: dbGroup.description || undefined,
    memberIds: dbGroup.members?.map((m) => m.id) || [],
    createdAt: dbGroup.createdAt.toISOString(),
    createdBy: dbGroup.createdById,
  };
}

/** 전체 그룹 목록 */
export async function listGroups(): Promise<Group[]> {
  const groups = await prisma.group.findMany({
    include: { members: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  return groups.map(toGroup);
}

/** 그룹 조회 */
export async function getGroup(id: string): Promise<Group | null> {
  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: { select: { id: true } } },
  });

  return group ? toGroup(group) : null;
}

/** 유저가 속한 그룹 조회 */
export async function getGroupByUserId(userId: string): Promise<Group | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      group: {
        include: { members: { select: { id: true } } },
      },
    },
  });

  return user?.group ? toGroup(user.group) : null;
}

/** 그룹 생성 */
export async function createGroup(input: {
  name: string;
  description?: string;
  createdBy: string;
}): Promise<Group> {
  const group = await prisma.group.create({
    data: {
      name: input.name,
      description: input.description || null,
      createdById: input.createdBy,
    },
    include: { members: { select: { id: true } } },
  });

  return toGroup(group);
}

/** 그룹에 멤버 추가 */
export async function addMemberToGroup(
  groupId: string,
  userId: string
): Promise<Group | null> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) return null;

  // 유저의 groupId를 업데이트 (자동으로 이전 그룹에서 제거됨)
  await prisma.user.update({
    where: { id: userId },
    data: { groupId },
  });

  // 업데이트된 그룹 반환
  const updated = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { select: { id: true } } },
  });

  return updated ? toGroup(updated) : null;
}

/** 그룹에서 멤버 제거 */
export async function removeMemberFromGroup(
  groupId: string,
  userId: string
): Promise<Group | null> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) return null;

  // 유저의 groupId를 null로 설정
  await prisma.user.update({
    where: { id: userId },
    data: { groupId: null },
  });

  // 업데이트된 그룹 반환
  const updated = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { select: { id: true } } },
  });

  return updated ? toGroup(updated) : null;
}

/** 그룹 수정 */
export async function updateGroup(
  id: string,
  updates: { name?: string; description?: string }
): Promise<Group | null> {
  try {
    const group = await prisma.group.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description || null }),
      },
      include: { members: { select: { id: true } } },
    });

    return toGroup(group);
  } catch {
    return null;
  }
}

/** 그룹 삭제 (멤버들의 groupId는 CASCADE로 자동 해제) */
export async function deleteGroup(id: string): Promise<boolean> {
  try {
    // 먼저 멤버들의 groupId를 null로 설정 (onDelete: SetNull이 처리하지만 명시적으로)
    await prisma.user.updateMany({
      where: { groupId: id },
      data: { groupId: null },
    });

    await prisma.group.delete({
      where: { id },
    });

    return true;
  } catch {
    return false;
  }
}
