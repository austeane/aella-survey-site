import { chromium } from 'playwright';
import { join } from 'path';

const SCREENSHOTS_DIR = join(import.meta.dirname, 'screenshots');
const BASE_URL = 'http://localhost:3000';

async function capture() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // ===== PROFILE PAGE =====
  console.log('--- Profile Page ---');

  // 1. Initial state (wait for DuckDB WASM to load)
  await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
  // Wait for DuckDB-WASM to initialize and schema to load (ColumnCombobox appears)
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'profile-01-initial.png'), fullPage: true });
  console.log('Captured: profile-01-initial.png');

  // 2. Click Compare Cohorts toggle
  const compareBtn = page.locator('button', { hasText: /compare cohorts/i });
  if (await compareBtn.count() > 0) {
    await compareBtn.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, 'profile-02-compare-mode.png'), fullPage: true });
    console.log('Captured: profile-02-compare-mode.png');
  }

  // Switch back to Single Cohort
  const singleBtn = page.locator('button', { hasText: /single cohort/i });
  if (await singleBtn.count() > 0) {
    await singleBtn.first().click();
    await page.waitForTimeout(500);
  }

  // 3. Interact with filter slots - click the combobox trigger to open dropdown
  // The ColumnCombobox uses a popover with search input
  const comboboxTriggers = page.locator('button[role="combobox"]');
  const triggerCount = await comboboxTriggers.count();
  console.log(`Found ${triggerCount} combobox triggers`);

  if (triggerCount > 0) {
    // Click first combobox to open it
    await comboboxTriggers.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, 'profile-03-combobox-open.png'), fullPage: true });
    console.log('Captured: profile-03-combobox-open.png');

    // Close it by pressing escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // 4. The default columns should already be pre-filled (demographic columns).
  // We need to pick values from the Select dropdowns.
  // Wait a bit for value options to load from DuckDB
  await page.waitForTimeout(2000);

  // Find all select triggers (for value selects)
  const selectTriggers = page.locator('button[role="combobox"]');
  const allTriggers = await selectTriggers.count();
  console.log(`Found ${allTriggers} total combobox/select triggers`);

  // Try to use the URL-based approach: navigate with pre-filled params
  // Let's navigate directly with search params to get results
  await page.goto(`${BASE_URL}/profile?c0=gender&v0=1&mode=single`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000); // Wait for DuckDB WASM + schema + value loading

  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'profile-04-with-selection.png'), fullPage: true });
  console.log('Captured: profile-04-with-selection.png');

  // Now click Build Profile
  const buildBtn = page.locator('button', { hasText: /build profile/i });
  if (await buildBtn.count() > 0) {
    const isDisabled = await buildBtn.first().isDisabled();
    console.log(`Build Profile button disabled: ${isDisabled}`);
    if (!isDisabled) {
      await buildBtn.first().click();
      // Wait for DuckDB query to complete
      await page.waitForTimeout(5000);
      await page.screenshot({ path: join(SCREENSHOTS_DIR, 'profile-05-results-top.png'), fullPage: true });
      console.log('Captured: profile-05-results-top.png');

      // Scroll down for stat cards and over-indexing table
      await page.evaluate(() => window.scrollTo(0, 600));
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(SCREENSHOTS_DIR, 'profile-06-results-stats.png'), fullPage: true });
      console.log('Captured: profile-06-results-stats.png');

      // Scroll down more for tables
      await page.evaluate(() => window.scrollTo(0, 1200));
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(SCREENSHOTS_DIR, 'profile-07-results-tables.png'), fullPage: true });
      console.log('Captured: profile-07-results-tables.png');

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(SCREENSHOTS_DIR, 'profile-08-results-bottom.png'), fullPage: true });
      console.log('Captured: profile-08-results-bottom.png');
    } else {
      console.log('Build Profile button is disabled - trying manual value selection...');
      // Try clicking the value select and picking an option
      // Find select triggers that have "Select value" placeholder
      const valueSelects = page.locator('button[role="combobox"]').filter({ hasText: /select value|none/i });
      const vsCount = await valueSelects.count();
      console.log(`Found ${vsCount} value select triggers`);
      if (vsCount > 0) {
        await valueSelects.first().click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: join(SCREENSHOTS_DIR, 'profile-04b-value-dropdown.png'), fullPage: true });
        console.log('Captured: profile-04b-value-dropdown.png');
        // Select second option (first is "None")
        const options = page.locator('[role="option"]');
        const optCount = await options.count();
        console.log(`Found ${optCount} options`);
        if (optCount > 1) {
          await options.nth(1).click();
          await page.waitForTimeout(500);
        }
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }

      // Try clicking Build again
      const buildBtn2 = page.locator('button', { hasText: /build profile/i });
      const isDisabled2 = await buildBtn2.first().isDisabled();
      console.log(`Build Profile button disabled after manual selection: ${isDisabled2}`);
      if (!isDisabled2) {
        await buildBtn2.first().click();
        await page.waitForTimeout(5000);
        await page.screenshot({ path: join(SCREENSHOTS_DIR, 'profile-05-results-top.png'), fullPage: true });
        console.log('Captured: profile-05-results-top.png');

        await page.evaluate(() => window.scrollTo(0, 600));
        await page.waitForTimeout(500);
        await page.screenshot({ path: join(SCREENSHOTS_DIR, 'profile-06-results-stats.png'), fullPage: true });
        console.log('Captured: profile-06-results-stats.png');

        await page.evaluate(() => window.scrollTo(0, 1200));
        await page.waitForTimeout(500);
        await page.screenshot({ path: join(SCREENSHOTS_DIR, 'profile-07-results-tables.png'), fullPage: true });
        console.log('Captured: profile-07-results-tables.png');

        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);
        await page.screenshot({ path: join(SCREENSHOTS_DIR, 'profile-08-results-bottom.png'), fullPage: true });
        console.log('Captured: profile-08-results-bottom.png');
      }
    }
  }

  // 5. Compare mode with URL params
  await page.goto(`${BASE_URL}/profile?mode=compare`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'profile-09-compare-empty.png'), fullPage: true });
  console.log('Captured: profile-09-compare-empty.png');


  // ===== RELATIONSHIPS PAGE =====
  console.log('\n--- Relationships Page ---');

  // 1. Initial state (relationships use pre-computed JSON, so loads fast)
  await page.goto(`${BASE_URL}/relationships`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'relationships-01-initial.png'), fullPage: true });
  console.log('Captured: relationships-01-initial.png');

  // 2. The page should auto-select the first column and show results.
  // Let's also open the combobox
  const relCombobox = page.locator('button[role="combobox"]').first();
  if (await relCombobox.count() > 0) {
    await relCombobox.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(SCREENSHOTS_DIR, 'relationships-02-combobox-open.png'), fullPage: true });
    console.log('Captured: relationships-02-combobox-open.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // 3. Navigate with a specific column to show results
  await page.goto(`${BASE_URL}/relationships?column=gender`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'relationships-03-results-gender.png'), fullPage: true });
  console.log('Captured: relationships-03-results-gender.png');

  // Scroll down for more results
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'relationships-04-results-scrolled.png'), fullPage: true });
  console.log('Captured: relationships-04-results-scrolled.png');

  // Try another column
  await page.goto(`${BASE_URL}/relationships?column=totalfetishcategory`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: join(SCREENSHOTS_DIR, 'relationships-05-results-fetish.png'), fullPage: true });
  console.log('Captured: relationships-05-results-fetish.png');

  await browser.close();
  console.log('\nDone! All screenshots saved to e2e/screenshots/');
}

capture().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
