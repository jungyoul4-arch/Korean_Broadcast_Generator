/**
 * Playwright 렌더러 — HTML → 투명 PNG 병렬 변환
 */
import { chromium, type Browser } from "playwright";
import path from "path";
import fs from "fs/promises";
import os from "os";

const RENDER_TIMEOUT = 5000; // KaTeX + 폰트 로딩 대기
const MAX_CONCURRENT = 4; // 동시 브라우저 페이지 수

export interface RenderResult {
  number: number;
  pngBuffer: Buffer;
  width: number;
  height: number;
}

/**
 * 단일 HTML을 투명 PNG로 렌더링
 */
async function renderSingle(
  browser: Browser,
  html: string,
  number: number
): Promise<RenderResult> {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  try {
    // 임시 파일에 HTML 저장
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "math-"));
    const htmlPath = path.join(tmpDir, `prob${number}.html`);
    await fs.writeFile(htmlPath, html, "utf-8");

    // HTML 로드
    await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(RENDER_TIMEOUT);

    // .problem-container 영역만 캡처
    const container = await page.$(".problem-container");
    if (!container) {
      throw new Error(`문제 ${number}: .problem-container를 찾을 수 없습니다`);
    }

    const box = await container.boundingBox();
    const pngBuffer = (await container.screenshot({
      omitBackground: true,
    })) as Buffer;

    // 임시 파일 정리
    await fs.rm(tmpDir, { recursive: true, force: true });

    return {
      number,
      pngBuffer,
      width: box ? Math.round(box.width * 2) : 2400,
      height: box ? Math.round(box.height * 2) : 1600,
    };
  } finally {
    await context.close();
  }
}

/**
 * 여러 HTML을 병렬로 투명 PNG 렌더링
 * 동시에 MAX_CONCURRENT개까지만 처리
 */
export async function renderMultiple(
  items: Array<{ html: string; number: number }>
): Promise<RenderResult[]> {
  const browser = await chromium.launch();

  try {
    const results: RenderResult[] = [];

    // 청크 단위로 병렬 실행
    for (let i = 0; i < items.length; i += MAX_CONCURRENT) {
      const chunk = items.slice(i, i + MAX_CONCURRENT);
      const chunkResults = await Promise.all(
        chunk.map((item) => renderSingle(browser, item.html, item.number))
      );
      results.push(...chunkResults);
    }

    return results.sort((a, b) => a.number - b.number);
  } finally {
    await browser.close();
  }
}

/**
 * 단일 HTML 렌더링 (미리보기용 — 초록 배경)
 */
export async function renderPreview(html: string): Promise<Buffer> {
  const browser = await chromium.launch();

  try {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "math-preview-"));
    const htmlPath = path.join(tmpDir, "preview.html");
    await fs.writeFile(htmlPath, html, "utf-8");

    await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(RENDER_TIMEOUT);

    // 초록 배경으로 미리보기
    await page.evaluate(() => {
      document.body.style.background = "#0d3b2e";
    });

    const container = await page.$(".problem-container");
    if (!container) throw new Error(".problem-container를 찾을 수 없습니다");

    const pngBuffer = (await container.screenshot({
      omitBackground: false,
    })) as Buffer;

    await fs.rm(tmpDir, { recursive: true, force: true });
    await context.close();

    return pngBuffer;
  } finally {
    await browser.close();
  }
}
