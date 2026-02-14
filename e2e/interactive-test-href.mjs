import { chromium } from '../node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// Check the actual href attributes on the links
const links = await page.evaluate(() => {
  const allLinks = document.querySelectorAll('a');
  return Array.from(allLinks).map(a => ({
    text: a.textContent?.trim().substring(0, 60),
    href: a.href,
    dataDest: a.getAttribute('data-dest'),
  })).filter(l => l.href.includes('/explore') || l.href.includes('/relationships') || l.href.includes('/columns') || l.href.includes('/sql') || l.href.includes('/notebook') || l.href.includes('/profile'));
});

console.log('Internal link hrefs:');
for (const link of links) {
  console.log(`  "${link.text}" -> ${link.href}`);
}

await context.close();
await browser.close();
