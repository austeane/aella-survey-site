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

// Scroll to Column Inspector
const inspector = page.locator('text=Column Inspector').first();
await inspector.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await snap('45-inspector-before-open');

// Click the select trigger
const trigger = page.locator('.raised-panel button').first();
await trigger.click();
await page.waitForTimeout(800);

// Now the dropdown should be open with the z-50 div
await snap('46-inspector-dropdown-open');

// Find the search input inside the dropdown
const searchInput = page.locator('.raised-panel .z-50 input, .raised-panel input[placeholder="Search columns..."]').first();
const inputCount = await searchInput.count();
console.log(`Search input found: ${inputCount}`);

if (inputCount > 0) {
  // Type to search
  await searchInput.fill('age');
  await page.waitForTimeout(500);
  await snap('47-inspector-search-age');

  // Clear and search for gender
  await searchInput.fill('gender');
  await page.waitForTimeout(500);
  await snap('48-inspector-search-gender');

  // Select "Gender" by clicking the option
  const genderBtn = page.locator('.raised-panel .z-50 button:has-text("Gender")').first();
  if (await genderBtn.count() > 0) {
    await genderBtn.click();
    await page.waitForTimeout(2000);
    await snap('49-inspector-selected-gender');
  }

  // Re-open and check the distribution changed
  await trigger.click();
  await page.waitForTimeout(800);
  await snap('50-inspector-reopened');

  // Search for "bmi" (a numeric column)
  const searchInput2 = page.locator('.raised-panel input[placeholder="Search columns..."]').first();
  if (await searchInput2.count() > 0) {
    await searchInput2.fill('bmi');
    await page.waitForTimeout(500);
    await snap('51-inspector-search-bmi');

    // Use keyboard to select
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await snap('52-inspector-arrow-down-highlight');

    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    await snap('53-inspector-selected-bmi-numeric');
  }

  // Re-open and test with empty search
  await trigger.click();
  await page.waitForTimeout(800);
  await snap('54-inspector-full-list');

  // Search for something that doesn't exist
  const searchInput3 = page.locator('.raised-panel input[placeholder="Search columns..."]').first();
  if (await searchInput3.count() > 0) {
    await searchInput3.fill('zzzznothing');
    await page.waitForTimeout(500);
    await snap('55-inspector-no-results');
  }

  // Close with Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await snap('56-inspector-closed-escape');
}

// Test clicking outside to close
await trigger.click();
await page.waitForTimeout(800);
await snap('57-inspector-reopen-for-outside-click');

// Click outside the dropdown
await page.mouse.click(50, 50);
await page.waitForTimeout(500);
await snap('58-inspector-closed-outside-click');

await browser.close();
console.log('\n=== Combobox interactive tests complete! ===');
