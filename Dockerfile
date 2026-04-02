# ============================================
# korean-broadcast-generator Dockerfile
# Node.js + Playwright + TeX Live + Ghostscript + Prisma
# ============================================

# --- Stage 1: Build ---
FROM node:20-bookworm AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Prisma 스키마 복사 및 클라이언트 생성
COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-bookworm-slim AS runner

# 시스템 패키지: Playwright Chromium 의존성 + TeX Live + Ghostscript + 한글 폰트
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Playwright Chromium 런타임 의존성
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
    libxshmfence1 libx11-xcb1 libdbus-1-3 \
    # Ghostscript (PDF → 투명 PNG)
    ghostscript \
    # TeX Live (XeLaTeX + TikZ + 한글)
    texlive-xetex \
    texlive-latex-extra \
    texlive-pictures \
    texlive-fonts-recommended \
    texlive-lang-korean \
    fonts-nanum \
    fontconfig \
    # 유틸리티
    ca-certificates \
    # OpenSSL for Prisma
    openssl \
    && rm -rf /var/lib/apt/lists/* \
    && fc-cache -fv

# Playwright Chromium 브라우저 설치
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright@1.58.2 install chromium

WORKDIR /app

# 환경변수 (Linux 경로)
ENV NODE_ENV=production
ENV LATEX_PATH=/usr/bin
ENV GS_PATH=/usr/bin/gs
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# standalone 빌드 결과물 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# playwright 패키지를 standalone node_modules에 병합
# (serverExternalPackages로 지정된 패키지는 standalone에 포함 안 됨)
COPY --from=builder /app/node_modules/playwright ./node_modules/playwright
COPY --from=builder /app/node_modules/playwright-core ./node_modules/playwright-core

# Prisma 클라이언트 및 CLI 복사
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma

# public 폴더 복사
COPY --from=builder /app/public ./public

# 마이그레이션 스크립트 및 ts-node 복사
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules/ts-node ./node_modules/ts-node
COPY --from=builder /app/node_modules/@tsconfig ./node_modules/@tsconfig
COPY --from=builder /app/node_modules/@cspotcode ./node_modules/@cspotcode
COPY --from=builder /app/node_modules/acorn-walk ./node_modules/acorn-walk
COPY --from=builder /app/node_modules/acorn ./node_modules/acorn
COPY --from=builder /app/node_modules/arg ./node_modules/arg
COPY --from=builder /app/node_modules/create-require ./node_modules/create-require
COPY --from=builder /app/node_modules/diff ./node_modules/diff
COPY --from=builder /app/node_modules/make-error ./node_modules/make-error
COPY --from=builder /app/node_modules/v8-compile-cache-lib ./node_modules/v8-compile-cache-lib
COPY --from=builder /app/node_modules/yn ./node_modules/yn
COPY --from=builder /app/node_modules/typescript ./node_modules/typescript
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# data 초기 파일 복사 (Volume 마운트 시 Volume 내용이 우선됨)
# 파일 저장소(problems)는 계속 Volume 사용
COPY --from=builder /app/data ./data-init

# 시작 스크립트: DB 마이그레이션 실행 후 서버 시작
RUN echo '#!/bin/sh\n\
set -e\n\
\n\
# 파일 저장소 디렉토리 초기화 (Volume이 비어있을 때)\n\
if [ ! -d /app/data/libraries ]; then\n\
  echo "Initializing data directory..."\n\
  mkdir -p /app/data/libraries\n\
  if [ -d /app/data-init/libraries ]; then\n\
    cp -r /app/data-init/libraries/* /app/data/libraries/ 2>/dev/null || true\n\
  fi\n\
fi\n\
\n\
# Prisma 스키마 동기화\n\
echo "Syncing database schema..."\n\
npx prisma db push --skip-generate\n\
\n\
# JSON → PostgreSQL 마이그레이션 (최초 1회만)\n\
if [ ! -f /app/data/.migrated ]; then\n\
  if [ -f /app/data/users.json ]; then\n\
    echo "Running JSON to PostgreSQL migration..."\n\
    npx ts-node scripts/migrate-to-postgres.ts\n\
    touch /app/data/.migrated\n\
    echo "Migration completed!"\n\
  else\n\
    echo "No JSON files to migrate, skipping..."\n\
    touch /app/data/.migrated\n\
  fi\n\
fi\n\
\n\
# 서버 시작\n\
exec node server.js' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"]
