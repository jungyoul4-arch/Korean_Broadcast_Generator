/**
 * 콘티 HTML 템플릿 — 문제와 동일 스타일, 투명 배경, 컬러풀 Q 디자인
 */
import type { ContiData } from "./conti";

export interface ContiTemplateOptions {
  problemNumber: number;
  source?: string;
  subject?: string;
  unitName?: string;
}

const Q_COLORS = [
  { bg: "linear-gradient(135deg, #7c4dff, #536dfe)", shadow: "rgba(124,77,255,0.4)" },   // 보라
  { bg: "linear-gradient(135deg, #00bcd4, #0097a7)", shadow: "rgba(0,188,212,0.4)" },     // 청록
  { bg: "linear-gradient(135deg, #ff7043, #e64a19)", shadow: "rgba(255,112,67,0.4)" },     // 주황
  { bg: "linear-gradient(135deg, #66bb6a, #388e3c)", shadow: "rgba(102,187,106,0.4)" },    // 초록
];

export function generateContiHtml(
  conti: ContiData,
  options: ContiTemplateOptions
): string {
  const sourceBlock = options.source
    ? `<div class="source-tag">${options.source}</div>`
    : "";

  const unitTag = options.unitName
    ? `<span class="tag unit-tag">${options.unitName}</span>`
    : "";
  const subjectTag = options.subject
    ? `<span class="tag subject-tag">${options.subject}</span>`
    : "";

  const questionsHtml = conti.questions
    .map((q, i) => {
      const color = Q_COLORS[i % Q_COLORS.length];
      return `
      <div class="question-block">
        <div class="q-header">
          <span class="q-badge" style="background: ${color.bg}; box-shadow: 0 4px 12px ${color.shadow};">Q${q.number}</span>
        </div>
        <div class="q-text">${q.text}</div>
        <div class="writing-space"></div>
      </div>`;
    })
    .join("");

  const conceptsHtml = conti.concepts
    .map(
      (c) => `
      <div class="concept-item">
        <span class="concept-num">${c.number}.</span>
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
  padding: 32px 40px;
  max-width: 720px;
  position: relative;
}

.source-tag {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 13px;
  color: rgba(255,255,255,0.5);
}

/* 헤더 — 문제와 동일 구조 */
.conti-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.conti-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #7c4dff 0%, #536dfe 100%);
  color: #fff;
  font-size: 18px;
  font-weight: 900;
  box-shadow: 0 4px 12px rgba(124,77,255,0.4);
}
.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}
.subject-tag {
  background: rgba(100,181,246,0.2);
  color: #90caf9;
}
.unit-tag {
  background: rgba(129,199,132,0.2);
  color: #a5d6a7;
}

/* 콘티 박스 — 문제 박스와 동일 */
.conti-box {
  border: 1.5px solid rgba(124,77,255,0.4);
  border-radius: 12px;
  padding: 24px 28px;
  background: transparent;
}

/* 질문 블록 */
.question-block {
  margin-bottom: 8px;
}
.q-header {
  margin-bottom: 8px;
}
.q-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: #fff;
  font-size: 18px;
  font-weight: 900;
}
.q-text {
  font-size: 19px;
  font-weight: 400;
  line-height: 2;
  padding-left: 4px;
}

/* 필기 공간 */
.writing-space {
  height: 90px;
  margin: 12px 0 20px 0;
  border: 1px dashed rgba(255,255,255,0.1);
  border-radius: 8px;
}

/* 개념 박스 */
.concepts-box {
  border: 1.5px solid rgba(74,138,106,0.5);
  border-radius: 12px;
  padding: 20px 24px;
  margin-top: 20px;
}
.concepts-title {
  font-size: 15px;
  font-weight: 700;
  color: rgba(129,199,132,0.8);
  margin-bottom: 14px;
}
.concept-item {
  font-size: 19px;
  font-weight: 400;
  line-height: 2.2;
}
.concept-num {
  color: rgba(255,255,255,0.5);
  font-weight: 700;
  margin-right: 6px;
}

/* KaTeX 흰색 */
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
    ${subjectTag}
    ${unitTag}
  </div>

  <div class="conti-box">
    ${questionsHtml}
  </div>

  <div class="concepts-box">
    <div class="concepts-title">📎 필수 개념 · 공식</div>
    ${conceptsHtml}
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
