import { chromium } from '../node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const dir = 'e2e/screenshots/interactive';

// Test: Fresh navigation from About page links
// Start fresh — go directly to About
console.log('=== Testing About page link URLs ===');
await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Click "Explore orientation vs politics"
const link1 = page.locator('a:has-text("Explore orientation vs politics")').first();
await link1.scrollIntoViewIfNeeded();
await link1.click();
await page.waitForTimeout(2000);
const url1 = page.url();
console.log(`"Explore orientation vs politics" -> ${url1}`);

// Go back
await page.goBack();
await page.waitForTimeout(1000);

// Click "Compare gender and relationship style"
const link2 = page.locator('a:has-text("Compare gender and relationship style")').first();
await link2.scrollIntoViewIfNeeded();
await link2.click();
await page.waitForTimeout(2000);
const url2 = page.url();
console.log(`"Compare gender and relationship style" -> ${url2}`);

// Go back
await page.goBack();
await page.waitForTimeout(1000);

// Click "Jump to strongest associations for straightness"
const link3 = page.locator('a:has-text("Jump to strongest associations")').first();
await link3.scrollIntoViewIfNeeded();
await link3.click();
await page.waitForTimeout(2000);
const url3 = page.url();
console.log(`"Jump to strongest associations" -> ${url3}`);

// Now test the page links section "What This Explorer Does"
await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Click Dashboard link
const dashLink = page.locator('section a:has-text("Dashboard")').first();
await dashLink.scrollIntoViewIfNeeded();
await dashLink.click();
await page.waitForTimeout(2000);
console.log(`Dashboard link -> ${page.url()}`);

await page.goBack();
await page.waitForTimeout(1000);

// Click Explore link
const exploreLink = page.locator('section a:has-text("Explore")').first();
await exploreLink.scrollIntoViewIfNeeded();
await exploreLink.click();
await page.waitForTimeout(2000);
console.log(`Explore link -> ${page.url()}`);

await page.goBack();
await page.waitForTimeout(1000);

// Click Columns link
const colLink = page.locator('section a:has-text("Columns")').first();
await colLink.scrollIntoViewIfNeeded();
await colLink.click();
await page.waitForTimeout(2000);
console.log(`Columns link -> ${page.url()}`);

await page.goBack();
await page.waitForTimeout(1000);

// Click SQL Console link
const sqlLink = page.locator('section a:has-text("SQL Console")').first();
await sqlLink.scrollIntoViewIfNeeded();
await sqlLink.click();
await page.waitForTimeout(2000);
console.log(`SQL Console link -> ${page.url()}`);

await page.goBack();
await page.waitForTimeout(1000);

// Click Notebook link
const nbLink = page.locator('section a:has-text("Notebook")').first();
await nbLink.scrollIntoViewIfNeeded();
await nbLink.click();
await page.waitForTimeout(2000);
console.log(`Notebook link -> ${page.url()}`);

// Test external links don't navigate away (target=_blank)
await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

// Click /llms.txt (this is a relative link, not external)
const llmsLink = page.locator('a:has-text("/llms.txt")').first();
await llmsLink.scrollIntoViewIfNeeded();
await llmsLink.click();
await page.waitForTimeout(2000);
console.log(`/llms.txt -> ${page.url()}`);
await page.screenshot({ path: `${dir}/80-llmstxt-page.png` });
console.log('  -> 80-llmstxt-page.png');

await browser.close();
console.log('\n=== Navigation URL tests complete! ===');
