import { chromium } from 'playwright';
import { join } from 'path';

const DIR = join(import.meta.dirname, 'screenshots');
const BASE = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${BASE}/sql`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Type a simple query that will definitely work
  const textarea = page.locator('textarea').first();
  await textarea.fill('SELECT straightness, politics, COUNT(*)::BIGINT AS respondents FROM data GROUP BY 1, 2 ORDER BY respondents DESC');
  await page.waitForTimeout(300);

  // Run the query
  const runBtn = page.locator('button').filter({ hasText: /run query/i }).first();
  await runBtn.click();
  await page.waitForTimeout(4000);

  // Full page after query
  await page.screenshot({ path: join(DIR, 'sql-results-01-full.png'), fullPage: true });

  // Scroll down to see results table
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(DIR, 'sql-results-02-table-view.png'), fullPage: false });

  // Scroll more to see more table rows
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(DIR, 'sql-results-03-table-rows.png'), fullPage: false });

  // Zoom into the button row
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // Now try adding to notebook - first check if button is enabled after query
  const addBtn = page.locator('button').filter({ hasText: /add to notebook/i }).first();
  const isDisabled = await addBtn.isDisabled();
  console.log(`Add to Notebook disabled: ${isDisabled}`);

  // Let's check the DOM state
  const btnHtml = await addBtn.evaluate(el => el.outerHTML);
  console.log(`Button HTML: ${btnHtml}`);

  // Check if result exists (maybe query is still running)
  const resultSection = page.locator('text=Results');
  const resultVisible = await resultSection.count();
  console.log(`Results section visible: ${resultVisible}`);

  await browser.close();
  console.log('Result screenshots saved');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
