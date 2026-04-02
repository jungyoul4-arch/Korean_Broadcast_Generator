#!/bin/sh
set -e

# 파일 저장소 디렉토리 초기화 (Volume이 비어있을 때)
if [ ! -d /app/data/libraries ]; then
  echo "Initializing data directory..."
  mkdir -p /app/data/libraries
  if [ -d /app/data-init/libraries ]; then
    cp -r /app/data-init/libraries/* /app/data/libraries/ 2>/dev/null || true
  fi
fi

# Prisma 스키마 동기화
echo "Syncing database schema..."
node ./node_modules/prisma/build/index.js db push --skip-generate

# JSON → PostgreSQL 마이그레이션 (최초 1회만)
if [ ! -f /app/data/.migrated ]; then
  if [ -f /app/data/users.json ]; then
    echo "Running JSON to PostgreSQL migration..."
    node --require ./node_modules/ts-node/register scripts/migrate-to-postgres.ts
    touch /app/data/.migrated
    echo "Migration completed!"
  else
    echo "No JSON files to migrate, skipping..."
    touch /app/data/.migrated
  fi
fi

# 서버 시작
exec node server.js
