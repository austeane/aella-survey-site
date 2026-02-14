import { chromium } from '../node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const dir = 'e2e/screenshots/interactive';

// Helper to screenshot with a descriptive name
async function snap(name) {
  await page.screenshot({ path: `${dir}/${name}.png` });
  console.log(`  -> ${name}.png`);
}

async function snapFull(name) {
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
  console.log(`  -> ${name}.png (full)`);
}

// ============================================
// PHASE 1: LOADING STATE
// ============================================
console.log('\n=== PHASE 1: Loading State ===');
await page.goto('http://localhost:3000/', { waitUntil: 'commit' });
await page.waitForTimeout(500);
await snap('01-loading-skeleton');

await page.waitForTimeout(3000);
await snap('02-loading-mid');

await page.waitForTimeout(8000);
await snap('03-loaded-final');

// ============================================
// PHASE 2: NAV BAR INTERACTIONS
// ============================================
console.log('\n=== PHASE 2: Nav Bar ===');

// Hover each nav link
const navLinks = page.locator('.nav-link');
const navCount = await navLinks.count();
console.log(`Found ${navCount} nav links`);

for (let i = 0; i < navCount; i++) {
  const link = navLinks.nth(i);
  const text = await link.textContent();
  await link.hover();
  await page.waitForTimeout(200);
  await snap(`04-nav-hover-${text.trim().toLowerCase()}`);
}

// Verify active state (Dashboard should be active)
await snap('05-nav-active-state');

// Click About nav link, verify navigation
await navLinks.filter({ hasText: 'About' }).click();
await page.waitForTimeout(1000);
await snap('06-nav-click-about');

// Click back to Dashboard
await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(10000);
await snap('07-back-to-dashboard');

// ============================================
// PHASE 3: STAT CARDS
// ============================================
console.log('\n=== PHASE 3: Stat Cards ===');
const statGrid = page.locator('.stat-grid').first();
await statGrid.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);

// Clip stat cards area
const statBox = await statGrid.boundingBox();
if (statBox) {
  await page.screenshot({
    path: `${dir}/08-stat-cards-detail.png`,
    clip: { x: statBox.x - 10, y: statBox.y - 10, width: statBox.width + 20, height: statBox.height + 20 }
  });
  console.log('  -> 08-stat-cards-detail.png');
}

// ============================================
// PHASE 4: SECTION HEADERS
// ============================================
console.log('\n=== PHASE 4: Section Headers ===');
const sectionHeaders = page.locator('.section-header');
const headerCount = await sectionHeaders.count();
console.log(`Found ${headerCount} section headers`);

for (let i = 0; i < headerCount; i++) {
  const header = sectionHeaders.nth(i);
  await header.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const text = await header.textContent();
  const box = await header.boundingBox();
  if (box) {
    await page.screenshot({
      path: `${dir}/09-section-header-${i}.png`,
      clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 10), width: Math.min(1280, box.width + 40), height: box.height + 20 }
    });
    console.log(`  -> 09-section-header-${i}.png (${text.trim().substring(0, 40)})`);
  }
}

// ============================================
// PHASE 5: DATA TABLES — HOVER ROWS + CLICK LINKS
// ============================================
console.log('\n=== PHASE 5: Data Tables ===');

// Find clickable column links in tables
const tableLinks = page.locator('.editorial-table a');
const tableLinkCount = await tableLinks.count();
console.log(`Found ${tableLinkCount} table links`);

// Hover first few table rows
const tableRows = page.locator('.editorial-table tbody tr');
const rowCount = await tableRows.count();
console.log(`Found ${rowCount} table rows total`);

if (rowCount > 0) {
  // Hover first row
  const firstRow = tableRows.first();
  await firstRow.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await firstRow.hover();
  await page.waitForTimeout(200);
  await snap('10-table-row-hover');
}

// Click a column link in the Analysis-Friendly table
const analysisFriendlyLinks = page.locator('text=Most Analysis-Friendly').locator('..').locator('..').locator('a');
const afLinkCount = await analysisFriendlyLinks.count();
console.log(`Analysis-Friendly links: ${afLinkCount}`);

// Try clicking a table link (e.g., "Biomale")
const biomaleLink = page.locator('a:has-text("Biomale")').first();
if (await biomaleLink.count() > 0) {
  await biomaleLink.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  // Before click
  await snap('11-before-click-biomale');

  // Hover
  await biomaleLink.hover();
  await page.waitForTimeout(200);
  await snap('12-hover-biomale-link');

  // Click
  await biomaleLink.click();
  await page.waitForTimeout(2000);
  await snap('13-after-click-biomale');

  // Go back
  await page.goBack();
  await page.waitForTimeout(10000);
}

// ============================================
// PHASE 6: COLUMN INSPECTOR — COMBOBOX INTERACTION
// ============================================
console.log('\n=== PHASE 6: Column Inspector ===');

// Scroll to Column Inspector
const inspectorSection = page.locator('text=Column Inspector').first();
await inspectorSection.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await snap('14-column-inspector-before');

// Find the combobox/select trigger
const comboTrigger = page.locator('.raised-panel select, .raised-panel [role="combobox"], .raised-panel button[aria-expanded]').first();
const comboCount = await comboTrigger.count();
console.log(`Combobox triggers found: ${comboCount}`);

if (comboCount > 0) {
  await comboTrigger.scrollIntoViewIfNeeded();
  await comboTrigger.click();
  await page.waitForTimeout(500);
  await snap('15-combobox-open');

  // Try selecting a different option
  // Look for an option or listbox item
  const options = page.locator('[role="option"], [role="listbox"] li, select option');
  const optCount = await options.count();
  console.log(`Options found: ${optCount}`);

  if (optCount > 2) {
    await options.nth(2).click();
    await page.waitForTimeout(1000);
    await snap('16-combobox-selected-new');
  }
} else {
  // Maybe it's a custom combobox component
  const customCombo = page.locator('[class*="combobox"], [class*="Combobox"]').first();
  if (await customCombo.count() > 0) {
    await customCombo.scrollIntoViewIfNeeded();
    await customCombo.click();
    await page.waitForTimeout(500);
    await snap('15-combobox-open');
  }
}

// Try using the ColumnCombobox — look for the input/button
const columnComboInput = page.locator('.raised-panel input[type="text"], .raised-panel input[placeholder]').first();
if (await columnComboInput.count() > 0) {
  console.log('Found combobox input');
  await columnComboInput.click();
  await page.waitForTimeout(500);
  await snap('15b-combobox-input-focus');

  // Type to search
  await columnComboInput.fill('age');
  await page.waitForTimeout(500);
  await snap('16b-combobox-search-age');

  // Clear and try another
  await columnComboInput.fill('gender');
  await page.waitForTimeout(500);
  await snap('17-combobox-search-gender');
}

// ============================================
// PHASE 7: KEYBOARD NAVIGATION
// ============================================
console.log('\n=== PHASE 7: Keyboard Navigation ===');

// Tab through the page from the top
await page.keyboard.press('Home');
await page.waitForTimeout(200);

// Tab through several elements
for (let i = 0; i < 12; i++) {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
}
await snap('18-tab-focus-state');

// Tab a few more times to get to different elements
for (let i = 0; i < 5; i++) {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(200);
}
await snap('19-tab-further');

// ============================================
// PHASE 8: RESPONSIVE — RESIZE TO 768px
// ============================================
console.log('\n=== PHASE 8: Responsive (768px) ===');
await page.setViewportSize({ width: 768, height: 900 });
await page.waitForTimeout(500);

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await snap('20-responsive-768-top');

await snapFull('21-responsive-768-full');

// Check nav wrapping
await page.screenshot({
  path: `${dir}/22-responsive-768-nav.png`,
  clip: { x: 0, y: 0, width: 768, height: 120 }
});
console.log('  -> 22-responsive-768-nav.png');

// Scroll to stat cards
await page.evaluate(() => window.scrollTo(0, 200));
await page.waitForTimeout(300);
await snap('23-responsive-768-stats');

// Scroll to tables
await page.evaluate(() => window.scrollTo(0, 800));
await page.waitForTimeout(300);
await snap('24-responsive-768-tables');

// Scroll to column inspector
const inspectorResp = page.locator('text=Column Inspector').first();
await inspectorResp.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await snap('25-responsive-768-inspector');

// ============================================
// PHASE 9: RESPONSIVE — RESIZE TO 480px (mobile)
// ============================================
console.log('\n=== PHASE 9: Responsive (480px) ===');
await page.setViewportSize({ width: 480, height: 900 });
await page.waitForTimeout(500);

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await snap('26-responsive-480-top');

await snapFull('27-responsive-480-full');

// Reset viewport
await page.setViewportSize({ width: 1280, height: 900 });
await page.waitForTimeout(500);

await browser.close();
console.log('\n=== Dashboard interactive tests complete! ===');
