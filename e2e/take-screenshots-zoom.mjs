import { chromium } from '../node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// === DASHBOARD ZOOMS ===
console.log('Loading dashboard...');
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(12000);

// Zoom 1: Stat cards row
const statsRow = await page.locator('text=15,503').first().boundingBox();
if (statsRow) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-stat-cards.png',
    clip: { x: 0, y: Math.max(0, statsRow.y - 30), width: 1280, height: 120 }
  });
  console.log('Saved zoom-stat-cards.png');
}

// Zoom 2: Section headers - Global Caveats
const caveatsHeader = await page.locator('text=Global Caveats').first().boundingBox();
if (caveatsHeader) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-section-header-caveats.png',
    clip: { x: 0, y: Math.max(0, caveatsHeader.y - 10), width: 700, height: 50 }
  });
  console.log('Saved zoom-section-header-caveats.png');
}

// Zoom 3: Highest Missingness table top
const missingnessHeader = await page.locator('text=Highest Missingness').first().boundingBox();
if (missingnessHeader) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-missingness-table.png',
    clip: { x: missingnessHeader.x - 20, y: Math.max(0, missingnessHeader.y - 10), width: 650, height: 300 }
  });
  console.log('Saved zoom-missingness-table.png');
}

// Zoom 4: Tag Breakdown table
await page.evaluate(() => window.scrollTo(0, 1200));
await page.waitForTimeout(500);
const tagHeader = await page.locator('text=Tag Breakdown').first().boundingBox();
if (tagHeader) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-tag-breakdown.png',
    clip: { x: 0, y: Math.max(0, tagHeader.y - 10), width: 650, height: 300 }
  });
  console.log('Saved zoom-tag-breakdown.png');
}

// Zoom 5: Column Inspector section
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 900));
await page.waitForTimeout(500);
const inspectorHeader = await page.locator('text=Column Inspector').first().boundingBox();
if (inspectorHeader) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-column-inspector.png',
    clip: { x: 0, y: Math.max(0, inspectorHeader.y - 20), width: 1280, height: 500 }
  });
  console.log('Saved zoom-column-inspector.png');
}

// Zoom 6: Most Analysis-Friendly table
await page.evaluate(() => window.scrollTo(0, 1600));
await page.waitForTimeout(500);
const analysisHeader = await page.locator('text=Most Analysis-Friendly').first().boundingBox();
if (analysisHeader) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-analysis-friendly.png',
    clip: { x: 0, y: Math.max(0, analysisHeader.y - 10), width: 650, height: 350 }
  });
  console.log('Saved zoom-analysis-friendly.png');
}

// Zoom 7: Most Gated Columns table
const gatedHeader = await page.locator('text=Most Gated').first().boundingBox();
if (gatedHeader) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-gated-columns.png',
    clip: { x: gatedHeader.x - 20, y: Math.max(0, gatedHeader.y - 10), width: 650, height: 350 }
  });
  console.log('Saved zoom-gated-columns.png');
}

// === ABOUT PAGE ZOOMS ===
console.log('Loading about...');
await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

// Zoom 8: About title + subtitle
await page.screenshot({
  path: 'e2e/screenshots/zoom-about-title.png',
  clip: { x: 0, y: 60, width: 1280, height: 150 }
});
console.log('Saved zoom-about-title.png');

// Zoom 9: Try This section
const tryThis = await page.locator('text=Try This').first().boundingBox();
if (tryThis) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-about-trythis.png',
    clip: { x: 0, y: Math.max(0, tryThis.y - 20), width: 1000, height: 250 }
  });
  console.log('Saved zoom-about-trythis.png');
}

// Zoom 10: Caveats section
const caveats = await page.locator('text=Caveats & Interpretation').first().boundingBox();
if (caveats) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-about-caveats.png',
    clip: { x: 0, y: Math.max(0, caveats.y - 20), width: 1000, height: 300 }
  });
  console.log('Saved zoom-about-caveats.png');
}

// Zoom 11: Credits & Links section
const credits = await page.locator('text=Credits & Links').first().boundingBox();
if (credits) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-about-credits.png',
    clip: { x: 0, y: Math.max(0, credits.y - 20), width: 1000, height: 200 }
  });
  console.log('Saved zoom-about-credits.png');
}

// Zoom 12: For AI Agents section
const forAI = await page.locator('text=For AI Agents').first().boundingBox();
if (forAI) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-about-ai-agents.png',
    clip: { x: 0, y: Math.max(0, forAI.y - 20), width: 1000, height: 400 }
  });
  console.log('Saved zoom-about-ai-agents.png');
}

// Zoom 13: Dataset We Work With section
const dataset = await page.locator('text=The Dataset We Work With').first().boundingBox();
if (dataset) {
  await page.screenshot({
    path: 'e2e/screenshots/zoom-about-dataset.png',
    clip: { x: 0, y: Math.max(0, dataset.y - 20), width: 1000, height: 200 }
  });
  console.log('Saved zoom-about-dataset.png');
}

await browser.close();
console.log('All zoom screenshots captured!');
