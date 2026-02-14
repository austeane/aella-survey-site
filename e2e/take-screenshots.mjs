import { chromium } from '../node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// === DASHBOARD ===
console.log('Loading dashboard...');
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(12000);

await page.screenshot({ path: 'e2e/screenshots/dashboard-full.png', fullPage: true });
console.log('Saved dashboard-full.png');

await page.screenshot({ path: 'e2e/screenshots/dashboard-nav.png', clip: { x: 0, y: 0, width: 1280, height: 80 } });
console.log('Saved dashboard-nav.png');

await page.screenshot({ path: 'e2e/screenshots/dashboard-stats.png', clip: { x: 0, y: 0, width: 1280, height: 350 } });
console.log('Saved dashboard-stats.png');

await page.evaluate(() => window.scrollTo(0, 400));
await page.waitForTimeout(500);
await page.screenshot({ path: 'e2e/screenshots/dashboard-sections-top.png' });
console.log('Saved dashboard-sections-top.png');

await page.evaluate(() => window.scrollTo(0, 1000));
await page.waitForTimeout(500);
await page.screenshot({ path: 'e2e/screenshots/dashboard-sections-mid.png' });
console.log('Saved dashboard-sections-mid.png');

await page.evaluate(() => window.scrollTo(0, 1800));
await page.waitForTimeout(500);
await page.screenshot({ path: 'e2e/screenshots/dashboard-sections-lower.png' });
console.log('Saved dashboard-sections-lower.png');

await page.evaluate(() => window.scrollTo(0, 2600));
await page.waitForTimeout(500);
await page.screenshot({ path: 'e2e/screenshots/dashboard-column-inspector.png' });
console.log('Saved dashboard-column-inspector.png');

await page.evaluate(() => window.scrollTo(0, 3400));
await page.waitForTimeout(500);
await page.screenshot({ path: 'e2e/screenshots/dashboard-bottom1.png' });
console.log('Saved dashboard-bottom1.png');

await page.evaluate(() => window.scrollTo(0, 4200));
await page.waitForTimeout(500);
await page.screenshot({ path: 'e2e/screenshots/dashboard-bottom2.png' });
console.log('Saved dashboard-bottom2.png');

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(500);
await page.screenshot({ path: 'e2e/screenshots/dashboard-footer.png' });
console.log('Saved dashboard-footer.png');

// === ABOUT PAGE ===
console.log('Loading about page...');
await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

await page.screenshot({ path: 'e2e/screenshots/about-full.png', fullPage: true });
console.log('Saved about-full.png');

await page.screenshot({ path: 'e2e/screenshots/about-top.png', clip: { x: 0, y: 0, width: 1280, height: 900 } });
console.log('Saved about-top.png');

await page.evaluate(() => window.scrollTo(0, 600));
await page.waitForTimeout(500);
await page.screenshot({ path: 'e2e/screenshots/about-mid.png' });
console.log('Saved about-mid.png');

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(500);
await page.screenshot({ path: 'e2e/screenshots/about-bottom.png' });
console.log('Saved about-bottom.png');

await browser.close();
console.log('All screenshots captured!');
