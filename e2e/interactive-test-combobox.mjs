import { chromium } from '../node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const dir = 'e2e/screenshots/interactive';

async function snap(name) {
  await page.screenshot({ path: `${dir}/${name}.png` });
  console.log(`  -> ${name}.png`);
}

// Load dashboard, wait for data
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(12000);

// Scroll to Column Inspector
const inspector = page.locator('text=Column Inspector').first();
await inspector.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);

// Find what elements are in the raised-panel
const raisedPanel = page.locator('.raised-panel').first();
const html = await raisedPanel.innerHTML();
console.log('Raised panel HTML (first 500 chars):', html.substring(0, 500));

// Look for any interactive elements
const buttons = await raisedPanel.locator('button').count();
const inputs = await raisedPanel.locator('input').count();
const selects = await raisedPanel.locator('select').count();
const combos = await raisedPanel.locator('[role="combobox"]').count();
console.log(`Buttons: ${buttons}, Inputs: ${inputs}, Selects: ${selects}, Comboboxes: ${combos}`);

// Try to find the ColumnCombobox by looking for any clickable element
const allClickable = raisedPanel.locator('button, input, select, [role="combobox"], [role="listbox"]');
const clickableCount = await allClickable.count();
console.log(`Total clickable: ${clickableCount}`);

for (let i = 0; i < clickableCount; i++) {
  const el = allClickable.nth(i);
  const tag = await el.evaluate(e => e.tagName);
  const cls = await el.evaluate(e => e.className);
  const role = await el.evaluate(e => e.getAttribute('role'));
  const text = await el.textContent();
  console.log(`  [${i}] <${tag}> role=${role} class=${cls.substring(0,80)} text=${text.substring(0,40)}`);
}

// Before interaction
await snap('28-inspector-before-interact');

// Click the first button/control in the raised panel
if (clickableCount > 0) {
  const firstControl = allClickable.first();
  await firstControl.click();
  await page.waitForTimeout(500);
  await snap('29-inspector-after-click');

  // Check for open dropdown / popover
  const popover = page.locator('[role="listbox"], [data-state="open"], [role="dialog"]');
  const popCount = await popover.count();
  console.log(`Popovers open: ${popCount}`);

  if (popCount > 0) {
    await snap('30-inspector-dropdown-open');

    // Try typing to filter
    await page.keyboard.type('age');
    await page.waitForTimeout(500);
    await snap('31-inspector-search-age');

    // Clear search
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(300);

    // Type different search
    await page.keyboard.type('gender');
    await page.waitForTimeout(500);
    await snap('32-inspector-search-gender');

    // Select an item via keyboard
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    await snap('33-inspector-selected-gender');

    // Escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // Open it again and select a different column
  await firstControl.click();
  await page.waitForTimeout(500);
  await snap('34-inspector-reopen');

  // Type to search for "bmi"
  await page.keyboard.type('bmi');
  await page.waitForTimeout(500);
  await snap('35-inspector-search-bmi');

  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await snap('36-inspector-selected-bmi');
}

// Now test the inspector with a numeric column
// Re-open and select "age"
if (clickableCount > 0) {
  const firstControl = allClickable.first();
  await firstControl.click();
  await page.waitForTimeout(500);
  await page.keyboard.type('age');
  await page.waitForTimeout(500);
  await snap('37-inspector-search-age-numeric');

  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await snap('38-inspector-selected-age');
}

await browser.close();
console.log('\n=== Combobox interactive tests complete! ===');
