import { chromium } from '../node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// === ABOUT PAGE ZOOMS (scroll to each section first) ===
console.log('Loading about...');
await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

// Try This section
const tryThis = page.locator('text=Try This').first();
await tryThis.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const tryThisBox = await tryThis.boundingBox();
if (tryThisBox) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-about-trythis.png',
    clip: { x: 0, y: Math.max(0, tryThisBox.y - 20), width: 1000, height: 250 }
  });
  console.log('Saved zoom-about-trythis.png');
}

// Caveats section
const caveats = page.locator('text=Caveats & Interpretation').first();
await caveats.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const caveatsBox = await caveats.boundingBox();
if (caveatsBox) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-about-caveats.png',
    clip: { x: 0, y: Math.max(0, caveatsBox.y - 20), width: 1000, height: 300 }
  });
  console.log('Saved zoom-about-caveats.png');
}

// Credits & Links section
const credits = page.locator('text=Credits & Links').first();
await credits.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const creditsBox = await credits.boundingBox();
if (creditsBox) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-about-credits.png',
    clip: { x: 0, y: Math.max(0, creditsBox.y - 20), width: 1000, height: 200 }
  });
  console.log('Saved zoom-about-credits.png');
}

// For AI Agents section
const forAI = page.locator('text=For AI Agents').first();
await forAI.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const forAIBox = await forAI.boundingBox();
if (forAIBox) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-about-ai-agents.png',
    clip: { x: 0, y: Math.max(0, forAIBox.y - 20), width: 1000, height: 400 }
  });
  console.log('Saved zoom-about-ai-agents.png');
}

// Dataset We Work With section
const dataset = page.locator('text=The Dataset We Work With').first();
await dataset.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const datasetBox = await dataset.boundingBox();
if (datasetBox) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-about-dataset.png',
    clip: { x: 0, y: Math.max(0, datasetBox.y - 20), width: 1000, height: 200 }
  });
  console.log('Saved zoom-about-dataset.png');
}

await browser.close();
console.log('All about zooms captured!');
