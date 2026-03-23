/**
 * 콘티 HTML 템플릿 — EBS 방송 품질 디자인
 * 투명 배경 | Q 뱃지 강조 | 넉넉한 필기 공간 | 세련된 개념 안정화
 */
import type { ContiData } from "./conti";

export interface ContiTemplateOptions {
  problemNumber: number;
  source?: string;
  subject?: string;
  unitName?: string;
}

const Q_COLORS = [
  { bg: "linear-gradient(135deg, #7c4dff, #536dfe)", shadow: "rgba(124,77,255,0.35)", accent: "#b388ff" },
  { bg: "linear-gradient(135deg, #00bcd4, #0097a7)", shadow: "rgba(0,188,212,0.35)", accent: "#80deea" },
  { bg: "linear-gradient(135deg, #ff7043, #e64a19)", shadow: "rgba(255,112,67,0.35)", accent: "#ffab91" },
  { bg: "linear-gradient(135deg, #66bb6a, #388e3c)", shadow: "rgba(102,187,106,0.35)", accent: "#a5d6a7" },
];

export function generateContiHtml(
  conti: ContiData,
  options: ContiTemplateOptions
): string {
  const sourceBlock = options.source
    ? `<div class="source-tag">${options.source}</div>`
    : "";

  const questionsHtml = conti.questions
    .map((q, i) => {
      const color = Q_COLORS[i % Q_COLORS.length];
      return `
      <div class="question-block">
        <div class="q-row">
          <span class="q-badge" style="background: ${color.bg}; box-shadow: 0 6px 20px ${color.shadow};">Q${q.number}</span>
          <div class="q-text">${q.text}</div>
        </div>
        <div class="writing-space">
          <div class="writing-lines">
            <div class="writing-line"></div>
            <div class="writing-line"></div>
            <div class="writing-line"></div>
          </div>
        </div>
      </div>`;
    })
    .join("");

  const conceptsHtml = conti.concepts
    .map(
      (c, i) => `
      <div class="concept-row">
        <span class="concept-badge">${c.number}</span>
        <span class="concept-text">${c.text}</span>
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Noto Sans KR', sans-serif;
  color: #fff;
  line-height: 1.85;
  -webkit-font-smoothing: antialiased;
}

.problem-container {
  padding: 36px 44px 44px;
  max-width: 760px;
  position: relative;
}

.source-tag {
  position: absolute;
  top: 14px;
  right: 20px;
  font-size: 13px;
  color: rgba(255,255,255,0.4);
  font-weight: 400;
}

/* ─── 헤더: 번호만, 태그 없음 ─── */
.conti-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}
.conti-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  padding: 0 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #7c4dff 0%, #536dfe 100%);
  color: #fff;
  font-size: 19px;
  font-weight: 900;
  letter-spacing: -0.3px;
  box-shadow: 0 6px 20px rgba(124,77,255,0.35);
}
.conti-label {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255,255,255,0.35);
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* ─── 질문 영역 ─── */
.questions-section {
  margin-bottom: 32px;
}

.question-block {
  margin-bottom: 0;
}
.question-block:last-child {
  margin-bottom: 0;
}
.question-block:last-child .writing-space {
  margin-bottom: 0;
}

.q-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.q-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  color: #fff;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.5px;
  margin-top: 2px;
}
.q-text {
  font-size: 19px;
  font-weight: 400;
  line-height: 1.9;
  padding-top: 12px;
  color: rgba(255,255,255,0.92);
}

/* ─── 필기 공간: 넉넉하게 ─── */
.writing-space {
  height: 140px;
  margin: 16px 0 28px 0;
  border: 1.5px dashed rgba(255,255,255,0.07);
  border-radius: 10px;
  position: relative;
  background: rgba(255,255,255,0.015);
}
.writing-lines {
  position: absolute;
  inset: 20px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.writing-line {
  height: 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}

/* ─── 개념 안정화: EBS 프리미엄 스타일 ─── */
.concepts-section {
  border: 1.5px solid rgba(74,138,106,0.4);
  border-radius: 16px;
  overflow: hidden;
  background: rgba(74,138,106,0.04);
}
.concepts-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 28px;
  border-bottom: 1px solid rgba(74,138,106,0.2);
  background: rgba(74,138,106,0.08);
}
.concepts-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #66bb6a, #2e7d32);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(102,187,106,0.3);
}
.concepts-title {
  font-size: 15px;
  font-weight: 700;
  color: rgba(165,214,167,0.9);
  letter-spacing: 0.5px;
}
.concepts-subtitle {
  font-size: 11px;
  color: rgba(255,255,255,0.3);
  margin-left: auto;
  font-weight: 400;
}

.concepts-body {
  padding: 20px 28px 24px;
}
.concept-row {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.concept-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.concept-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(102,187,106,0.15);
  border: 1px solid rgba(102,187,106,0.25);
  color: #a5d6a7;
  font-size: 13px;
  font-weight: 800;
  margin-top: 3px;
}
.concept-text {
  font-size: 18px;
  font-weight: 400;
  line-height: 2;
  color: rgba(255,255,255,0.88);
}

/* ─── KaTeX 흰색 ─── */
.katex, .katex * { color: #fff !important; }
.katex .mord, .katex .mbin, .katex .mrel,
.katex .mopen, .katex .mclose, .katex .mpunct,
.katex .mop, .katex .minner { color: #fff !important; }
</style>
</head>
<body>
<div class="problem-container">
  ${sourceBlock}

  <div class="conti-header">
    <span class="conti-number">${options.problemNumber}번 콘티</span>
    <span class="conti-label">LESSON GUIDE</span>
  </div>

  <div class="questions-section">
    ${questionsHtml}
  </div>

  <div class="concepts-section">
    <div class="concepts-header">
      <span class="concepts-icon">&#9998;</span>
      <span class="concepts-title">개념 안정화</span>
      <span class="concepts-subtitle">빈칸을 채워 정리하세요</span>
    </div>
    <div class="concepts-body">
      ${conceptsHtml}
    </div>
  </div>
</div>

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
