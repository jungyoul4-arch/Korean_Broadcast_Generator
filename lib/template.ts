/**
 * HTML 템플릿 생성기 — 방송 품질 EBS 스타일
 * ✅ 배경 텍스처 프리셋 (칠판/종이/그라데이션/투명)
 * ✅ 하단 자막 바 (Lower-third)
 * ✅ 서체 혼용 (고딕 + 명조 + 강조체)
 * ✅ 과목별 색상 테마
 * ✅ KaTeX 수식 + TikZ 도형
 */

import {
  type BackgroundPreset,
  type SubjectTheme,
  type LowerThirdData,
  FONT_SYSTEM,
  getSubjectTheme,
  getBackgroundCSS,
  generateLowerThirdHtml,
  getTextColorOverrides,
  DEFAULT_THEME,
} from "./theme";

// ─── [A:start]/[A:end] 구간 마커 → 세로 구분선 변환 ─────
/**
 * 렌더링 시점에서 [A:start]~[A:end] 마커를 세로 구분선 HTML로 변환
 * - 양쪽 다 있음: start~end 범위를 div.section-range로 감싸기
 * - start만 있음: start~본문 끝까지 감싸기
 * - end만 있음: 본문 처음~end까지 감싸기
 * - 일반 [A] (구분선 없음): 변환 없이 유지
 */
function styleSectionRanges(html: string): string {
  // 정규식으로 모든 [라벨:start] / [라벨:end] 패턴을 동적 감지
  const startMatches = [...html.matchAll(/\[([^\]]+):start\]/g)];
  const endMatches = [...html.matchAll(/\[([^\]]+):end\]/g)];
  const labels = new Set([
    ...startMatches.map((m) => m[1]),
    ...endMatches.map((m) => m[1]),
  ]);

  if (labels.size === 0) return html;

  let result = html;
  for (const label of labels) {
    const startTag = `[${label}:start]`;
    const endTag = `[${label}:end]`;
    const hasStart = result.includes(startTag);
    const hasEnd = result.includes(endTag);

    const openDiv = `<div class="section-range"><span class="section-range-label">[${label}]</span>`;
    const closeDiv = `</div>`;

    if (hasStart && hasEnd) {
      result = result.replace(startTag, openDiv);
      result = result.replace(endTag, closeDiv);
    } else if (hasStart) {
      result = result.replace(startTag, openDiv);
      result += closeDiv;
    } else {
      result = openDiv + result;
      result = result.replace(endTag, closeDiv);
    }
  }

  return result;
}

// ─── 렌더 옵션 (프론트에서 전달) ─────────────────────────
export interface RenderOptions {
  background?: BackgroundPreset;
  showLowerThird?: boolean;
  showDecorations?: boolean; // 기본 false — 장식 원복 시 !== false 로 변경
}

// ─── 문제 데이터 ─────────────────────────────────────────
export interface ProblemData {
  number: number;
  subject: string;
  type: string;
  points: number;
  difficulty: number;
  unitName?: string;
  source?: string;
  headerText?: string;
  footerText?: string;
  bodyHtml: string;
  questionHtml: string;
  conditionHtml?: string;
  hasDiagram?: boolean;
  diagramPngBase64?: string;
  diagramLayout?: "single" | "wide" | "multi";
  diagramPosition?: "insideCondition" | "afterBody";
  choicesHtml?: string;
}

export function generateProblemHtml(
  problem: ProblemData,
  options?: RenderOptions,
): string {
  const bg = options?.background || "transparent";
  const theme = getSubjectTheme(problem.subject);
  const bgConfig = getBackgroundCSS(bg, theme);
  const isDark = bgConfig.isDark;
  // 장식 토글 — 원복 시 !== false 로 변경
  const deco = options?.showDecorations === true;

  const diff = Math.max(1, Math.min(5, problem.difficulty || 3));
  const stars = '★'.repeat(diff) + '☆'.repeat(5 - diff);

  const sourceBlock = (deco && problem.source)
    ? `<span class="source-tag">${problem.source}</span>`
    : '';

  const headerBlock = problem.headerText
    ? `<div class="header-banner">${problem.headerText}</div>`
    : '';

  const footerBlock = problem.footerText
    ? `<div class="footer-banner">${problem.footerText}</div>`
    : '';

  const conditionBlock = problem.conditionHtml
    ? `<span class="condition">${problem.conditionHtml}</span>`
    : '';

  const layoutClass = problem.diagramLayout === "multi" ? "diagram-multi"
    : problem.diagramLayout === "wide" ? "diagram-wide"
    : "diagram-single";

  const diagramBlock = problem.diagramPngBase64
    ? `<div class="diagram-area ${layoutClass}">
        <img src="data:image/png;base64,${problem.diagramPngBase64}" alt="도형" class="diagram-img" />
      </div>`
    : '';

  const choicesBlock = problem.choicesHtml
    ? `<div class="choices-area">${problem.choicesHtml}</div>`
    : '';

  const unitTag = (deco && problem.unitName)
    ? `<span class="tag unit-tag">${problem.unitName}</span>`
    : '';

  const subjectTag = deco ? `<span class="tag subject-tag">${problem.subject}</span>` : '';

  // 하단 자막 바
  const showLT = options?.showLowerThird !== false && bg !== "transparent";
  const lowerThirdBlock = showLT
    ? generateLowerThirdHtml({
        left: [problem.source, problem.subject].filter(Boolean).join(' | '),
        center: problem.unitName || '',
        right: `${problem.number}번`,
      }, theme, isDark)
    : '';

  // 포인트 배지 색상 (과목 테마 반영)
  const pointsBadge = (deco && problem.points)
    ? `<span class="points-badge">${problem.points}점</span>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
${FONT_SYSTEM.imports}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: ${FONT_SYSTEM.heading};
  color: ${bgConfig.textColor};
  line-height: 1.85;
  -webkit-font-smoothing: antialiased;
  ${bgConfig.css}
  position: relative;
  min-height: 100vh;
}
${bgConfig.overlayBefore ? `body::before { ${bgConfig.overlayBefore} }` : ''}

/* ─── 컨테이너 ─── */
.problem-container {
  padding: 36px 44px ${showLT ? '56px' : '36px'};
  max-width: 760px;
  position: relative;
  z-index: 1;
}

/* ─── 헤더 ─── */
.problem-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}
.source-tag {
  margin-left: auto;
  font-family: ${FONT_SYSTEM.heading};
  font-size: 16px;
  color: ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)'};
  font-weight: 500;
  letter-spacing: 0.3px;
}

/* ─── 번호 뱃지 (과목색 반영) ─── */
.problem-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: ${theme.gradient};
  color: #fff;
  font-family: ${FONT_SYSTEM.accent};
  font-size: 24px;
  font-weight: 400;
  letter-spacing: -0.5px;
  box-shadow: 0 4px 16px rgba(${theme.primaryRgb},0.4), 0 0 0 1px rgba(255,255,255,0.1) inset;
}

/* ─── 난이도/배점 ─── */
.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.stars {
  color: ${isDark ? '#ffd700' : '#b8860b'};
  font-size: 13px;
  letter-spacing: 1px;
}
.points-badge {
  font-family: ${FONT_SYSTEM.heading};
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(${theme.primaryRgb}, 0.15);
  color: ${theme.accent};
  letter-spacing: 0.5px;
}

/* ─── 태그 (과목색 반영) ─── */
.tag {
  display: inline-block;
  padding: 3px 11px;
  border-radius: 10px;
  font-family: ${FONT_SYSTEM.heading};
  font-size: 12px;
  font-weight: 600;
}
.subject-tag {
  background: ${theme.tagBg};
  color: ${theme.tagColor};
  border: 1px solid rgba(${theme.primaryRgb}, 0.15);
}
.unit-tag {
  background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'};
  color: ${isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)'};
}

/* ─── 헤더 배너 ─── */
.header-banner {
  padding: 14px 24px;
  margin-bottom: 20px;
  border-radius: 12px;
  background: ${theme.headerGradient};
  border: 1.5px solid rgba(${theme.primaryRgb},0.3);
  font-family: ${FONT_SYSTEM.accent};
  font-size: 20px;
  font-weight: 400;
  color: ${theme.accent};
  letter-spacing: 0.5px;
}

/* ─── 문제 박스 (완전 투명 — 칠판에 직접 박힌 느낌) ─── */
.problem-box {
  border: none;
  ${deco ? `border-left: 4px solid ${theme.primary};` : ''}
  border-radius: 4px;
  padding: 26px 30px;
  margin-bottom: 16px;
  background: transparent;
  box-shadow: none;
}

/* ─── 본문 (명조체) ─── */
.problem-body {
  font-family: ${FONT_SYSTEM.body};
  font-size: 19px;
  font-weight: 400;
  line-height: 2.1;
}
.problem-body p {
  text-indent: 1em;
  margin-bottom: 8px;
}

/* ─── 발문(질문) ─── */
.question-line {
  font-family: ${FONT_SYSTEM.heading};
  font-size: 19px;
  font-weight: 700;
}

/* ─── <보기> 박스 ─── */
.condition {
  display: block;
  margin-top: 14px;
  padding: 18px 22px;
  font-family: ${FONT_SYSTEM.body};
  font-size: 17px;
  color: ${isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)'};
  border: 1.5px solid ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'};
  border-radius: 6px;
  background: transparent;
  line-height: 2;
}

/* ─── 도형 ─── */
.diagram-area { margin: 20px auto 16px; text-align: center; }
.diagram-single { max-width: 55%; }
.diagram-wide { max-width: 75%; }
.diagram-multi { max-width: 90%; }
.diagram-img { max-width: 100%; height: auto; }

/* ─── 선택지 ─── */
.choices-area {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.choice-item {
  font-family: ${FONT_SYSTEM.heading};
  font-size: 17px;
  line-height: 1.9;
  padding: 3px 0;
}

/* ─── 답안 박스 ─── */
.answer-box {
  display: inline-block;
  border: 1.5px solid ${isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)'};
  border-radius: 4px;
  padding: 2px 12px;
  margin: 0 4px;
  min-width: 40px;
  text-align: center;
  font-weight: 600;
  background: transparent;
}
.solution-box {
  border: 1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'};
  border-radius: 8px;
  padding: 16px 20px;
  margin: 12px 0;
  background: transparent;
}

/* ─── 꼬리말 배너 ─── */
.footer-banner {
  padding: 14px 24px;
  margin-top: 20px;
  border-radius: 12px;
  background: ${isDark
    ? `linear-gradient(135deg, rgba(${theme.accentRgb},0.08), rgba(${theme.primaryRgb},0.04))`
    : `linear-gradient(135deg, rgba(${theme.primaryRgb},0.08), rgba(${theme.accentRgb},0.04))`};
  border: 1.5px solid rgba(${theme.primaryRgb},0.2);
  font-family: ${FONT_SYSTEM.heading};
  font-size: 17px;
  font-weight: 600;
  color: ${theme.accent};
}

.poem-title {
  font-family: ${FONT_SYSTEM.accent};
  font-size: 20px;
  font-weight: 400;
  color: ${theme.accent};
  margin-bottom: 12px;
}
.passage-note {
  display: block;
  margin: 12px 0;
  padding: 8px 16px;
  font-size: 15px;
  color: ${isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'};
  font-style: italic;
  border-left: 3px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'};
}

/* ─── [A]~[E] 구간 세로 구분선 ─── */
.section-range {
  position: relative;
  border-left: 2px solid ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'};
  padding-left: 20px;
  margin: 4px 0;
}
.section-range-label {
  position: absolute;
  left: -32px;
  top: 0;
  font-family: ${FONT_SYSTEM.heading};
  font-size: 14px;
  font-weight: 700;
  color: ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)'};
  white-space: nowrap;
}

/* ─── KaTeX ─── */
${isDark ? `
.katex, .katex * { color: #fff !important; }
.katex .mord, .katex .mbin, .katex .mrel,
.katex .mopen, .katex .mclose, .katex .mpunct,
.katex .mop, .katex .minner { color: #fff !important; }
.katex .boxpad { border-color: rgba(255,255,255,0.5) !important; }
.katex .fbox { border-color: rgba(255,255,255,0.5) !important; }
` : `
.katex, .katex * { color: #1a1a1a !important; }
.katex .boxpad { border-color: rgba(0,0,0,0.4) !important; }
.katex .fbox { border-color: rgba(0,0,0,0.4) !important; }
`}

${getTextColorOverrides(isDark)}
</style>
</head>
<body>
<div class="problem-container">
  ${headerBlock}

  ${deco ? `<div class="problem-header">
    <span class="problem-number">${problem.number}</span>
    <div class="meta-row">
      <span class="stars">${stars}</span>
      ${pointsBadge}
    </div>
    ${subjectTag}
    ${unitTag}
    ${sourceBlock}
  </div>` : ''}

  <div class="problem-box">
    <div class="problem-body">
      ${styleSectionRanges(problem.bodyHtml)}
      ${conditionBlock}
      ${problem.diagramPosition === 'insideCondition' ? diagramBlock : ''}
    </div>
    ${problem.diagramPosition !== 'insideCondition' ? diagramBlock : ''}
    ${choicesBlock}
  </div>

  ${footerBlock}
</div>

${lowerThirdBlock}

<script>
document.addEventListener("DOMContentLoaded", function() {
  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(document.body, {
      delimiters: [
        {left: "$$", right: "$$", display: true},
        {left: "$", right: "$", display: false},
        {left: "\\\\[", right: "\\\\]", display: true},
        {left: "\\\\(", right: "\\\\)", display: false}
      ],
      throwOnError: false
    });
  }
});
</script>
</body>
</html>`;
}

// ─── 지문 ─────────────────────────────────────────────────
export interface PassageData {
  passageHtml: string;
  subject: string;
  unitName?: string;
  source?: string;
  headerText?: string;
  isFirst?: boolean;  // 첫 번째 지문만 태그/헤더 표시
}

export function generatePassageHtml(
  passage: PassageData,
  options?: RenderOptions,
): string {
  const bg = options?.background || "transparent";
  const theme = getSubjectTheme(passage.subject);
  const bgConfig = getBackgroundCSS(bg, theme);
  const isDark = bgConfig.isDark;
  // 장식 토글 — 원복 시 !== false 로 변경
  const deco = options?.showDecorations === true;

  const sourceBlock = (deco && passage.source)
    ? `<span class="source-tag">${passage.source}</span>`
    : '';

  const headerBlock = passage.headerText
    ? `<div class="header-banner">${passage.headerText}</div>`
    : '';

  const subjectTag = deco ? `<span class="tag subject-tag">${passage.subject}</span>` : '';
  const unitTag = (deco && passage.unitName)
    ? `<span class="tag unit-tag">${passage.unitName}</span>`
    : '';

  const showLT = options?.showLowerThird !== false && bg !== "transparent";
  const lowerThirdBlock = showLT
    ? generateLowerThirdHtml({
        left: [passage.source, passage.subject].filter(Boolean).join(' | '),
        center: passage.unitName || '지문',
      }, theme, isDark)
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
${FONT_SYSTEM.imports}
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: ${FONT_SYSTEM.heading};
  color: ${bgConfig.textColor};
  line-height: 1.85;
  -webkit-font-smoothing: antialiased;
  ${bgConfig.css}
  position: relative;
  min-height: 100vh;
}
${bgConfig.overlayBefore ? `body::before { ${bgConfig.overlayBefore} }` : ''}

.problem-container {
  padding: ${deco ? `36px 44px ${showLT ? '56px' : '36px'}` : `20px 24px ${showLT ? '56px' : '20px'}`};
  max-width: 760px;
  position: relative;
  z-index: 1;
}

.problem-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}
.source-tag {
  margin-left: auto;
  font-family: ${FONT_SYSTEM.heading};
  font-size: 16px;
  color: ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)'};
  font-weight: 500;
}

.tag {
  display: inline-block;
  padding: 3px 11px;
  border-radius: 10px;
  font-family: ${FONT_SYSTEM.heading};
  font-size: 12px;
  font-weight: 600;
}
.subject-tag {
  background: ${theme.tagBg};
  color: ${theme.tagColor};
  border: 1px solid rgba(${theme.primaryRgb}, 0.15);
}
.unit-tag {
  background: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'};
  color: ${isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)'};
}

.passage-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 12px;
  font-family: ${FONT_SYSTEM.accent};
  font-size: 15px;
  font-weight: 400;
  background: ${theme.gradient};
  color: #fff;
  box-shadow: 0 3px 10px rgba(${theme.primaryRgb},0.3);
  letter-spacing: 0.5px;
}

.header-banner {
  padding: 14px 24px;
  margin-bottom: 20px;
  border-radius: 12px;
  background: ${theme.headerGradient};
  border: 1.5px solid rgba(${theme.primaryRgb},0.3);
  font-family: ${FONT_SYSTEM.accent};
  font-size: 20px;
  font-weight: 400;
  color: ${theme.accent};
}

.passage-box {
  border: none;
  ${deco ? `border-left: 2px solid ${isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'};` : ''}
  ${deco ? `border-right: 2px solid ${isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'};` : ''}
  border-radius: 0;
  padding: ${deco ? '26px 30px' : '16px 0'};
  margin-bottom: 16px;
  background: transparent;
  box-shadow: none;
}

.passage-body {
  font-family: ${FONT_SYSTEM.body};
  font-size: 17px;
  font-weight: 400;
  line-height: 2.1;
}
.passage-body p {
  text-indent: 1em;
  margin-bottom: 8px;
}

.poem-title {
  font-family: ${FONT_SYSTEM.accent};
  font-size: 20px;
  font-weight: 400;
  color: ${theme.accent};
  margin-bottom: 12px;
}
.passage-note {
  display: block;
  margin: 12px 0;
  padding: 8px 16px;
  font-size: 15px;
  color: ${isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'};
  font-style: italic;
  border-left: 3px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'};
}

/* ─── [A]~[E] 구간 세로 구분선 ─── */
.section-range {
  position: relative;
  border-left: 2px solid ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'};
  padding-left: 20px;
  margin: 4px 0;
}
.section-range-label {
  position: absolute;
  left: -32px;
  top: 0;
  font-family: ${FONT_SYSTEM.heading};
  font-size: 14px;
  font-weight: 700;
  color: ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)'};
  white-space: nowrap;
}

${getTextColorOverrides(isDark)}
</style>
</head>
<body>
<div class="problem-container">
  ${(deco && passage.isFirst !== false) ? `
  ${headerBlock}
  <div class="problem-header">
    <span class="passage-label">지문</span>
    ${subjectTag}
    ${unitTag}
    ${sourceBlock}
  </div>
  ` : ''}

  <div class="passage-box">
    <div class="passage-body">
      ${styleSectionRanges(passage.passageHtml)}
    </div>
  </div>
</div>

${(deco && passage.isFirst !== false) ? lowerThirdBlock : ''}
</body>
</html>`;
}

// ─── 강의노트 ─────────────────────────────────────────────
export interface LectureNoteData {
  noteHtml: string;
  noteTitle: string;
  subject: string;
  source?: string;
  headerText?: string;
}

export function generateLectureNoteHtml(
  note: LectureNoteData,
  options?: RenderOptions,
): string {
  const bg = options?.background || "transparent";
  const theme = getSubjectTheme(note.subject);
  const bgConfig = getBackgroundCSS(bg, theme);
  const isDark = bgConfig.isDark;
  // 장식 토글 — 원복 시 !== false 로 변경
  const deco = options?.showDecorations === true;

  const sourceBlock = (deco && note.source)
    ? `<span class="source-tag">${note.source}</span>`
    : '';

  const headerBlock = note.headerText
    ? `<div class="header-banner">${note.headerText}</div>`
    : '';

  const showLT = options?.showLowerThird !== false && bg !== "transparent";
  const lowerThirdBlock = showLT
    ? generateLowerThirdHtml({
        left: [note.source, note.subject].filter(Boolean).join(' | '),
        center: '강의노트',
      }, theme, isDark)
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
${FONT_SYSTEM.imports}
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: ${FONT_SYSTEM.heading};
  color: ${bgConfig.textColor};
  line-height: 1.85;
  -webkit-font-smoothing: antialiased;
  ${bgConfig.css}
  position: relative;
  min-height: 100vh;
}
${bgConfig.overlayBefore ? `body::before { ${bgConfig.overlayBefore} }` : ''}

.problem-container {
  padding: 36px 44px ${showLT ? '56px' : '36px'};
  max-width: 760px;
  position: relative;
  z-index: 1;
}

.note-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}
.source-tag {
  margin-left: auto;
  font-family: ${FONT_SYSTEM.heading};
  font-size: 16px;
  color: ${isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)'};
  font-weight: 500;
}
.note-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 12px;
  font-family: ${FONT_SYSTEM.accent};
  font-size: 15px;
  font-weight: 400;
  background: ${theme.gradient};
  color: #fff;
  box-shadow: 0 3px 10px rgba(${theme.primaryRgb},0.3);
  letter-spacing: 0.5px;
}

.header-banner {
  padding: 14px 24px;
  margin-bottom: 20px;
  border-radius: 12px;
  background: ${theme.headerGradient};
  border: 1.5px solid rgba(${theme.primaryRgb},0.3);
  font-family: ${FONT_SYSTEM.accent};
  font-size: 20px;
  font-weight: 400;
  color: ${theme.accent};
}

.note-box {
  border: none;
  ${deco ? `border-left: 4px solid ${theme.primary};` : ''}
  border-radius: 4px;
  padding: 26px 30px;
  background: transparent;
  box-shadow: none;
}

.note-body {
  font-family: ${FONT_SYSTEM.body};
  font-size: 17px;
  font-weight: 400;
  line-height: 3.6;
}
.note-body p { margin-bottom: 24px; }

.note-theme {
  font-family: ${FONT_SYSTEM.accent};
  font-size: 22px;
  font-weight: 400;
  color: ${deco ? theme.accent : bgConfig.textColor};
  margin-bottom: 16px;
}
.note-subtitle {
  font-family: ${FONT_SYSTEM.heading};
  font-size: 18px;
  font-weight: 700;
  color: ${deco ? theme.primary : bgConfig.textColor};
  margin: 16px 0 8px;
  padding-bottom: 4px;
  border-bottom: ${deco ? `1px solid rgba(${theme.primaryRgb},0.25)` : 'none'};
}
.note-concept {
  margin: 10px 0;
  padding: 12px 16px;
  border-left: ${deco ? `3px solid rgba(${theme.primaryRgb},0.5)` : 'none'};
  background: ${deco ? `rgba(${theme.primaryRgb},0.04)` : 'transparent'};
  border-radius: 0 8px 8px 0;
  line-height: 1.9;
}
.note-point {
  margin: 16px 0;
  padding: 14px 20px;
  border-radius: 10px;
  background: ${deco ? `rgba(${theme.secondaryRgb},0.08)` : 'transparent'};
  border: ${deco ? `1px solid rgba(${theme.secondaryRgb},0.2)` : 'none'};
  font-weight: 500;
}
.note-side {
  margin: 14px 0;
  padding: 16px 20px;
  border-radius: 10px;
  background: ${deco ? `rgba(${theme.accentRgb},0.04)` : 'transparent'};
  border: ${deco ? `1.5px solid rgba(${theme.accentRgb},0.15)` : 'none'};
  font-size: 16px;
  color: ${isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.75)'};
  line-height: 1.9;
}
.note-divider {
  border: none;
  border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'};
  margin: 16px 0;
}
.note-body ul, .note-body ol { padding-left: 24px; margin: 8px 0; }
.note-body li { margin-bottom: 4px; }

.note-diagram {
  margin: 16px auto;
  text-align: center;
}
.note-diagram-img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}

${getTextColorOverrides(isDark)}
</style>
</head>
<body>
<div class="problem-container">
  ${headerBlock}
  ${deco ? `<div class="note-header">
    <span class="note-label">강의노트</span>
    ${sourceBlock}
  </div>` : ''}
  <div class="note-box">
    <div class="note-body">
      ${note.noteHtml}
    </div>
  </div>
</div>

${lowerThirdBlock}
</body>
</html>`;
}
