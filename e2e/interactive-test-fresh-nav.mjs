import { chromium } from '../node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const dir = 'e2e/screenshots/interactive';

// Use a completely fresh context
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

console.log('=== Fresh context: Testing About page links ===');
await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Test 1: "Explore orientation vs politics"
const link1 = page.locator('a:has-text("Explore orientation vs politics")').first();
await link1.scrollIntoViewIfNeeded();
await link1.click();
await page.waitForTimeout(2000);
console.log(`1. "Explore orientation vs politics" -> ${page.url()}`);

// Go back and test #2
await page.goBack();
await page.waitForTimeout(1000);

const link2 = page.locator('a:has-text("Compare gender and relationship style")').first();
await link2.scrollIntoViewIfNeeded();
await link2.click();
await page.waitForTimeout(2000);
console.log(`2. "Compare gender and relationship style" -> ${page.url()}`);

// Now a COMPLETELY fresh context to test link #2 without any prior navigation
await context.close();
const context2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page2 = await context2.newPage();
await page2.goto('http://localhost:3000/about', { waitUntil: 'networkidle' });
await page2.waitForTimeout(2000);

const link2b = page2.locator('a:has-text("Compare gender and relationship style")').first();
await link2b.scrollIntoViewIfNeeded();
await link2b.click();
await page2.waitForTimeout(2000);
console.log(`3. Fresh context: "Compare gender" -> ${page2.url()}`);

// Test Explore link from "What This Explorer Does"
await page2.goBack();
await page2.waitForTimeout(1000);
const exploreLink = page2.locator('section a:has-text("Explore")').first();
await exploreLink.scrollIntoViewIfNeeded();
await exploreLink.click();
await page2.waitForTimeout(2000);
console.log(`4. "Explore" general link -> ${page2.url()}`);

await context2.close();
await browser.close();
console.log('\n=== Fresh nav tests complete! ===');
