/**
 * 방송 품질 테마 시스템
 * - 배경 텍스처 프리셋 (칠판풍, 종이풍, 그라데이션, 투명)
 * - 과목별 색상 테마 (독서, 문학, 화작, 언매 등)
 * - 서체 혼용 시스템 (고딕 + 명조 + 강조체)
 * - 하단 자막 바(Lower-third) 설정
 */

// ─── 과목별 색상 테마 ─────────────────────────────────────
export interface SubjectTheme {
  name: string;
  primary: string;        // 주색상 (번호 뱃지, 강조)
  primaryRgb: string;     // rgb 값 (투명도 적용용)
  secondary: string;      // 보조색상 (테두리, 악센트)
  secondaryRgb: string;
  accent: string;         // 포인트 색상
  accentRgb: string;
  gradient: string;       // 그라데이션 CSS
  tagBg: string;          // 과목 태그 배경색
  tagColor: string;       // 과목 태그 글자색
  borderColor: string;    // 문제 박스 테두리
  headerGradient: string; // 헤더 배너 그라데이션
  lowerThirdBg: string;   // 하단 자막 바 배경
  lowerThirdAccent: string; // 하단 자막 악센트
}

export const SUBJECT_THEMES: Record<string, SubjectTheme> = {
  "독서": {
    name: "독서",
    primary: "#42a5f5",
    primaryRgb: "66,165,245",
    secondary: "#1e88e5",
    secondaryRgb: "30,136,229",
    accent: "#90caf9",
    accentRgb: "144,202,249",
    gradient: "linear-gradient(135deg, #42a5f5 0%, #1565c0 100%)",
    tagBg: "rgba(66,165,245,0.2)",
    tagColor: "#90caf9",
    borderColor: "rgba(66,165,245,0.5)",
    headerGradient: "linear-gradient(135deg, rgba(66,165,245,0.15), rgba(21,101,192,0.08))",
    lowerThirdBg: "linear-gradient(90deg, rgba(66,165,245,0.95), rgba(30,136,229,0.9))",
    lowerThirdAccent: "#90caf9",
  },
  "문학": {
    name: "문학",
    primary: "#ab47bc",
    primaryRgb: "171,71,188",
    secondary: "#8e24aa",
    secondaryRgb: "142,36,170",
    accent: "#ce93d8",
    accentRgb: "206,147,216",
    gradient: "linear-gradient(135deg, #ab47bc 0%, #6a1b9a 100%)",
    tagBg: "rgba(171,71,188,0.2)",
    tagColor: "#ce93d8",
    borderColor: "rgba(171,71,188,0.5)",
    headerGradient: "linear-gradient(135deg, rgba(171,71,188,0.15), rgba(106,27,154,0.08))",
    lowerThirdBg: "linear-gradient(90deg, rgba(171,71,188,0.95), rgba(142,36,170,0.9))",
    lowerThirdAccent: "#ce93d8",
  },
  "화법과 작문": {
    name: "화법과 작문",
    primary: "#66bb6a",
    primaryRgb: "102,187,106",
    secondary: "#43a047",
    secondaryRgb: "67,160,71",
    accent: "#a5d6a7",
    accentRgb: "165,214,167",
    gradient: "linear-gradient(135deg, #66bb6a 0%, #2e7d32 100%)",
    tagBg: "rgba(102,187,106,0.2)",
    tagColor: "#a5d6a7",
    borderColor: "rgba(102,187,106,0.5)",
    headerGradient: "linear-gradient(135deg, rgba(102,187,106,0.15), rgba(46,125,50,0.08))",
    lowerThirdBg: "linear-gradient(90deg, rgba(102,187,106,0.95), rgba(67,160,71,0.9))",
    lowerThirdAccent: "#a5d6a7",
  },
  "언어와 매체": {
    name: "언어와 매체",
    primary: "#ffa726",
    primaryRgb: "255,167,38",
    secondary: "#f57c00",
    secondaryRgb: "245,124,0",
    accent: "#ffcc80",
    accentRgb: "255,204,128",
    gradient: "linear-gradient(135deg, #ffa726 0%, #e65100 100%)",
    tagBg: "rgba(255,167,38,0.2)",
    tagColor: "#ffcc80",
    borderColor: "rgba(255,167,38,0.5)",
    headerGradient: "linear-gradient(135deg, rgba(255,167,38,0.15), rgba(230,81,0,0.08))",
    lowerThirdBg: "linear-gradient(90deg, rgba(255,167,38,0.95), rgba(245,124,0,0.9))",
    lowerThirdAccent: "#ffcc80",
  },
  "화작": {
    name: "화법과 작문",
    primary: "#66bb6a",
    primaryRgb: "102,187,106",
    secondary: "#43a047",
    secondaryRgb: "67,160,71",
    accent: "#a5d6a7",
    accentRgb: "165,214,167",
    gradient: "linear-gradient(135deg, #66bb6a 0%, #2e7d32 100%)",
    tagBg: "rgba(102,187,106,0.2)",
    tagColor: "#a5d6a7",
    borderColor: "rgba(102,187,106,0.5)",
    headerGradient: "linear-gradient(135deg, rgba(102,187,106,0.15), rgba(46,125,50,0.08))",
    lowerThirdBg: "linear-gradient(90deg, rgba(102,187,106,0.95), rgba(67,160,71,0.9))",
    lowerThirdAccent: "#a5d6a7",
  },
  "언매": {
    name: "언어와 매체",
    primary: "#ffa726",
    primaryRgb: "255,167,38",
    secondary: "#f57c00",
    secondaryRgb: "245,124,0",
    accent: "#ffcc80",
    accentRgb: "255,204,128",
    gradient: "linear-gradient(135deg, #ffa726 0%, #e65100 100%)",
    tagBg: "rgba(255,167,38,0.2)",
    tagColor: "#ffcc80",
    borderColor: "rgba(255,167,38,0.5)",
    headerGradient: "linear-gradient(135deg, rgba(255,167,38,0.15), rgba(230,81,0,0.08))",
    lowerThirdBg: "linear-gradient(90deg, rgba(255,167,38,0.95), rgba(245,124,0,0.9))",
    lowerThirdAccent: "#ffcc80",
  },
};

// 기본 테마 (과목 미지정 시)
export const DEFAULT_THEME: SubjectTheme = {
  name: "기본",
  primary: "#f9a825",
  primaryRgb: "249,168,37",
  secondary: "#e65100",
  secondaryRgb: "230,81,0",
  accent: "#ffd54f",
  accentRgb: "255,213,79",
  gradient: "linear-gradient(135deg, #f9a825 0%, #e65100 100%)",
  tagBg: "rgba(249,168,37,0.2)",
  tagColor: "#ffd54f",
  borderColor: "rgba(74,138,106,0.6)",
  headerGradient: "linear-gradient(135deg, rgba(249,168,37,0.12), rgba(255,143,0,0.08))",
  lowerThirdBg: "linear-gradient(90deg, rgba(249,168,37,0.95), rgba(230,81,0,0.9))",
  lowerThirdAccent: "#ffd54f",
};

export function getSubjectTheme(subject: string): SubjectTheme {
  return SUBJECT_THEMES[subject] || DEFAULT_THEME;
}

// ─── 배경 텍스처 프리셋 ──────────────────────────────────
export type BackgroundPreset = "transparent" | "chalkboard" | "paper" | "gradient-dark" | "gradient-navy";

export interface BackgroundConfig {
  name: string;
  description: string;
  css: string;                 // body background CSS
  overlayBefore?: string;      // ::before pseudo for texture overlay
  textColor: string;           // 텍스트 색상 오버라이드
  isDark: boolean;
}

export function getBackgroundCSS(preset: BackgroundPreset, theme: SubjectTheme): BackgroundConfig {
  switch (preset) {
    case "chalkboard":
      return {
        name: "칠판",
        description: "EBS 강의 칠판풍",
        isDark: true,
        textColor: "#fff",
        css: `
          background: #1a2a1a;
          background-image:
            radial-gradient(ellipse at 20% 50%, rgba(${theme.primaryRgb},0.03) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(${theme.secondaryRgb},0.02) 0%, transparent 50%),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.003) 2px,
              rgba(255,255,255,0.003) 4px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.002) 2px,
              rgba(255,255,255,0.002) 4px
            );
        `,
        overlayBefore: `
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 15% 85%, rgba(255,255,255,0.015) 0%, transparent 40%),
            radial-gradient(circle at 85% 15%, rgba(255,255,255,0.01) 0%, transparent 40%);
          pointer-events: none;
          z-index: 0;
        `,
      };

    case "paper":
      return {
        name: "종이",
        description: "고급 종이 텍스처",
        isDark: false,
        textColor: "#1a1a1a",
        css: `
          background: #f5f0e8;
          background-image:
            radial-gradient(ellipse at 30% 30%, rgba(${theme.primaryRgb},0.04) 0%, transparent 50%),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 1px,
              rgba(0,0,0,0.008) 1px,
              rgba(0,0,0,0.008) 2px
            );
        `,
        overlayBefore: `
          content: '';
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.05) 100%);
          pointer-events: none;
          z-index: 0;
        `,
      };

    case "gradient-dark":
      return {
        name: "다크 그라데이션",
        description: "프리미엄 다크 그라데이션",
        isDark: true,
        textColor: "#fff",
        css: `
          background: linear-gradient(145deg, #0a0a12 0%, #0f1525 30%, #0a1020 60%, #050510 100%);
          background-image:
            linear-gradient(145deg, #0a0a12 0%, #0f1525 30%, #0a1020 60%, #050510 100%),
            radial-gradient(ellipse at 20% 80%, rgba(${theme.primaryRgb},0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(${theme.secondaryRgb},0.04) 0%, transparent 50%);
        `,
      };

    case "gradient-navy":
      return {
        name: "네이비 그라데이션",
        description: "EBS 프리미엄 네이비",
        isDark: true,
        textColor: "#fff",
        css: `
          background: linear-gradient(160deg, #0d1b2a 0%, #1b2838 40%, #162032 70%, #0a1520 100%);
          background-image:
            linear-gradient(160deg, #0d1b2a 0%, #1b2838 40%, #162032 70%, #0a1520 100%),
            radial-gradient(ellipse at 25% 75%, rgba(${theme.primaryRgb},0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 75% 25%, rgba(${theme.accentRgb},0.03) 0%, transparent 50%);
        `,
      };

    case "transparent":
    default:
      return {
        name: "투명",
        description: "투명 배경 (합성용)",
        isDark: true,
        textColor: "#fff",
        css: `background: transparent;`,
      };
  }
}

// ─── 서체 시스템 ─────────────────────────────────────────
export interface FontSystem {
  imports: string;   // Google Fonts <link> tags
  heading: string;   // 제목/번호/강조 서체 (고딕)
  body: string;      // 본문/지문 서체 (명조 or 고딕)
  accent: string;    // 포인트/태그/배지 서체
  mono: string;      // 코드/수식 보조
}

export const FONT_SYSTEM: FontSystem = {
  imports: `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800;900&family=Noto+Serif+KR:wght@400;500;600;700;900&family=Black+Han+Sans&display=swap" rel="stylesheet">
  `.trim(),
  heading: "'Noto Sans KR', sans-serif",
  body: "'Noto Serif KR', 'Noto Sans KR', serif",
  accent: "'Black Han Sans', 'Noto Sans KR', sans-serif",
  mono: "'Noto Sans KR', monospace",
};

// ─── 하단 자막 바 (Lower-third) ──────────────────────────
export interface LowerThirdData {
  left: string;       // 왼쪽 텍스트 (예: "수능특강 | 독서")
  center?: string;    // 중앙 텍스트 (예: "인문 > 논증 구조 파악")
  right?: string;     // 오른쪽 텍스트 (예: "3번")
}

export function generateLowerThirdHtml(
  data: LowerThirdData,
  theme: SubjectTheme,
  isDark: boolean = true,
): string {
  if (!data.left && !data.center && !data.right) return '';

  const textShadow = isDark ? 'text-shadow: 0 1px 3px rgba(0,0,0,0.4);' : '';

  return `
  <div class="lower-third">
    <div class="lt-accent-bar"></div>
    <div class="lt-content">
      <div class="lt-left">${data.left}</div>
      ${data.center ? `<div class="lt-divider"></div><div class="lt-center">${data.center}</div>` : ''}
      ${data.right ? `<div class="lt-right">${data.right}</div>` : ''}
    </div>
  </div>
  <style>
  .lower-third {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: hidden;
    border-radius: 0 0 12px 12px;
  }
  .lt-accent-bar {
    height: 3px;
    background: ${theme.gradient};
    box-shadow: 0 0 12px rgba(${theme.primaryRgb}, 0.4);
  }
  .lt-content {
    display: flex;
    align-items: center;
    padding: 10px 28px;
    background: ${isDark
      ? `linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(${theme.primaryRgb},0.15) 50%, rgba(0,0,0,0.7) 100%)`
      : `linear-gradient(90deg, rgba(255,255,255,0.85) 0%, rgba(${theme.primaryRgb},0.1) 50%, rgba(255,255,255,0.85) 100%)`
    };
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    ${textShadow}
  }
  .lt-left {
    font-family: ${FONT_SYSTEM.heading};
    font-size: 13px;
    font-weight: 700;
    color: ${theme.accent};
    letter-spacing: 0.5px;
    white-space: nowrap;
  }
  .lt-divider {
    width: 1px;
    height: 14px;
    margin: 0 14px;
    background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'};
  }
  .lt-center {
    font-family: ${FONT_SYSTEM.heading};
    font-size: 12px;
    font-weight: 500;
    color: ${isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'};
    letter-spacing: 0.3px;
    white-space: nowrap;
  }
  .lt-right {
    margin-left: auto;
    font-family: ${FONT_SYSTEM.accent};
    font-size: 15px;
    font-weight: 400;
    color: ${theme.primary};
    letter-spacing: 1px;
  }
  </style>`;
}

// ─── 공통 스타일 생성 (배경 + 서체 + 테마) ────────────────
export interface BroadcastStyleOptions {
  subject: string;
  background: BackgroundPreset;
  showLowerThird: boolean;
  lowerThirdData?: LowerThirdData;
}

/**
 * 라이트/다크 모드에 따른 텍스트 색상 오버라이드 CSS를 반환
 * (종이 배경일 때 텍스트를 어둡게)
 */
export function getTextColorOverrides(isDark: boolean): string {
  if (isDark) return '';
  return `
    /* ─── 라이트 모드 텍스트 오버라이드 ─── */
    body { color: #1a1a1a; }
    .problem-body, .passage-body, .note-body,
    .q-text, .concept-text { color: rgba(0,0,0,0.85); }
    .stars { color: #b8860b; }
    .source-tag { color: rgba(0,0,0,0.6); }
    .condition {
      color: rgba(0,0,0,0.75);
      border-color: rgba(0,0,0,0.15);
    }
    .choice-item { color: rgba(0,0,0,0.8); }
    .katex, .katex * { color: #1a1a1a !important; }
    .katex .mord, .katex .mbin, .katex .mrel,
    .katex .mopen, .katex .mclose, .katex .mpunct,
    .katex .mop, .katex .minner { color: #1a1a1a !important; }
    .katex .boxpad { border-color: rgba(0,0,0,0.4) !important; }
    .katex .fbox { border-color: rgba(0,0,0,0.4) !important; }
    .writing-space { border-color: rgba(0,0,0,0.1); background: rgba(0,0,0,0.02); }
    .writing-line { border-color: rgba(0,0,0,0.06); }
  `;
}
