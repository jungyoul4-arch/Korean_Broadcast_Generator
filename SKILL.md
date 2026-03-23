---
name: math-broadcast-generator
description: "EBS/방송 수준의 고퀄리티 수학 문제 이미지를 생성합니다. 수학 문제 스크린샷이나 텍스트를 입력하면, 투명 배경 PNG로 방송급 디자인의 문제 이미지를 만들어줍니다. 수학 문제 이미지, 수학 문제 디자인, 방송용 문제, 칠판 문제, EBS 스타일, 수능 문제 이미지, 클래스인 문제, 라이브 수업 문제, 수학 시험지 디자인 등을 언급할 때 반드시 이 스킬을 사용하세요."
---

# Math Broadcast Generator

수학 문제 스크린샷이나 텍스트를 입력받아, EBS 방송 스튜디오에서 디지털 화면에 표시되는 것과 같은 수준의 고퀄리티 수학 문제 이미지를 투명 배경 PNG로 생성합니다.

## 사용 시나리오

- 라이브 방송 수업(클래스인 등)에서 디지털 칠판에 띄울 문제 이미지
- 온라인 강의 자료용 수학 문제 카드
- 유튜브/인강 영상에서 사용할 문제 오버레이

## 워크플로우

### Step 1: 문제 인식

사용자가 수학 문제를 제공하면(스크린샷 또는 텍스트), 다음을 수행한다:

1. **스크린샷인 경우**: 이미지를 읽고 각 문제의 텍스트와 수식을 정확하게 추출한다
2. **텍스트인 경우**: 수식 부분을 LaTeX 문법으로 변환한다
3. 추출한 문제를 사용자에게 보여주고 확인을 받는다 — 수식 오류는 방송 사고이므로 반드시 검증한다

### Step 2: HTML 레이아웃 생성

아래의 디자인 원칙에 따라 HTML 파일을 생성한다. 이 HTML이 최종 이미지의 원본이 된다.

#### 디자인 원칙 — EBS 방송 스타일

방송에서 보이는 수학 문제 화면의 핵심 특징:

**레이아웃**
- 각 문제는 독립적인 카드로 구성
- 문제 번호는 원형 또는 사각형 배지로 강조 (예: 파란 원 안의 흰색 숫자)
- 문제 텍스트와 수식 사이에 충분한 여백
- 보기(①②③④⑤)가 있으면 2열 또는 깔끔한 리스트로 배치

**색감**
- 주 색상: 네이비/딥블루 (#1a237e ~ #283593) 계열의 그라데이션 배지
- 보조 색상: 화이트, 밝은 그레이
- 수식 색상: 순수 블랙 또는 매우 진한 다크 그레이 (#1a1a1a)
- 강조(중요 조건, 밑줄): 딥 오렌지 (#e65100) 또는 레드 계열
- 전체적으로 차분하고 전문적인 톤 유지

**타이포그래피**
- 본문: Pretendard, Noto Sans KR 등 깔끔한 한글 산세리프
- 수식: KaTeX 렌더링 (선명하고 수학적으로 정확)
- 문제 번호: 볼드, 약간 큰 사이즈
- 충분한 line-height (1.7 이상)로 가독성 확보

**투명 배경**
- `background: transparent` — 칠판/화면 위에 오버레이하기 위함
- 카드 자체에도 반투명 또는 투명 배경 사용
- 텍스트와 수식이 어떤 배경 위에서도 잘 보이도록 미세한 텍스트 그림자 가능

#### HTML 템플릿 구조

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    /* 투명 배경 */
    html, body {
      margin: 0; padding: 0;
      background: transparent;
      font-family: 'Noto Sans KR', sans-serif;
    }

    .problem-container {
      padding: 40px;
      max-width: 1200px;
    }

    .problem-card {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 36px;
      padding: 28px 32px;
      border-radius: 16px;
      /* 반투명 카드 배경 — 선택사항, 투명도 조절 가능 */
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(2px);
    }

    .problem-number {
      flex-shrink: 0;
      width: 48px; height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1a237e, #3949ab);
      color: white;
      font-size: 22px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(26, 35, 126, 0.3);
    }

    .problem-content {
      flex: 1;
      color: #1a1a1a;
      font-size: 20px;
      line-height: 1.8;
    }

    .problem-content .highlight {
      color: #e65100;
      font-weight: 600;
    }

    .choices {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 40px;
      margin-top: 16px;
      font-size: 19px;
    }

    /* KaTeX 수식 크기 조절 */
    .katex { font-size: 1.15em; }
  </style>
</head>
<body>
  <div class="problem-container">
    <!-- 문제 카드를 여기에 반복 -->
    <div class="problem-card">
      <div class="problem-number">1</div>
      <div class="problem-content">
        <!-- 문제 텍스트 + LaTeX 수식 -->
      </div>
    </div>
  </div>

  <script>
    renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ]
    });
  </script>
</body>
</html>
```

이 템플릿은 기본 골격이다. 문제 유형에 따라 유연하게 조정하되, 다음은 반드시 지킨다:
- KaTeX CDN으로 수식 렌더링
- 투명 배경 (`background: transparent`)
- 한글 웹폰트 로드
- 문제 번호 배지 스타일

### Step 2.5: 도형 검증 (MANDATORY — 도형이 있는 문제만)

도형이 포함된 문제는 **반드시** 아래 검증 프로세스를 거친다. 도형 부정확은 방송 사고이므로 절대 건너뛰지 않는다.

#### 2.5.1 수학적 좌표 계산

SVG를 "대략적으로" 그리지 않는다. 반드시 다음 절차를 따른다:

1. **좌표계 설정**: 수학 좌표 → SVG 좌표 변환 공식을 명시한다
   - 예: `x_svg = 60 + 200 * x_math`, `y_svg = 340 - 200 * y_math`
   - x와 y 스케일을 동일하게 유지 (원이 찌그러지지 않도록)

2. **핵심 점 좌표 계산**: 삼각함수, 연립방정식 등으로 모든 점의 정확한 수학 좌표를 먼저 구한다
   - 예: θ=50°일 때 H = (cos²θ, cosθ sinθ), MH = sinθ

3. **곡선은 polyline으로**: Bezier 곡선 대신 실제 함수값을 10~20개 점으로 계산하여 `<polyline>`으로 그린다
   - 예: y=ln(x)+1 → x=0.5,0.7,1.0,1.3,...,4.0 각각의 (x_svg, y_svg) 계산

4. **검증 계산**: SVG 좌표로 변환 후 거리/각도를 역산하여 일치하는지 확인한다
   - 원 위의 점: 중심으로부터 거리 = 반지름인지 확인
   - 수선의 발: 내적 = 0 확인
   - 교점: 두 직선의 교점 좌표 일치 확인

#### 2.5.2 렌더링 후 시각 검증

HTML을 Playwright로 렌더링한 뒤, **초록 배경 위 스크린샷**을 찍어 원본 스크린샷과 비교한다:

```javascript
// 검증용 스크린샷 생성
await page.evaluate(() => { document.body.style.background = '#0d3b2e'; });
await container.screenshot({ path: outputPath.replace('.png', '_verify.png'), omitBackground: false });
```

비교 체크리스트:
- [ ] 모든 점이 정확한 위치에 있는가 (원 위의 점은 원 위에, 직선 위의 점은 직선 위에)
- [ ] 원이 찌그러지지 않았는가 (x/y 스케일 동일)
- [ ] 직각 표시가 실제 직각인 위치에 있는가
- [ ] 교점이 실제로 두 선의 교차점에 있는가
- [ ] 음영/채색 영역이 올바른 삼각형/영역을 덮고 있는가
- [ ] 레이블이 해당 점/영역 근처에 겹치지 않게 배치되었는가
- [ ] 원본 스크린샷의 도형 배치와 전체적으로 일치하는가

검증에서 하나라도 실패하면, SVG 좌표를 수정하고 다시 렌더링한다. **검증 통과 전까지 최종 PNG를 생성하지 않는다.**

#### 도형 유형별 계산 가이드

**원 + 삼각형 (내접/외접)**:
- 외접원: R = a/(2sinA) = b/(2sinB) = c/(2sinC)
- 내접원: r = Area / s (s = 반둘레)
- 이등변삼각형: 대칭축 활용, 꼭짓점 각도로 좌표 직접 계산

**좌표평면 + 곡선**:
- 함수 y=f(x)는 polyline으로 (최소 15개 점)
- 특수점: 극값, 변곡점, 축과의 교점을 반드시 포함
- 접선: 기울기 f'(a)로 정확하게 계산

**원 + 직선 (좌표기하)**:
- 원: (x-a)²+(y-b)²=r² → SVG <circle cx= cy= r=>
- 직선: 양 끝점을 방정식으로 계산
- 교점: 연립방정식으로 정확히 구한 좌표 사용

### Step 3: 이미지 렌더링

생성한 HTML을 Playwright로 열어 투명 배경 PNG로 캡처한다.

#### 렌더링 스크립트

스킬 디렉토리의 `scripts/render.js`를 사용한다. 만약 사용할 수 없는 환경이면, 아래 로직을 인라인으로 실행한다:

```javascript
// 핵심 렌더링 로직
const { chromium } = require('playwright');

async function renderMathImage(htmlPath, outputPath) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });

  // KaTeX 렌더링 완료 대기
  await page.waitForTimeout(2000);

  // 컨테이너 영역만 캡처 (투명 배경)
  const container = await page.$('.problem-container');
  await container.screenshot({
    path: outputPath,
    omitBackground: true  // 투명 배경 핵심 옵션
  });

  await browser.close();
}
```

**중요 옵션:**
- `omitBackground: true` — 이것이 투명 배경을 만드는 핵심
- `waitUntil: 'networkidle'` — 폰트와 KaTeX CSS 로딩 대기
- `waitForTimeout(2000)` — KaTeX 수식 렌더링 완료 보장

### Step 4: 사용자에게 전달

1. 생성된 PNG를 사용자의 원하는 경로에 저장한다
2. 이미지를 보여주고 피드백을 받는다
3. 수정 요청이 있으면 HTML을 조정하고 다시 렌더링한다

## 문제 유형별 처리

### 객관식 (보기 있음)
- ①②③④⑤ 보기를 `.choices` 그리드에 배치
- 보기에 수식이 있으면 각 보기도 KaTeX로 렌더링

### 주관식 / 서술형
- 보기 영역 없이 문제 텍스트만 표시
- "풀이 과정을 서술하시오" 같은 지시문은 이탤릭 처리

### 그래프/도형 포함 문제
- 원본 스크린샷에서 그래프 부분을 별도로 크롭하여 `<img>` 태그로 삽입
- 또는 SVG로 재구성 가능하면 재구성

### 조건/박스 문제
- "다음 조건을 만족시키는..." 같은 조건 박스는 별도 스타일링
- 얇은 테두리 + 약간의 패딩으로 구분

## 품질 체크리스트

렌더링 전 반드시 확인:
- [ ] 모든 수식이 LaTeX로 정확하게 변환되었는가
- [ ] 분수, 적분, 시그마 등 복잡한 수식이 깨지지 않는가
- [ ] 문제 번호가 순서대로 매겨졌는가
- [ ] 한글 텍스트가 올바르게 표시되는가
- [ ] 투명 배경이 정상 작동하는가 (`omitBackground: true`)
- [ ] 가독성이 충분한가 (폰트 크기, 줄간격, 여백)

## 의존성

- **Playwright**: `npx playwright install chromium` (브라우저 캡처용)
- **Node.js**: 렌더링 스크립트 실행
- **인터넷 연결**: KaTeX CDN, 웹폰트 로드

Playwright가 설치되어 있지 않으면 먼저 설치를 안내한다.

## 스타일 변형

사용자가 다른 스타일을 원할 수 있다. 기본은 EBS 네이비 스타일이지만:

- **밝은 스타일**: 흰색 카드 + 파란 악센트 (밝은 배경의 칠판용)
- **다크 스타일**: 다크 카드 + 밝은 텍스트 (어두운 칠판 배경용)
- **미니멀**: 배지 없이 번호만, 최소한의 장식

사용자의 칠판/배경 색상을 물어보고 가장 잘 어울리는 스타일을 제안한다.
