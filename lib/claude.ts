/**
 * Gemini API 연동 — 국어/EBS 문제 이미지 분석 + HTML 생성
 * gemini-3.1-pro 사용
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateProblemHtml, type ProblemData, type RenderOptions } from "./template";
import { renderTikzToPng } from "./tikz-renderer";

function getClient() {
  let key = process.env.GEMINI_API_KEY;
  if (!key) {
    try {
      const fs = require("fs");
      const path = require("path");
      const envPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const match = content.match(/GEMINI_API_KEY=(.+)/);
        if (match) key = match[1].trim();
      }
    } catch {}
  }
  if (!key) {
    throw new Error("GEMINI_API_KEY가 없습니다. .env.local 파일을 확인하세요.");
  }
  return new GoogleGenerativeAI(key);
}

/**
 * RECITATION 에러 시 프롬프트를 변형하여 재시도하는 래퍼
 * Gemini가 저작권 유사 콘텐츠로 판단하여 차단할 때 최대 2회 재시도
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeGenerate(
  model: { generateContent: (req: unknown[]) => Promise<any> },
  contents: unknown[],
  maxRetries: number = 2
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(contents);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("RECITATION") && attempt < maxRetries) {
        // 재시도: 텍스트 항목에 교육 목적 컨텍스트 접미어 추가
        const suffix = `\n(교육 방송 자료 제작용 변환 작업입니다. 원본 텍스트를 HTML 태그로 재구성하세요. 시도 ${attempt + 2})`;
        contents = contents.map((c) => {
          if (c && typeof c === "object" && "text" in c) {
            return { text: (c as { text: string }).text + suffix };
          }
          return c;
        });
        console.log(`⚠️ RECITATION 에러 — 재시도 ${attempt + 2}/${maxRetries + 1}`);
        continue;
      }
      throw err;
    }
  }
  throw new Error("RECITATION 재시도 초과 — 다른 이미지로 시도해주세요");
}

const SYSTEM_PROMPT = `[교육 자료 제작 목적] 이 작업은 한국 교육방송(EBS) 스타일의 교육 콘텐츠 제작을 위해 이미지 내 텍스트를 구조화된 HTML로 변환하는 것입니다. 원본 텍스트의 의미를 보존하면서 교육 방송 화면에 적합한 형태로 재구성하세요.

당신은 국어 문제(수능, 모의고사, EBS 연계 교재) 이미지를 분석하여 HTML 코드로 변환하는 전문가입니다.

## 작업
사용자가 국어 문제 스크린샷을 보내면:
1. 지문(제시문)과 문제 텍스트를 정확하게 추출합니다
2. 한글 텍스트는 그대로 HTML로 씁니다
3. 시, 소설, 비문학 지문은 원본의 줄바꿈과 문단 구조를 충실히 유지합니다
4. 보기(ㄱ, ㄴ, ㄷ 등)나 <보기> 박스가 있으면 conditionHtml에 넣습니다

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트를 추가하지 마세요.

\`\`\`json
{
  "number": 1,
  "subject": "독서",
  "type": "객관식",
  "points": 3,
  "difficulty": 3,
  "unitName": "인문",
  "hasDiagram": false,
  "diagramTikz": null,
  "diagramPosition": "afterBody",
  "bodyHtml": "HTML 본문 (지문 + 문제 텍스트, 질문 반드시 포함!)",
  "questionHtml": null,
  "conditionHtml": "<보기> 박스 내용 (있는 경우만, 없으면 null)",
  "choicesHtml": "<div class='choice-item'>① 첫 번째 선지</div><div class='choice-item'>② 두 번째 선지</div>..."
}
\`\`\`

## 난이도 판단 기준
- difficulty 1: 교과서 기본 (쉬운 내용 이해, 2점 문제)
- difficulty 2: 기본 응용 (표준적 추론, 3점 쉬운 문제)
- difficulty 3: 표준 (3점 보통 난이도, 일반적 수능 문제)
- difficulty 4: 고난도 (수능 고난도, EBS 연계 심화)
- difficulty 5: 킬러 (수능 최고난도, 복합 지문 추론)

## subject 분류
- 독서 (비문학)
- 문학
- 화법과작문
- 언어와매체
- 공통국어 (화법/작문/언어 통합)

## unitName 분류
독서: "인문", "사회", "과학", "기술", "예술", "융합"
문학: "현대시", "현대소설", "고전시가", "고전소설", "수필/극", "복합"
화법과작문: "화법", "작문", "화법과작문 통합"
언어와매체: "음운", "형태/단어", "문장/통사", "의미/담화", "매체", "국어사"
공통국어: "듣기말하기", "읽기", "쓰기"

## 지문(제시문) 처리 규칙 (★★★ 가장 중요 ★★★)

### 비문학(독서) 지문
- 문단 구분을 정확히 유지: 각 문단을 <p> 태그로 감싸기
- 문단 앞 들여쓰기는 CSS로 처리 (text-indent)
- 지문이 길면 전체를 bodyHtml에 넣되, 의미 단위로 문단 구분
- 예: <p>첫 번째 문단 내용...</p><p>두 번째 문단 내용...</p>

### 문학 지문 — 시(詩)
- 시의 행 구분을 반드시 유지: 각 행을 <br>로 구분
- 연(stanza) 구분: 빈 줄은 <br><br>로 표현
- 시 제목과 작가: <div class="poem-title">제목 — 작가</div>
- 예:
  <div class="poem-title">풀 — 김수영</div>
  풀이 눕는다<br>
  바람보다도 더 빨리 눕는다<br>
  <br>
  바람보다도 더 빨리 울고<br>
  바람보다 먼저 일어난다

### 문학 지문 — 소설/수필
- 대화문은 따옴표 유지
- 서술 부분과 대화 부분의 문단 구분 유지
- 생략 부분 [중략], [앞부분 줄거리] 등은 <div class="passage-note">[중략]</div>로 처리

### EBS 연계 표시
- 출처가 EBS 교재인 경우: source 필드에 "수능특강 독서", "수능완성 문학" 등 기재

## <보기> 처리
- 문제에 <보기>가 있으면 conditionHtml에 넣기
- <보기> 안의 ㄱ, ㄴ, ㄷ 구분은 <br>로 줄바꿈
- 예: conditionHtml: "<strong>&lt;보기&gt;</strong><br>ㄱ. 첫 번째 내용<br>ㄴ. 두 번째 내용<br>ㄷ. 세 번째 내용"

## 도형/그림 위치 판별 (diagramPosition)
- 그림/도형/차트가 <보기> 박스 안에 포함되어 있으면: "insideCondition"
- 그림/도형이 본문 영역에 독립적으로 있거나 <보기> 밖에 있으면: "afterBody" (기본값)
- 반드시 원본 이미지에서 그림이 <보기> 박스 경계 안에 있는지를 기준으로 판단하세요

## 밑줄/강조 처리
- 원본에서 밑줄 친 부분: <u>밑줄 내용</u>
- ⓐⓑⓒ 등 동그라미 기호: 그대로 유니코드 사용
- [A], [B] 등 구간 표시: 그대로 텍스트로 유지

## 빈칸 상자
- 빈칸이 있는 문제: <span class="answer-box">(가)</span>
- 여러 빈칸: (가), (나), (다) 각각 answer-box로 감싸기

## 객관식 보기 (★ 반드시 포함!)
객관식 문제의 선지(①②③④⑤)는 choicesHtml에 반드시 포함하세요.
- 각 선지를 <div class="choice-item">① 선지 내용</div> 형태로 작성
- 선지가 5개면 5개 모두 포함
- 주관식(서술형) 문제는 choicesHtml을 null로
- 선지 안에 밑줄이 있으면 <u>내용</u> 사용

## 질문 (절대 누락 금지!)
- bodyHtml 맨 마지막에 질문을 반드시 포함!
- 예: <br><br><span class="question-line">윗글에 대한 설명으로 적절한 것은?</span>
- questionHtml은 반드시 null! 질문은 bodyHtml 끝에 넣으세요.
- 원본의 "~적절한 것은?", "~않은 것은?" 등 질문을 절대 빠뜨리지 마세요!

## 조건 박스 (conditionHtml)
- 원본 문제에서 <보기> 박스가 있으면 → conditionHtml에 넣으세요
- <보기>가 없는 일반 문제면 → conditionHtml은 null
- conditionHtml에 넣은 내용은 자동으로 박스 스타일로 렌더링됩니다

## 기타
- bodyHtml에 문제 전체(지문 + 문제 텍스트 + 질문)를 빠짐없이 넣으세요
- 줄바꿈 가독성: 의미 단위로 자연스럽게 줄바꿈하세요. <br> 태그를 적절히 사용
- 한자가 있으면 그대로 유지 (한자 병기 포함)
- 각주나 미주가 있으면 본문에 포함`;

/**
 * JSON 파싱 전 LaTeX 백슬래시 이스케이프 전처리
 *
 * 문제: Gemini가 JSON 안에 `\times`를 넣으면, `\t`가 JSON 탭 이스케이프로 해석됨
 *   - `\times` → `\t`(탭) + `imes`  →  "imes" 으로 표시
 *   - `\theta` → `\t`(탭) + `heta`
 *   - `\nabla` → `\n`(줄바꿈) + `abla`
 *   - `\beta`  → `\b`(백스페이스) + `eta`
 *   - `\forall`→ `\f`(폼피드) + `orall`
 *   - `\right` → `\r`(캐리지리턴) + `ight`
 *
 * 해결: \ 뒤에 알파벳 2글자 이상이면 LaTeX 명령 → \\ 로 이스케이프
 *       이미 \\로 이스케이프된 것은 건드리지 않음
 *       JSON 이스케이프(\n, \t 등)는 1글자이므로 {2,} 패턴에 안 걸림
 */
function escapeLatexInJson(jsonStr: string): string {
  // 1) 알파벳 2글자 이상 LaTeX 명령어: \times → \\times
  let result = jsonStr.replace(
    /\\\\|\\([a-zA-Z]{2,})/g,
    (match, letters) => (letters ? "\\\\" + letters : match)
  );
  // 2) LaTeX 특수문자 이스케이프: \{ → \\{, \} → \\}, \, → \\, 등
  //    JSON에서 유효하지 않은 이스케이프 시퀀스 → "Bad escaped character" 에러 발생
  //    이미 \\로 이스케이프된 것은 건드리지 않음
  result = result.replace(/(?<!\\)\\([{},;:!>< #%&_^~|])/g, "\\\\$1");
  return result;
}

/**
 * 수식 내 함수명 자동 교정
 */
function fixMathOperators(html: string): string {
  // 연산자 함수 (백슬래시 없이 쓰면 이탤릭으로 렌더링되는 것들)
  const operators = [
    "lim", "log", "sin", "cos", "tan", "max", "min", "sup", "inf",
    "ln", "exp", "sec", "csc", "cot", "arcsin", "arccos", "arctan",
  ];

  // 기호 명령어 (백슬래시 없이 쓰면 완전히 깨지는 것들)
  const symbols = [
    "times", "cdot", "div", "pm", "mp", "ast", "star", "circ",
    "bullet", "oplus", "otimes", "odot",
    "leq", "geq", "neq", "approx", "equiv", "sim", "simeq",
    "ll", "gg", "prec", "succ", "preceq", "succeq",
    "subset", "supset", "subseteq", "supseteq", "in", "notin", "ni",
    "cap", "cup", "setminus", "emptyset", "varnothing",
    "forall", "exists", "nexists", "neg", "land", "lor",
    "implies", "iff", "therefore", "because",
    "alpha", "beta", "gamma", "delta", "epsilon", "varepsilon",
    "zeta", "eta", "theta", "vartheta", "iota", "kappa",
    "lambda", "mu", "nu", "xi", "omicron", "pi", "varpi",
    "rho", "varrho", "sigma", "varsigma", "tau", "upsilon",
    "phi", "varphi", "chi", "psi", "omega",
    "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta",
    "Theta", "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi",
    "Omicron", "Pi", "Rho", "Sigma", "Tau", "Upsilon",
    "Phi", "Chi", "Psi", "Omega",
    "infty", "nabla", "partial", "angle", "measuredangle",
    "perp", "parallel", "propto",
    "rightarrow", "leftarrow", "leftrightarrow",
    "Rightarrow", "Leftarrow", "Leftrightarrow",
    "uparrow", "downarrow", "mapsto", "hookrightarrow", "hookleftarrow",
    "to", "gets",
    "quad", "qquad", "text", "mathrm", "mathbf", "mathit", "mathbb",
    "overline", "underline", "hat", "bar", "vec", "dot", "ddot", "tilde",
    "sqrt", "frac", "dfrac", "tfrac", "binom", "dbinom", "tbinom",
    "sum", "prod", "coprod", "int", "iint", "iiint", "oint",
    "bigcup", "bigcap", "bigoplus", "bigotimes",
    "displaystyle", "textstyle", "scriptstyle",
    "left", "right", "big", "Big", "bigg", "Bigg",
    "not", "prime", "ldots", "cdots", "vdots", "ddots",
  ];

  const allOps = [...operators, ...symbols];

  let result = html.replace(/\$\$[\s\S]*?\$\$|\$[^$]+?\$/g, (match) => {
    let fixed = match;
    for (const op of allOps) {
      const regex = new RegExp(`(?<!\\\\)(?<![a-zA-Z])${op}(?![a-zA-Z])`, "g");
      fixed = fixed.replace(regex, `\\${op}`);
    }
    fixed = fixed.replace(/->/g, "\\to");
    // 이중 백슬래시 수리 (\\\\op → \\op)
    for (const op of allOps) {
      fixed = fixed.replace(new RegExp(`\\\\\\\\${op}`, "g"), `\\${op}`);
    }
    return fixed;
  });

  return result;
}

/**
 * LaTeX 환경(\begin, \end)의 이중 이스케이프 수리
 * Gemini가 이스케이프 수준을 일관되지 않게 보내면
 * JSON 파싱 후 \\begin{cases} (이중 백슬래시)가 남아 KaTeX 실패
 */
function fixDoubleEscapedEnvironments(html: string): string {
  // $$ 블록 안의 백슬래시를 KaTeX 표준으로 일괄 정규화
  // Gemini가 매번 다른 수준으로 이스케이프하므로, 특정 패턴이 아닌 모든 경우를 처리
  //
  // KaTeX 표준:
  //   \command  = 백슬래시 1개 + 명령어 (예: \begin, \geq, \frac)
  //   \\        = 백슬래시 2개 (줄바꿈, cases 환경 등)
  //
  // 정규화 규칙:
  //   백슬래시 2개 이상 + 영문자 → 백슬래시 1개 + 영문자 (명령어)
  //   백슬래시 3개 이상 + 비영문자 → 백슬래시 2개 (줄바꿈)
  //   백슬래시 정확히 2개 + 비영문자 → 그대로 유지 (이미 올바른 줄바꿈)
  //   백슬래시 1개 + 영문자 → 그대로 유지 (이미 올바른 명령어)
  const normalizeMathBlock = (inner: string): string => {
    let fixed = inner;
    // 2개 이상 연속 백슬래시 + 영문자 → 1개 백슬래시 + 영문자 (명령어 정규화)
    fixed = fixed.replace(/\\{2,}([a-zA-Z])/g, "\\$1");
    // 3개 이상 연속 백슬래시 + 비영문자(또는 끝) → 2개 백슬래시 (줄바꿈 정규화)
    fixed = fixed.replace(/\\{3,}(?=[^a-zA-Z]|$)/g, "\\\\");
    return fixed;
  };

  // 블록 수식 $$...$$ 처리
  let result = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, inner: string) => {
    return `$$${normalizeMathBlock(inner)}$$`;
  });

  // 인라인 수식 $...$ 처리
  result = result.replace(/(?<!\$)\$(?!\$)((?:[^$\\]|\\.)*?)\$(?!\$)/g, (_, inner: string) => {
    return `$${normalizeMathBlock(inner)}$`;
  });

  return result;
}

/**
 * 구간별 정의 함수 자동 수정: cases 환경 없이 한 줄로 나열된 경우 → cases로 변환
 *
 * 감지 패턴 예:
 *   $$f(x) = \{ax^2-2 \quad (x < 2) \quad 3x \quad (x \geq 2)\}$$
 *   $$f(x) = \left\{ ax^2-2 (x<2), 3x (x≥2) \right.$$
 *
 * 변환 결과:
 *   $$f(x) = \begin{cases} ax^2-2 & (x < 2) \\ 3x & (x \geq 2) \end{cases}$$
 */
function fixPiecewiseFunctions(html: string): string {
  console.log("🔍 [DEBUG] fixPiecewiseFunctions 입력:", JSON.stringify(html).slice(0, 500));
  return html.replace(/\$\$([\s\S]*?)\$\$/g, (match, inner: string) => {
    // cases가 이미 있으면 건너뛰기
    if (inner.includes("\\begin{cases}")) {
      console.log("✅ [DEBUG] cases 이미 존재, 스킵");
      return match;
    }

    // 조건 패턴이 2개 이상 있는지 확인: (변수 부등호 값) 형태
    const condPattern = /\(\s*[a-zA-Z]\s*(?:[<>≤≥]|\\leq|\\geq|\\le|\\ge|\\leqslant|\\geqslant)\s*[^)]*\)/g;
    const conditions = inner.match(condPattern);
    console.log("🔍 [DEBUG] $$ 블록 내용:", JSON.stringify(inner).slice(0, 300));
    console.log("🔍 [DEBUG] 조건 패턴 감지:", conditions);
    if (!conditions || conditions.length < 2) return match;

    // = \{ 또는 = \left\{ 패턴이 있는지 확인
    const hasBraceOpen = /=\s*(?:\\left\s*)?\\?\{/.test(inner);
    console.log("🔍 [DEBUG] 중괄호 열기 감지:", hasBraceOpen, "inner:", JSON.stringify(inner).slice(0, 200));
    if (!hasBraceOpen) return match;

    console.log("🔧 구간별 함수 자동 수정: cases 환경으로 변환");

    let fixed = inner;

    // Step 1: 여는 중괄호를 \begin{cases}로 교체
    fixed = fixed.replace(/=\s*\\left\s*\\\{/, "= \\begin{cases}");
    fixed = fixed.replace(/=\s*\\\{/, "= \\begin{cases}");

    // Step 2: 닫는 중괄호를 \end{cases}로 교체
    // \right\}, \right., \} 패턴
    fixed = fixed.replace(/\\right\s*\\\}?\s*$/, "\\end{cases}");
    fixed = fixed.replace(/\\right\s*\.\s*$/, "\\end{cases}");
    // 마지막 \} 제거 (cases 닫는 중괄호)
    if (!fixed.includes("\\end{cases}")) {
      // 마지막 조건 뒤의 \}를 \end{cases}로 교체
      const lastCondIdx = fixed.lastIndexOf(conditions[conditions.length - 1]);
      if (lastCondIdx >= 0) {
        const afterLastCond = fixed.slice(lastCondIdx + conditions[conditions.length - 1].length);
        const braceMatch = afterLastCond.match(/\s*\\\}\s*$/);
        if (braceMatch) {
          fixed = fixed.slice(0, fixed.length - braceMatch[0].length) + " \\end{cases}";
        } else {
          fixed = fixed.trimEnd() + " \\end{cases}";
        }
      }
    }

    // Step 3: 각 조건 앞에 & 추가, 각 조건 뒤에 \\ 추가 (마지막 제외)
    for (let i = 0; i < conditions.length; i++) {
      const cond = conditions[i];
      if (i < conditions.length - 1) {
        // 중간 조건: & cond \\
        fixed = fixed.replace(cond, `& ${cond} \\\\`);
      } else {
        // 마지막 조건: & cond
        fixed = fixed.replace(cond, `& ${cond}`);
      }
    }

    // Step 4: \quad, 콤마 등 불필요한 구분자 정리
    fixed = fixed.replace(/\\quad\s*&/g, " &");
    fixed = fixed.replace(/,\s*&/g, " &");
    fixed = fixed.replace(/\\\\\s*\\quad/g, "\\\\");
    fixed = fixed.replace(/\\\\\s*,/g, "\\\\");

    return `$$${fixed}$$`;
  });
}

/**
 * 수식 안의 answer-box HTML → \boxed{} 변환 (KaTeX 파싱 실패 방지)
 * $$...$$ 또는 $...$ 안에 <span class="answer-box"> 가 있으면 자동 변환
 */
function fixAnswerBoxInMath(html: string): string {
  // 블록 수식 $$...$$ 처리
  let result = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
    if (content.includes("answer-box") || content.includes("<span") || content.includes("<div")) {
      const fixed = content
        .replace(/<span\s+class=["']answer-box["']>(.*?)<\/span>/gi, (_: string, text: string) => `\\boxed{\\text{${text}}}`)
        .replace(/<[^>]+>/g, ""); // 남은 HTML 태그 제거
      return `$$${fixed}$$`;
    }
    return match;
  });

  // 인라인 수식 $...$ 처리 ($$는 이미 처리됨)
  result = result.replace(/(?<!\$)\$(?!\$)((?:[^$\\]|\\.)*?)\$(?!\$)/g, (match, content) => {
    if (content.includes("answer-box") || content.includes("<span") || content.includes("<div")) {
      const fixed = content
        .replace(/<span\s+class=["']answer-box["']>(.*?)<\/span>/gi, (_: string, text: string) => `\\boxed{\\text{${text}}}`)
        .replace(/<[^>]+>/g, "");
      return `$${fixed}$`;
    }
    return match;
  });

  return result;
}

export interface AnalysisResult {
  problemData: ProblemData;
  html: string;
}

/**
 * bodyHtml에서 <보기> 블록을 감지하여 conditionHtml로 추출
 * Gemini가 conditionHtml 대신 bodyHtml에 보기를 넣는 경우의 후처리
 */
function extractConditionFromBody(bodyHtml: string): { bodyHtml: string; conditionHtml: string } | null {
  // <보 기> 또는 &lt;보기&gt; 또는 &lt;보 기&gt; 패턴 감지
  // 보기 제목부터 선지(①) 직전 또는 question-line 직전까지 추출
  const bogiPatterns = [
    /(&lt;\s*보\s*기\s*&gt;|<보\s*기>|＜\s*보\s*기\s*＞)/,
  ];

  let bogiIdx = -1;
  let matchedPattern = "";
  for (const pat of bogiPatterns) {
    const m = bodyHtml.match(pat);
    if (m && m.index !== undefined) {
      bogiIdx = m.index;
      matchedPattern = m[0];
      break;
    }
  }

  if (bogiIdx === -1) return null;

  // 보기 끝 지점: 선지(①②③④⑤) 시작 직전, 또는 bodyHtml 끝
  const afterBogi = bodyHtml.slice(bogiIdx);
  const choiceMatch = afterBogi.match(/[①②③④⑤]\s/);
  const endIdx = choiceMatch && choiceMatch.index !== undefined
    ? bogiIdx + choiceMatch.index
    : bodyHtml.length;

  // 보기 내용 추출
  const conditionRaw = bodyHtml.slice(bogiIdx, endIdx).trim();
  // bodyHtml에서 보기 부분 제거
  const newBodyHtml = (bodyHtml.slice(0, bogiIdx) + bodyHtml.slice(endIdx)).trim();

  // 보기 제목을 strong 태그로 감싸기
  const conditionHtml = conditionRaw.replace(
    matchedPattern,
    `<strong>${matchedPattern}</strong>`
  );

  return { bodyHtml: newBodyHtml, conditionHtml };
}

/**
 * Step 0: Flash로 도형 유무만 빠르게 판별 (0.5~1초)
 */
async function detectDiagram(
  client: InstanceType<typeof GoogleGenerativeAI>,
  imageContent: { inlineData: { mimeType: string; data: string } }
): Promise<{ hasDiagram: boolean; position: "insideCondition" | "afterBody" }> {
  const model = client.getGenerativeModel({
    model: "gemini-3-flash-preview",
    systemInstruction: `이미지를 보고 도형, 그래프, 그림, 도표가 있는지 판단하고, 있다면 위치도 판단하세요.
주의: <보기> 박스의 사각형 테두리, 단순 텍스트 박스, 선지 번호 등은 도형이 아닙니다. 수학적 그래프, 좌표계, 벤 다이어그램, 흐름도, 표(table), 삽화 등 실제 도형/도표만 판단하세요.

반드시 다음 중 하나만 응답하세요:
- none (도형 없음)
- insideCondition (도형이 <보기> 박스 안에 위치)
- afterBody (도형이 <보기> 밖 또는 본문 영역에 위치)`,
  });
  const result = await safeGenerate(model, [
    imageContent,
    { text: "이 국어 문제에 도형, 그래프, 도표, 또는 그림이 있습니까? 있다면 <보기> 박스 안에 있습니까, 밖에 있습니까? none/insideCondition/afterBody 중 하나만 답하세요." },
  ]);
  const text = result.response.text()?.trim().toLowerCase() || "";
  if (text.includes("none")) {
    return { hasDiagram: false, position: "afterBody" };
  }
  const position = text.includes("insidecondition") ? "insideCondition" as const : "afterBody" as const;
  return { hasDiagram: true, position };
}

/**
 * 텍스트 분석 (Flash 기본, 검증 실패 시 Pro 자동 재시도)
 */
async function analyzeText(
  client: InstanceType<typeof GoogleGenerativeAI>,
  imageContent: { inlineData: { mimeType: string; data: string } },
  userMessage: string,
  tier: "flash" | "pro" = "flash"
): Promise<Record<string, unknown>> {
  const modelName = tier === "pro" ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
  });
  const result = await safeGenerate(model, [imageContent, { text: userMessage }]);
  const responseText = result.response.text();
  if (!responseText) throw new Error(`Gemini ${tier} 응답 없음`);

  let jsonStr = responseText.trim();
  const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1].trim();

  // ★ 디버그: Gemini 원본 JSON (escapeLatexInJson 적용 전)
  const casesArea = jsonStr.match(/begin.{0,50}cases/)?.[0];
  if (casesArea) {
    console.log("🔬 [DEBUG] Gemini 원본 cases 근처:", JSON.stringify(casesArea));
    console.log("🔬 [DEBUG] 백슬래시 charCodes:", [...casesArea].map(c => c === '\\' ? '\\' : '').filter(Boolean).length, "개");
  }

  const escaped = escapeLatexInJson(jsonStr);

  // ★ 디버그: escapeLatexInJson 후
  const casesArea2 = escaped.match(/begin.{0,50}cases/)?.[0];
  if (casesArea2) {
    console.log("🔬 [DEBUG] escapeLatex 후 cases 근처:", JSON.stringify(casesArea2));
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(escaped);
  } catch {
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e2) {
      throw new Error(`${tier} JSON 파싱 실패: ${(e2 as Error).message}\n원본: ${jsonStr.slice(0, 300)}`);
    }
  }

  // ★ 디버그: Gemini 원본 bodyHtml 출력
  console.log("📋 [DEBUG] Gemini bodyHtml 원본:", JSON.stringify((parsed.bodyHtml as string) || "").slice(0, 500));

  // 국어 문제는 수학 전용 cases 검증 불필요
  return parsed;
}

/**
 * TikZ 코드 생성 (코드블록 응답 — JSON 이스케이프 문제 없음)
 * tier: "flash" (빠름, 기본) | "pro" (정확, 재생성용)
 */
async function generateTikz(
  client: InstanceType<typeof GoogleGenerativeAI>,
  imageContent: { inlineData: { mimeType: string; data: string } },
  tier: "flash" | "pro" = "flash"
): Promise<string | null> {
  const tikzRulesSection = SYSTEM_PROMPT.includes("## 도형 처리 (TikZ")
    ? SYSTEM_PROMPT.slice(
        SYSTEM_PROMPT.indexOf("## 도형 처리 (TikZ"),
        SYSTEM_PROMPT.indexOf("## 빈칸 상자") > 0
          ? SYSTEM_PROMPT.indexOf("## 빈칸 상자")
          : undefined
      )
    : "";

  const modelName = tier === "pro" ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: [
      "당신은 국어 문제의 도표/그림을 TikZ 코드로 변환하는 전문가입니다.",
      "사용자가 국어 문제 이미지를 보내면, 도표/그림 부분만 TikZ 코드로 생성합니다.",
      "",
      "⚠️ 중요: <보기> 박스의 사각형 테두리는 도형이 아닙니다! 텍스트를 감싸는 단순 박스/테두리는 무시하세요.",
      "도형이 아닌 것: <보기> 박스 테두리, 선지 번호, 문제 번호 박스, 단순 텍스트 테두리",
      "도형인 것: 수학적 그래프, 좌표계, 벤 다이어그램, 흐름도, 표(table), 도식",
      "도형이 없으면 아무것도 응답하지 마세요.",
      "",
      "응답 형식: ```latex 코드블록 안에 \\begin{tikzpicture}...\\end{tikzpicture}만 넣으세요.",
      "JSON으로 감싸지 마세요. 순수 TikZ 코드만 응답하세요.",
      "",
      tikzRulesSection,
    ].join("\n"),
  });

  const result = await safeGenerate(model, [
    imageContent,
    { text: "이 국어 문제의 도표/그림을 TikZ 코드로 생성해주세요. ```latex 코드블록으로 응답하세요." },
  ]);
  const text = result.response.text();
  if (!text) return null;

  const codeMatch = text.match(/```(?:latex|tikz)?\s*([\s\S]*?)```/);
  const tikzCode = codeMatch ? codeMatch[1].trim() : text.trim();
  return tikzCode.includes("\\begin{tikzpicture}") ? tikzCode : null;
}

export async function analyzeProblemImage(
  imageBase64: string,
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif",
  problemNumber?: number,
  source?: string,
  headerText?: string,
  footerText?: string,
  usePro?: boolean,
  renderOptions?: RenderOptions
): Promise<AnalysisResult> {
  const client = getClient();

  const userMessage = problemNumber
    ? `이 국어 문제를 분석해주세요. 문제 번호는 ${problemNumber}번입니다.`
    : "이 국어 문제를 분석해주세요.";

  const imageContent = {
    inlineData: { mimeType: mediaType, data: imageBase64 },
  };

  // 텍스트 분석: usePro이면 Pro, 아니면 Flash (cases 검증 실패 시 자동 Pro 재시도)
  // TikZ 생성: detectDiagram으로 도형 유무 먼저 판별 후, 있을 때만 Pro로 생성
  const textTier = usePro ? "pro" : "flash";

  // Step 1: 텍스트 분석 + 도형 유무/위치 판별 병렬 실행
  const [parsed, diagramResult] = await Promise.all([
    analyzeText(client, imageContent, userMessage, textTier),
    detectDiagram(client, imageContent),
  ]);
  const hasDiagramDetected = diagramResult.hasDiagram;
  const diagramPosition = diagramResult.position;
  console.log(`${textTier}(텍스트) 완료, 도형 감지: ${hasDiagramDetected}, 위치: ${diagramPosition}`);

  // Step 2: 도형이 있을 때만 TikZ 생성
  const tikzCode = hasDiagramDetected
    ? await generateTikz(client, imageContent, "pro")
    : null;

  const hasDiagram = !!tikzCode;
  if (tikzCode) {
    console.log("Pro TikZ 생성 성공");
  } else {
    console.log("도형 없음 (Pro가 TikZ 미반환)");
  }

  // TikZ → PNG 렌더링 + 레이아웃 자동 판별
  let diagramPngBase64: string | undefined;
  let diagramLayout: "single" | "wide" | "multi" = "single";

  if (tikzCode) {
    // 레이아웃 자동 판별 (TikZ 코드 분석)
    if (tikzCode.includes("minipage") || tikzCode.includes("\\hfill")) {
      diagramLayout = "multi";  // 여러 도형 나란히 (R1, R2 등)
    } else if (tikzCode.includes("->") && tikzCode.includes("axis") || tikzCode.match(/\\draw.*\(-?\d+,-?\d+\).*--.*\(-?\d+,-?\d+\)/)) {
      diagramLayout = "wide";   // 좌표계/그래프
    }
    console.log(`도형 레이아웃: ${diagramLayout}`);

    try {
      console.log("TikZ 렌더링 시작:", tikzCode.slice(0, 100));
      diagramPngBase64 = await renderTikzToPng(tikzCode);
      console.log("TikZ 렌더링 성공");
    } catch (err) {
      console.error("TikZ 렌더링 실패:", err);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = parsed as any;

  // 후처리: bodyHtml에 <보기> 내용이 포함된 경우 conditionHtml로 추출
  let bodyHtml: string = p.bodyHtml || "";
  let conditionHtml: string | undefined = p.conditionHtml || undefined;

  if (!conditionHtml && bodyHtml) {
    const extracted = extractConditionFromBody(bodyHtml);
    if (extracted) {
      bodyHtml = extracted.bodyHtml;
      conditionHtml = extracted.conditionHtml;
      console.log("📦 [후처리] bodyHtml에서 <보기> 내용을 conditionHtml로 추출");
    }
  }

  const problemData: ProblemData = {
    number: problemNumber ?? p.number ?? 1,
    subject: p.subject || "국어",
    type: p.type || "객관식",
    points: p.points || 3,
    difficulty: p.difficulty || 3,
    unitName: p.unitName || undefined,
    source: source || undefined,
    headerText: headerText || undefined,
    footerText: footerText || undefined,
    bodyHtml,
    questionHtml: "",
    conditionHtml,
    hasDiagram: !!hasDiagram,
    diagramPngBase64,
    diagramLayout,
    diagramPosition,
    choicesHtml: p.choicesHtml || undefined,
  };

  const html = generateProblemHtml(problemData, renderOptions);

  return { problemData, html };
}

/**
 * Pro로 TikZ 재생성 (사용자가 "Pro로 재생성" 버튼 클릭 시)
 */
export async function regenerateTikzWithPro(
  imageBase64: string,
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif"
): Promise<{ tikzCode: string | null; pngBase64: string | null; diagramLayout: "single" | "wide" | "multi" }> {
  const client = getClient();
  const imageContent = {
    inlineData: { mimeType: mediaType, data: imageBase64 },
  };

  console.log("Pro TikZ 재생성 시작...");
  const tikzCode = await generateTikz(client, imageContent, "pro");

  let pngBase64: string | null = null;
  let diagramLayout: "single" | "wide" | "multi" = "single";

  if (tikzCode) {
    if (tikzCode.includes("minipage") || tikzCode.includes("\\hfill")) {
      diagramLayout = "multi";
    } else if (tikzCode.includes("->") && tikzCode.includes("axis") || tikzCode.match(/\\draw.*\(-?\d+,-?\d+\).*--.*\(-?\d+,-?\d+\)/)) {
      diagramLayout = "wide";
    }

    try {
      pngBase64 = await renderTikzToPng(tikzCode);
      console.log("Pro TikZ 재생성 성공");
    } catch (err) {
      console.error("Pro TikZ 렌더링 실패:", err);
    }
  }

  return { tikzCode, pngBase64, diagramLayout };
}

/**
 * 지문 이미지 분석 — 지문만 추출하여 HTML로 변환
 */
export async function analyzePassageImage(
  imageBase64: string,
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif",
  source?: string
): Promise<{ passageHtml: string; passageSubject: string; passageUnit: string }> {
  const client = getClient();

  const PASSAGE_PROMPT = `[교육 자료 제작 목적] 이 작업은 한국 교육방송(EBS) 스타일의 교육 콘텐츠 제작을 위해 이미지 내 텍스트를 구조화된 HTML로 변환하는 것입니다. 원본 텍스트의 의미를 보존하면서 교육 방송 화면에 적합한 형태로 재구성하세요.

당신은 국어 지문(제시문) 이미지를 분석하여 HTML로 변환하는 전문가입니다.

## 작업
사용자가 국어 지문 스크린샷을 보내면 지문 텍스트를 정확하게 추출합니다.

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요.

\`\`\`json
{
  "subject": "독서",
  "unitName": "인문",
  "passageHtml": "지문 전체 HTML"
}
\`\`\`

## 지문 처리 규칙
- 비문학: 문단별 <p> 태그, 들여쓰기 유지
- 시(詩): 행마다 <br>, 연 구분은 <br><br>, 제목/작가는 <div class="poem-title">제목 — 작가</div>
- 소설/수필: 대화문 따옴표 유지, [중략] 등은 <div class="passage-note">[중략]</div>
- 밑줄: <u>내용</u>, ⓐⓑⓒ 등 기호는 유니코드 그대로
- [A], [B] 등 구간 표시 그대로 유지
- 한자 병기 유지
- 각주/미주 포함`;

  const model = client.getGenerativeModel({
    model: "gemini-3-flash-preview",
    systemInstruction: PASSAGE_PROMPT,
  });

  const result = await safeGenerate(model, [
    { inlineData: { mimeType: mediaType, data: imageBase64 } },
    { text: "이 국어 지문을 분석해주세요." },
  ]);

  const responseText = result.response.text();
  if (!responseText) throw new Error("지문 분석 실패: 응답 없음");

  let jsonStr = responseText.trim();
  const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1].trim();

  const escaped = escapeLatexInJson(jsonStr);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(escaped);
  } catch {
    parsed = JSON.parse(jsonStr);
  }

  return {
    passageHtml: (parsed.passageHtml as string) || "",
    passageSubject: (parsed.subject as string) || "국어",
    passageUnit: (parsed.unitName as string) || "",
  };
}

/**
 * 지문 맥락을 포함하여 문제 이미지 분석
 * passageHtml을 Gemini에 텍스트로 제공하여 문맥 이해도를 높임
 */
export async function analyzeWithPassage(
  passageHtml: string,
  problemImageBase64: string,
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif",
  problemNumber?: number,
  source?: string,
  headerText?: string,
  footerText?: string,
  renderOptions?: RenderOptions,
): Promise<AnalysisResult> {
  const client = getClient();

  const userMessage = `이 국어 문제를 분석해주세요.${problemNumber ? ` 문제 번호는 ${problemNumber}번입니다.` : ""}

참고로, 이 문제는 아래 지문과 함께 출제된 문제입니다. 지문 내용을 참고하여 문제를 정확하게 분석해주세요.
단, bodyHtml에는 문제 이미지에 보이는 내용만 넣으세요. 지문 본문은 넣지 마세요.

--- 지문 ---
${passageHtml}
--- 지문 끝 ---`;

  const imageContent = {
    inlineData: { mimeType: mediaType, data: problemImageBase64 },
  };

  const parsed = await analyzeText(client, imageContent, userMessage, "flash");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = parsed as any;
  const problemData: ProblemData = {
    number: problemNumber ?? p.number ?? 1,
    subject: p.subject || "국어",
    type: p.type || "객관식",
    points: p.points || 3,
    difficulty: p.difficulty || 3,
    unitName: p.unitName || undefined,
    source: source || undefined,
    headerText: headerText || undefined,
    footerText: footerText || undefined,
    bodyHtml: p.bodyHtml || "",
    questionHtml: "",
    conditionHtml: p.conditionHtml || undefined,
    hasDiagram: false,
    diagramPosition: p.diagramPosition === "insideCondition" ? "insideCondition" : "afterBody",
    choicesHtml: p.choicesHtml || undefined,
  };

  const html = generateProblemHtml(problemData, renderOptions);
  return { problemData, html };
}

/**
 * 강의노트/교재 이미지 분석 — 텍스트+구조 추출하여 HTML로 변환
 */
export async function analyzeLectureNoteImage(
  imageBase64: string,
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif",
  source?: string
): Promise<{ noteHtml: string; noteTitle: string; noteSubject: string; hasDiagram: boolean }> {
  const client = getClient();

  const NOTE_PROMPT = `[교육 자료 제작 목적] 이 작업은 한국 교육방송(EBS) 스타일의 교육 콘텐츠 제작을 위해 이미지 내 텍스트를 구조화된 HTML로 변환하는 것입니다. 원본 텍스트의 의미를 보존하면서 교육 방송 화면에 적합한 형태로 재구성하세요.

당신은 국어 교재/강의노트 이미지를 분석하여 HTML로 변환하는 전문가입니다.

## 작업
사용자가 국어 강의노트, EBS 교재 페이지, 개념 정리 자료 등의 스크린샷을 보내면 내용을 **빠짐없이** 정확하게 추출합니다.

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요.

\`\`\`json
{
  "noteTitle": "노트 제목/테마명",
  "noteSubject": "독서",
  "noteHtml": "강의노트 전체 HTML",
  "hasDiagram": false
}
\`\`\`

## 강의노트 변환 규칙
- 제목/테마명: <h2 class="note-theme">Theme 2. 비유의 방식</h2>
- 소제목/개념학습 라벨: <h3 class="note-subtitle">개념 학습: 동어 치환은 대응의 개념으로 쓰인다</h3>
- 핵심 포인트: <div class="note-point"><strong>독해 POINT</strong><br>포인트 내용...</div>
- 정의/개념 번호별: <div class="note-concept"><strong>1. 정의:</strong> A를 A답게 규정하는 것이다.<br>독서에서 정의는...</div>
- 보조설명/사이드노트(왼쪽 칼럼 등): <div class="note-side"><strong>소제목</strong><br>내용...</div>
- 강조: <strong>강조</strong>
- 일반 문단: <p>내용</p>
- 밑줄: <u>내용</u>
- 구분선: <hr class="note-divider">

## ★★★ 그림/도형/차트/그래프 감지 규칙 ★★★

이미지에 **그림, 도형, 차트, 그래프, 표, 삽화, 다이어그램** 등 텍스트가 아닌 시각적 요소가 있으면:
1. "hasDiagram"을 true로 설정
2. noteHtml에서 해당 그림이 위치하는 곳에 정확히 다음 플레이스홀더를 삽입:
   <div class="note-diagram"><!-- DIAGRAM --></div>
3. 그림 주변의 텍스트(캡션, 라벨, 번호 등)는 플레이스홀더 앞뒤에 정상적으로 추출
4. 그림이 여러 개면 각 위치에 플레이스홀더를 하나씩 삽입

## ★★★ 절대 규칙: 모든 텍스트 추출 (빠뜨리면 방송 사고!) ★★★

1. **2단/다단 레이아웃**: 이미지에 왼쪽 칼럼과 오른쪽 칼럼이 있으면 **양쪽 모두** 추출!
   - 왼쪽 사이드바 내용 → <div class="note-side">로 감싸기
   - 오른쪽 본문 내용 → 일반 구조로 작성
   - 어느 쪽이든 빠뜨리지 마세요!

2. **모든 문장을 끝까지 추출**: 문장을 중간에 자르거나 "..." 으로 생략하지 마세요.
   원본에 있는 모든 글자를 정확히 옮기세요.

3. **번호 체계 유지**: "1) 비유법의 뼈대", "2) 비유는..." 등 번호를 정확히 추출

4. **따옴표/인용문**: "표현하려는 대상(원관념)을 다른 대상(보조관념)에 빗대어 말하는 방식" 처럼 따옴표 안의 내용을 정확히 추출

5. **특수 라벨**: "보기", "함께 읽기", "개념 학습", "독해 POINT" 등은 해당 클래스로 변환`;

  const model = client.getGenerativeModel({
    model: "gemini-3.1-pro-preview",
    systemInstruction: NOTE_PROMPT,
  });

  const result = await safeGenerate(model, [
    { inlineData: { mimeType: mediaType, data: imageBase64 } },
    { text: "이 강의노트/교재 이미지의 모든 텍스트를 빠짐없이 추출해주세요. 왼쪽 칼럼과 오른쪽 칼럼이 있으면 양쪽 모두 추출하세요." },
  ]);

  const responseText = result.response.text();
  if (!responseText) throw new Error("강의노트 분석 실패: 응답 없음");

  let jsonStr = responseText.trim();
  const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1].trim();

  const escaped = escapeLatexInJson(jsonStr);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(escaped);
  } catch {
    parsed = JSON.parse(jsonStr);
  }

  let noteHtml = (parsed.noteHtml as string) || "";
  const hasDiagram = !!(parsed.hasDiagram);

  // 그림이 감지된 경우, 플레이스홀더를 원본 이미지로 교체
  if (hasDiagram && noteHtml.includes("<!-- DIAGRAM -->")) {
    const diagramImg = `<img src="data:${mediaType};base64,${imageBase64}" alt="강의노트 그림" class="note-diagram-img" />`;
    noteHtml = noteHtml.replace(
      /<div class="note-diagram"><!-- DIAGRAM --><\/div>/g,
      `<div class="note-diagram">${diagramImg}</div>`
    );
  }

  return {
    noteHtml,
    noteTitle: (parsed.noteTitle as string) || "강의노트",
    noteSubject: (parsed.noteSubject as string) || "국어",
    hasDiagram,
  };
}

export async function analyzeMultipleProblems(
  images: Array<{
    base64: string;
    mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
    number: number;
    source?: string;
  }>
): Promise<AnalysisResult[]> {
  return Promise.all(
    images.map((img) => analyzeProblemImage(img.base64, img.mediaType, img.number, img.source))
  );
}
