/**
 * LaTeX 템플릿 생성기 — 다크 칠판 스타일
 * pdflatex + TikZ 기반, 투명 배경 PNG 출력
 */

export interface ProblemData {
  number: number;
  subject: string;
  type: string;
  points: number;
  difficulty: number;
  unitName?: string;
  source?: string;
  bodyLatex: string;       // 문제 본문 (순수 LaTeX)
  questionLatex: string;   // 핵심 질문
  conditionLatex?: string; // 단서 조건
  hasDiagram?: boolean;
  diagramTikz?: string;    // TikZ 코드 (도형)
  choicesLatex?: string;   // 객관식 보기
}

export function generateLatexDocument(problem: ProblemData): string {
  const diff = Math.max(1, Math.min(5, problem.difficulty || 3));
  const stars = '★'.repeat(diff) + '☆'.repeat(5 - diff);

  const sourceBlock = problem.source
    ? `\\node[anchor=north east, font=\\sffamily\\small, text=white!70] at ([xshift=-8pt, yshift=-8pt]current page.north east) {${escapeLatex(problem.source)}};`
    : '';

  const unitBlock = problem.unitName
    ? `\\, {\\small\\color{white!60}${escapeLatex(problem.unitName)}}`
    : '';

  const conditionBlock = problem.conditionLatex
    ? `\\par\\vspace{4pt}{\\small\\color{white!70}${problem.conditionLatex}}`
    : '';

  const choicesBlock = problem.choicesLatex
    ? `\\par\\vspace{8pt}${problem.choicesLatex}`
    : '';

  // 도형 블록: TikZ 코드로 직접 그리기
  let diagramBlock = '';
  if (problem.hasDiagram && problem.diagramTikz) {
    diagramBlock = `
\\par\\vspace{12pt}
\\begin{center}
${problem.diagramTikz}
\\end{center}`;
  }

  return `\\documentclass[border=20pt, varwidth=600pt]{standalone}
\\usepackage[T1]{fontenc}
\\usepackage{kotex}
\\usepackage{amsmath, amssymb, amsfonts}
\\usepackage{tikz}
\\usepackage{xcolor}
\\usepackage{tcolorbox}
\\tcbuselibrary{skins, breakable}
\\usetikzlibrary{calc, arrows.meta, patterns, decorations.markings, positioning, intersections}

% 다크 칠판 배경색
\\definecolor{chalkboard}{HTML}{1a3a2a}
\\definecolor{chalkgreen}{HTML}{2d5a3f}
\\definecolor{numOrange}{HTML}{ff8c00}
\\definecolor{starGold}{HTML}{ffd700}
\\definecolor{borderGlow}{HTML}{4a8a6a}

% 투명 배경 — pagecolor 없음 (Ghostscript pngalpha가 투명 처리)
\\color{white}

\\begin{document}

% 출처 (우측 상단)
\\begin{tikzpicture}[remember picture, overlay]
${sourceBlock}
\\end{tikzpicture}

% 문제 번호 + 난이도
\\noindent
\\begin{tikzpicture}[baseline=(num.base)]
  \\node[fill=numOrange, rounded corners=6pt, inner sep=6pt, font=\\bfseries\\Large, text=white] (num) {${problem.number}};
\\end{tikzpicture}
\\hspace{6pt}
{\\color{starGold}\\small ${stars}}${unitBlock}

\\vspace{10pt}

% 문제 박스
\\begin{tcolorbox}[
  enhanced,
  colback=white!0!black,  % 투명 배경
  colframe=borderGlow,
  boxrule=1.5pt,
  arc=8pt,
  left=16pt, right=16pt, top=12pt, bottom=12pt,
  shadow={2pt}{-2pt}{0pt}{black!50},
  fontupper=\\color{white}\\large
]

% 문제 본문
${problem.bodyLatex}

${conditionBlock}

% 도형
${diagramBlock}

% 보기
${choicesBlock}

\\end{tcolorbox}

\\vspace{8pt}

% 핵심 질문
\\noindent
{\\large\\bfseries\\underline{${problem.questionLatex}}}

\\end{document}
`;
}

/** LaTeX 특수문자 이스케이프 */
function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, (m) => `\\${m}`)
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}
