import { chromium } from '../node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const dir = 'e2e/screenshots/interactive';

async function snap(name) {
  await page.screenshot({ path: `${dir}/${name}.png` });
  console.log(`  -> ${name}.png`);
}

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(12000);

// Start from top
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);

// Press Tab once — focus should go to first focusable element (brand link)
await page.keyboard.press('Tab');
await page.waitForTimeout(300);

// Check what has focus
let focused = await page.evaluate(() => {
  const el = document.activeElement;
  return el ? { tag: el.tagName, class: el.className?.substring(0, 60), text: el.textContent?.substring(0, 40) } : null;
});
console.log('Tab 1 focus:', focused);
await snap('81-focus-tab1');

// Tab to nav link
await page.keyboard.press('Tab');
await page.waitForTimeout(300);
focused = await page.evaluate(() => {
  const el = document.activeElement;
  return el ? { tag: el.tagName, class: el.className?.substring(0, 60), text: el.textContent?.substring(0, 40) } : null;
});
console.log('Tab 2 focus:', focused);

// Clip nav area to see focus ring
await page.screenshot({
  path: `${dir}/82-focus-nav-link.png`,
  clip: { x: 0, y: 0, width: 1280, height: 80 }
});
console.log('  -> 82-focus-nav-link.png');

// Tab through remaining nav links
for (let i = 0; i < 7; i++) {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
}
focused = await page.evaluate(() => {
  const el = document.activeElement;
  return el ? { tag: el.tagName, class: el.className?.substring(0, 60), text: el.textContent?.substring(0, 40) } : null;
});
console.log('Tab 9 focus:', focused);
await page.screenshot({
  path: `${dir}/83-focus-last-nav-link.png`,
  clip: { x: 0, y: 0, width: 1280, height: 80 }
});
console.log('  -> 83-focus-last-nav-link.png');

// Tab into page content — first focusable should be a table link
await page.keyboard.press('Tab');
await page.waitForTimeout(300);
focused = await page.evaluate(() => {
  const el = document.activeElement;
  return el ? { tag: el.tagName, class: el.className?.substring(0, 80), text: el.textContent?.substring(0, 50), href: el.getAttribute('href') } : null;
});
console.log('Tab 10 (first content focus):', focused);
await snap('84-focus-first-content');

// Check focus visibility — is there a visible focus ring?
const focusRingStyle = await page.evaluate(() => {
  const el = document.activeElement;
  if (!el) return null;
  const style = window.getComputedStyle(el);
  return {
    outline: style.outline,
    outlineColor: style.outlineColor,
    outlineWidth: style.outlineWidth,
    outlineStyle: style.outlineStyle,
    outlineOffset: style.outlineOffset,
    boxShadow: style.boxShadow,
  };
});
console.log('Focus ring style:', focusRingStyle);

// Test Enter key on focused link
await page.keyboard.press('Enter');
await page.waitForTimeout(2000);
console.log('After Enter on focused link:', page.url());
await snap('85-after-enter-key-nav');

await browser.close();
console.log('\n=== Focus tests complete! ===');
