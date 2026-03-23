/**
 * Math Broadcast Generator — Renderer
 *
 * HTML 파일을 Playwright로 열어 투명 배경 PNG로 캡처합니다.
 *
 * Usage:
 *   node render.js <input.html> <output.png> [--width=1200] [--scale=2]
 */

const { chromium } = require('playwright');
const path = require('path');

async function render(htmlPath, outputPath, options = {}) {
  const width = options.width || 1200;
  const scale = options.scale || 2; // 고해상도 (2x = Retina급)

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height: 800 },
    deviceScaleFactor: scale,
  });
  const page = await context.newPage();

  // HTML 로드 — 네트워크 리소스(KaTeX, 폰트) 로딩 대기
  const absolutePath = path.resolve(htmlPath);
  await page.goto(`file://${absolutePath}`, { waitUntil: 'networkidle' });

  // KaTeX 렌더링 + 폰트 로딩 완료 대기
  await page.waitForTimeout(3000);

  // .problem-container 영역만 캡처
  const container = await page.$('.problem-container');
  if (!container) {
    console.error('Error: .problem-container not found in HTML');
    await browser.close();
    process.exit(1);
  }

  await container.screenshot({
    path: path.resolve(outputPath),
    omitBackground: true, // 투명 배경
  });

  console.log(`Rendered: ${outputPath} (${width}px × ${scale}x scale)`);
  await browser.close();
}

// CLI 실행
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node render.js <input.html> <output.png> [--width=1200] [--scale=2]');
  process.exit(1);
}

const htmlPath = args[0];
const outputPath = args[1];
const options = {};

args.slice(2).forEach(arg => {
  const [key, val] = arg.replace('--', '').split('=');
  options[key] = parseInt(val, 10);
});

render(htmlPath, outputPath, options).catch(err => {
  console.error('Render failed:', err);
  process.exit(1);
});
