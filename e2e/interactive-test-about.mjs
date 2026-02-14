import { chromium } from '../node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const dir = 'e2e/screenshots/interactive';

async function snap(name) {
  await page.screenshot({ path: `${dir}/${name}.png` });
  console.log(`  -> ${name}.png`);
}

// ============================================
// ABOUT PAGE INTERACTIVE TESTS
// ============================================
console.log('\n=== About Page Interactive Tests ===');
await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
await snap('60-about-loaded');

// === LINK HOVER STATES ===
console.log('\n--- Link hover states ---');

// Hover Aella link
const aellaLink = page.locator('a:has-text("Aella")').first();
await aellaLink.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await snap('61-about-aella-before-hover');
await aellaLink.hover();
await page.waitForTimeout(300);
await snap('62-about-aella-hover');

// Hover Dashboard link in "What This Explorer Does"
const dashLink = page.locator('a:has-text("Dashboard")').first();
await dashLink.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await dashLink.hover();
await page.waitForTimeout(300);
await snap('63-about-dashboard-link-hover');

// === CLICK INTERNAL LINKS ===
console.log('\n--- Internal link navigation ---');

// Click "Explore orientation vs politics" in Try This
const tryThisLink = page.locator('a:has-text("Explore orientation vs politics")').first();
await tryThisLink.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await snap('64-about-trythis-before-click');

await tryThisLink.click();
await page.waitForTimeout(3000);
await snap('65-about-trythis-navigated-explore');

// Go back
await page.goBack();
await page.waitForTimeout(2000);
await snap('66-about-back-from-explore');

// Click "Compare gender and relationship style"
const genderLink = page.locator('a:has-text("Compare gender and relationship style")').first();
await genderLink.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await genderLink.click();
await page.waitForTimeout(3000);
await snap('67-about-navigated-gender-explore');

// Verify URL has search params
const url1 = page.url();
console.log(`Navigated to: ${url1}`);

await page.goBack();
await page.waitForTimeout(2000);

// Click "Jump to strongest associations for straightness"
const relLink = page.locator('a:has-text("Jump to strongest associations")').first();
await relLink.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await relLink.click();
await page.waitForTimeout(3000);
await snap('68-about-navigated-relationships');

const url2 = page.url();
console.log(`Navigated to: ${url2}`);

await page.goBack();
await page.waitForTimeout(2000);

// === EXTERNAL LINKS ===
console.log('\n--- External links ---');

// Check external links have proper attributes
const externalLinks = page.locator('a[target="_blank"]');
const extCount = await externalLinks.count();
console.log(`External links found: ${extCount}`);

for (let i = 0; i < extCount; i++) {
  const link = externalLinks.nth(i);
  const href = await link.getAttribute('href');
  const rel = await link.getAttribute('rel');
  const text = await link.textContent();
  console.log(`  [${i}] "${text.trim().substring(0,50)}" -> ${href?.substring(0,60)} rel=${rel}`);
}

// === DATASET STAT GRID (BUG AREA) ===
console.log('\n--- Dataset stat grid (known bug area) ---');
const statGrid = page.locator('.stat-grid').first();
await statGrid.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const sgBox = await statGrid.boundingBox();
if (sgBox) {
  await page.screenshot({
    path: `${dir}/69-about-stat-grid-detail.png`,
    clip: { x: Math.max(0, sgBox.x - 10), y: Math.max(0, sgBox.y - 10), width: sgBox.width + 20, height: sgBox.height + 20 }
  });
  console.log('  -> 69-about-stat-grid-detail.png');
}

// Check the computed styles of stat-value elements
const statValues = await page.evaluate(() => {
  const els = document.querySelectorAll('.stat-value');
  return Array.from(els).map(el => {
    const style = window.getComputedStyle(el);
    return {
      text: el.textContent,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
    };
  });
});
console.log('stat-value computed styles:', JSON.stringify(statValues, null, 2));

const statLabels = await page.evaluate(() => {
  const els = document.querySelectorAll('.stat-label');
  return Array.from(els).map(el => {
    const style = window.getComputedStyle(el);
    return {
      text: el.textContent,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      textTransform: style.textTransform,
      letterSpacing: style.letterSpacing,
    };
  });
});
console.log('stat-label computed styles:', JSON.stringify(statLabels, null, 2));

// === CODE BLOCKS ===
console.log('\n--- Code blocks ---');
const codeBlocks = page.locator('pre code');
const codeCount = await codeBlocks.count();
console.log(`Code blocks found: ${codeCount}`);

const firstCode = page.locator('pre').first();
await firstCode.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const codeBox = await firstCode.boundingBox();
if (codeBox) {
  await page.screenshot({
    path: `${dir}/70-about-code-block-detail.png`,
    clip: { x: Math.max(0, codeBox.x - 10), y: Math.max(0, codeBox.y - 10), width: Math.min(codeBox.width + 20, 800), height: codeBox.height + 20 }
  });
  console.log('  -> 70-about-code-block-detail.png');
}

// === /llms.txt LINK ===
console.log('\n--- llms.txt link ---');
const llmsLink = page.locator('a:has-text("/llms.txt")').first();
await llmsLink.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await llmsLink.hover();
await page.waitForTimeout(300);
await snap('71-about-llmstxt-hover');

// === KEYBOARD TAB THROUGH ===
console.log('\n--- Keyboard navigation ---');
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);

// Tab through first several focusable elements
for (let i = 0; i < 15; i++) {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
}
await snap('72-about-tab-focus');

// Tab a few more
for (let i = 0; i < 5; i++) {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
}
await snap('73-about-tab-focus-deeper');

// === RESPONSIVE 768px ===
console.log('\n--- Responsive 768px ---');
await page.setViewportSize({ width: 768, height: 900 });
await page.waitForTimeout(500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await snap('74-about-responsive-768-top');

await page.screenshot({ path: `${dir}/75-about-responsive-768-full.png`, fullPage: true });
console.log('  -> 75-about-responsive-768-full.png');

// Check stat grid at 768
const statGridResp = page.locator('.stat-grid').first();
await statGridResp.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await snap('76-about-responsive-768-statgrid');

// Check code blocks at 768
await firstCode.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await snap('77-about-responsive-768-codeblock');

// === RESPONSIVE 480px ===
console.log('\n--- Responsive 480px ---');
await page.setViewportSize({ width: 480, height: 900 });
await page.waitForTimeout(500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await snap('78-about-responsive-480-top');

await page.screenshot({ path: `${dir}/79-about-responsive-480-full.png`, fullPage: true });
console.log('  -> 79-about-responsive-480-full.png');

await browser.close();
console.log('\n=== About interactive tests complete! ===');
