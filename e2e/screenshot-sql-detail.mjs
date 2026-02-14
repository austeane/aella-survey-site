import { chromium } from 'playwright';
import { join } from 'path';

const DIR = join(import.meta.dirname, 'screenshots');
const BASE = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // ── SQL Console detail shots ─────────────────────────────────

  await page.goto(`${BASE}/sql`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Zoom into the top header area
  await page.screenshot({ path: join(DIR, 'sql-detail-01-header.png'), fullPage: false, clip: { x: 0, y: 0, width: 1440, height: 120 } });

  // Zoom into template buttons area
  await page.screenshot({ path: join(DIR, 'sql-detail-02-templates.png'), fullPage: false, clip: { x: 0, y: 90, width: 700, height: 200 } });

  // Zoom into the "Filter by name" input and column list
  await page.screenshot({ path: join(DIR, 'sql-detail-03-filter-input.png'), fullPage: false, clip: { x: 0, y: 220, width: 700, height: 150 } });

  // Zoom into template query buttons
  await page.screenshot({ path: join(DIR, 'sql-detail-04-query-buttons.png'), fullPage: false, clip: { x: 0, y: 290, width: 700, height: 500 } });

  // Now click a template and run query
  const templateBtns = page.locator('button').filter({ hasText: /demographics|age|gender|kink|fetish|orientation|basic/i });
  if (await templateBtns.count() > 0) {
    await templateBtns.first().click();
    await page.waitForTimeout(500);
  }

  // Run query
  const runBtn = page.locator('button').filter({ hasText: /run/i }).first();
  if (await runBtn.count()) {
    await runBtn.click();
    await page.waitForTimeout(3000);
  }

  // Zoom into the editor area with SQL and buttons
  await page.screenshot({ path: join(DIR, 'sql-detail-05-editor-area.png'), fullPage: false, clip: { x: 0, y: 550, width: 1440, height: 350 } });

  // Zoom into the results table header
  await page.screenshot({ path: join(DIR, 'sql-detail-06-results-top.png'), fullPage: false, clip: { x: 0, y: 750, width: 1440, height: 200 } });

  // Scroll down to see more results
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(DIR, 'sql-detail-07-results-scrolled.png'), fullPage: false });

  // Zoom into buttons row (Run, limit input, CSV, notebook)
  await page.evaluate(() => window.scrollTo(0, 350));
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(DIR, 'sql-detail-08-button-row.png'), fullPage: false, clip: { x: 0, y: 250, width: 1440, height: 100 } });

  // ── Notebook detail ──────────────────────────────────────────

  await page.goto(`${BASE}/notebook`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Notebook header
  await page.screenshot({ path: join(DIR, 'notebook-detail-01-header.png'), fullPage: false, clip: { x: 0, y: 0, width: 1440, height: 200 } });

  // Entries section
  await page.screenshot({ path: join(DIR, 'notebook-detail-02-entries.png'), fullPage: false, clip: { x: 0, y: 160, width: 1440, height: 250 } });

  // Export section
  await page.screenshot({ path: join(DIR, 'notebook-detail-03-export.png'), fullPage: false, clip: { x: 0, y: 350, width: 1440, height: 150 } });

  await browser.close();
  console.log('Detail screenshots saved');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
