/**
 * JSON → PostgreSQL 마이그레이션 스크립트
 * 실행: npx ts-node scripts/migrate-to-postgres.ts
 *
 * 주의: DATABASE_URL 환경변수가 설정되어 있어야 합니다.
 */
import { PrismaClient, Role, ItemType } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), "data");

interface OldUser {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  role: "admin" | "user";
  groupId?: string;
  createdAt: string;
}

interface OldGroup {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
  createdAt: string;
  createdBy: string;
}

interface OldProblem {
  id: string;
  createdAt: string;
  ownerId: string;
  itemType?: "problem" | "lecture-note";
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

async function migrateUsers(): Promise<Map<string, string>> {
  const usersPath = path.join(DATA_DIR, "users.json");
  const idMap = new Map<string, string>();

  if (!fs.existsSync(usersPath)) {
    console.log("users.json 없음 - 스킵");
    return idMap;
  }

  const { users } = JSON.parse(fs.readFileSync(usersPath, "utf-8")) as {
    users: OldUser[];
  };

  console.log(`${users.length}명 유저 마이그레이션 시작...`);

  for (const user of users) {
    try {
      const created = await prisma.user.upsert({
        where: { username: user.username },
        update: {},
        create: {
          id: user.id,
          username: user.username,
          passwordHash: user.passwordHash,
          displayName: user.displayName,
          role: user.role === "admin" ? Role.ADMIN : Role.USER,
          createdAt: new Date(user.createdAt),
          // groupId는 나중에 설정
        },
      });
      idMap.set(user.id, created.id);
      console.log(`  ✓ 유저: ${user.username}`);
    } catch (e) {
      console.error(`  ✗ 유저 실패: ${user.username}`, e);
    }
  }

  return idMap;
}

async function migrateGroups(userIdMap: Map<string, string>): Promise<void> {
  const groupsPath = path.join(DATA_DIR, "groups.json");

  if (!fs.existsSync(groupsPath)) {
    console.log("groups.json 없음 - 스킵");
    return;
  }

  const { groups } = JSON.parse(fs.readFileSync(groupsPath, "utf-8")) as {
    groups: OldGroup[];
  };

  console.log(`${groups.length}개 그룹 마이그레이션 시작...`);

  for (const group of groups) {
    try {
      // createdBy가 존재하는지 확인
      const creatorId = userIdMap.get(group.createdBy) || group.createdBy;
      const creatorExists = await prisma.user.findUnique({
        where: { id: creatorId },
      });

      if (!creatorExists) {
        console.log(`  ⚠ 그룹 ${group.name}: 생성자 없음, 스킵`);
        continue;
      }

      await prisma.group.upsert({
        where: { id: group.id },
        update: {},
        create: {
          id: group.id,
          name: group.name,
          description: group.description || null,
          createdById: creatorId,
          createdAt: new Date(group.createdAt),
        },
      });

      // 멤버들의 groupId 업데이트
      for (const memberId of group.memberIds) {
        const actualMemberId = userIdMap.get(memberId) || memberId;
        try {
          await prisma.user.update({
            where: { id: actualMemberId },
            data: { groupId: group.id },
          });
        } catch {
          // 유저가 없으면 무시
        }
      }

      console.log(`  ✓ 그룹: ${group.name} (${group.memberIds.length}명)`);
    } catch (e) {
      console.error(`  ✗ 그룹 실패: ${group.name}`, e);
    }
  }
}

async function migrateProblems(userIdMap: Map<string, string>): Promise<void> {
  const librariesDir = path.join(DATA_DIR, "libraries");

  if (!fs.existsSync(librariesDir)) {
    console.log("libraries 폴더 없음 - 스킵");
    return;
  }

  const userDirs = fs.readdirSync(librariesDir).filter((d) => {
    return fs.statSync(path.join(librariesDir, d)).isDirectory();
  });

  let totalProblems = 0;

  for (const userId of userDirs) {
    const indexPath = path.join(librariesDir, userId, "library.json");
    if (!fs.existsSync(indexPath)) continue;

    const { problems } = JSON.parse(fs.readFileSync(indexPath, "utf-8")) as {
      problems: OldProblem[];
    };

    console.log(`  유저 ${userId}: ${problems.length}개 문제...`);

    for (const p of problems) {
      try {
        const actualOwnerId = userIdMap.get(p.ownerId || userId) || p.ownerId || userId;

        // ownerId가 존재하는지 확인
        const ownerExists = await prisma.user.findUnique({
          where: { id: actualOwnerId },
        });

        if (!ownerExists) {
          console.log(`    ⚠ 문제 ${p.id}: 소유자 없음, 스킵`);
          continue;
        }

        await prisma.savedProblem.upsert({
          where: { id: p.id },
          update: {},
          create: {
            id: p.id,
            ownerId: actualOwnerId,
            itemType:
              p.itemType === "lecture-note"
                ? ItemType.LECTURE_NOTE
                : ItemType.PROBLEM,
            linkedProblemNumber: p.linkedProblemNumber || null,
            subject: p.subject || "",
            unitName: p.unitName || "",
            type: p.type || "",
            points: p.points || 0,
            difficulty: p.difficulty || 0,
            source: p.source || "",
            tags: p.tags || [],
            bodyHtml: p.bodyHtml || "",
            headerText: p.headerText || null,
            footerText: p.footerText || null,
            hasOriginal: p.hasOriginal || false,
            hasProblemPng: p.hasProblemPng ?? true,
            hasContiPng: p.hasContiPng || false,
            hasHtml: p.hasHtml ?? true,
            hasContiHtml: p.hasContiHtml || false,
            createdAt: new Date(p.createdAt),
          },
        });

        totalProblems++;
      } catch (e) {
        console.error(`    ✗ 문제 실패: ${p.id}`, e);
      }
    }
  }

  console.log(`총 ${totalProblems}개 문제 마이그레이션 완료`);
}

async function backupOldFiles(): Promise<void> {
  const usersPath = path.join(DATA_DIR, "users.json");
  const groupsPath = path.join(DATA_DIR, "groups.json");

  if (fs.existsSync(usersPath)) {
    fs.renameSync(usersPath, usersPath + ".migrated.bak");
    console.log("users.json → users.json.migrated.bak");
  }

  if (fs.existsSync(groupsPath)) {
    fs.renameSync(groupsPath, groupsPath + ".migrated.bak");
    console.log("groups.json → groups.json.migrated.bak");
  }

  // library.json 파일들은 백업만 하고 유지 (파일은 계속 사용)
  const librariesDir = path.join(DATA_DIR, "libraries");
  if (fs.existsSync(librariesDir)) {
    const userDirs = fs.readdirSync(librariesDir);
    for (const userId of userDirs) {
      const indexPath = path.join(librariesDir, userId, "library.json");
      if (fs.existsSync(indexPath)) {
        fs.renameSync(indexPath, indexPath + ".migrated.bak");
      }
    }
    console.log("library.json 파일들 백업 완료");
  }
}

async function main() {
  console.log("========================================");
  console.log("JSON → PostgreSQL 마이그레이션 시작");
  console.log("========================================\n");

  try {
    // 연결 테스트
    await prisma.$connect();
    console.log("✓ 데이터베이스 연결 성공\n");

    // 1. 유저 마이그레이션
    console.log("[1/4] 유저 마이그레이션");
    const userIdMap = await migrateUsers();
    console.log("");

    // 2. 그룹 마이그레이션
    console.log("[2/4] 그룹 마이그레이션");
    await migrateGroups(userIdMap);
    console.log("");

    // 3. 문제 마이그레이션
    console.log("[3/4] 문제 마이그레이션");
    await migrateProblems(userIdMap);
    console.log("");

    // 4. 기존 파일 백업
    console.log("[4/4] 기존 파일 백업");
    await backupOldFiles();
    console.log("");

    console.log("========================================");
    console.log("마이그레이션 완료!");
    console.log("========================================");
  } catch (e) {
    console.error("마이그레이션 실패:", e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
