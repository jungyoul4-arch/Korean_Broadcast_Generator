# 세션 로그 — 2026-03-28

## 프로젝트 개요
- **이름**: Korean Broadcast Generator (KBG)
- **목적**: 국어/EBS 문제·지문·강의노트 이미지를 방송용 투명 PNG로 변환
- **원본**: math-broadcast-generator를 복제하여 국어용으로 전환
- **위치**: `/Users/jungyoulkwak/Desktop/korean-broadcast-generator`
- **서버**: `http://localhost:3001` (dev 모드)

## 완료된 작업

### 1. 프로젝트 복제 및 국어 전환
- math-broadcast-generator → korean-broadcast-generator 복제
- 모든 "Math Broadcast" → "Korean Broadcast", "MBG" → "KBG"

### 2. Gemini 프롬프트 전면 교체 (lib/claude.ts)
- subject: 독서, 문학, 화법과작문, 언어와매체, 공통국어
- unitName: 인문/사회/과학 (독서), 현대시/현대소설/고전시가 (문학) 등
- 객관식 보기(①~⑤) 필수 표시
- 수학 전용 후처리(cases, piecewise) 비활성화

### 3. 세트 기반 UI (app/page.tsx)
- **세트 구조**: 지문(여러 장) + 문제(여러 장) + 강의노트(여러 장)
- 지문 여러 장 → 각각 분석 후 합쳐서 문제에 맥락 전달
- 단독 문제/강의노트 업로드도 메인 화면에 항상 표시
- 머릿말/꼬릿말 입력, 재분석/PNG 다운로드/삭제 버튼
- DropZone 라벨 구분 (지문/문제/강의노트)

### 4. API 엔드포인트
- `/api/analyze` — 문제 분석 (passageHtml 포함 가능)
- `/api/analyze-passage` — 지문 분석 (isFirst로 태그 제어)
- `/api/analyze-note` — 강의노트 분석 (Gemini Pro)

### 5. 템플릿 (lib/template.ts)
- 문제/지문/강의노트 → 완전 투명 배경 (칠판에 박힌 느낌)
- 지문: 양쪽 얇은 세로선 스타일
- 여러 장 지문: 첫 번째만 태그, 이후 본문만
- 보기(①~⑤) 세로 레이아웃
- 강의노트 전용 스타일 (테마, 개념박스, 포인트 등)

### 6. 기타
- Playwright Chromium 설치 완료
- 문제 병렬 분석 20개 배치
- 보리스 워크플로우 스킬(SKILL.md) 설치

## 다음 세션에서 할 일
- [ ] 실제 수능/모의고사 국어 문제로 전체 플로우 테스트
- [ ] Gemini 프롬프트 튜닝 (지문+문제 분석 품질)
- [ ] 강의노트 2단 레이아웃 추출 품질 검증
- [ ] 배포 설정
- [ ] 라이브러리 기능 국어용 커스터마이징

## 기술 스택
- Next.js 16.2 + React 19 + TypeScript
- Gemini 3.1 Pro/Flash (이미지 분석)
- Claude Sonnet 4.6 (강의노트 생성)
- Playwright (HTML → PNG)
- .env.local: GEMINI_API_KEY, ANTHROPIC_API_KEY, JWT_SECRET, ADMIN_PASSWORD
- dev: `node node_modules/next/dist/bin/next dev -p 3001`
