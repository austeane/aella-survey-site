import { chromium } from 'playwright';
import { join } from 'path';

const DIR = join(import.meta.dirname, 'screenshots');
const BASE = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Step 1: Go to SQL, run a query, add to notebook
  await page.goto(`${BASE}/sql`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const textarea = page.locator('textarea').first();
  await textarea.fill('SELECT straightness, politics, COUNT(*)::BIGINT AS respondents FROM data GROUP BY 1, 2 ORDER BY respondents DESC');

  const runBtn = page.locator('button').filter({ hasText: /run query/i }).first();
  await runBtn.click();
  await page.waitForTimeout(4000);

  // Add to notebook
  const addBtn = page.locator('button').filter({ hasText: /add to notebook/i }).first();
  const isDisabled = await addBtn.isDisabled();
  console.log(`Add to Notebook disabled: ${isDisabled}`);

  if (!isDisabled) {
    await addBtn.click();
    await page.waitForTimeout(1000);
    console.log('Added to notebook');
    await page.screenshot({ path: join(DIR, 'sql-after-notebook-add.png'), fullPage: false });
  }

  // Step 2: Go to notebook page
  await page.goto(`${BASE}/notebook`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(DIR, 'notebook-with-entry-01.png'), fullPage: false });
  await page.screenshot({ path: join(DIR, 'notebook-with-entry-02-full.png'), fullPage: true });

  // Step 3: Click to edit title
  const title = page.locator('.caveat-title').first();
  if (await title.count()) {
    await title.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(DIR, 'notebook-editing-title.png'), fullPage: false });

    // Click away to blur
    await page.locator('h1').first().click();
    await page.waitForTimeout(500);
  }

  // Step 4: Click "Click to add notes..."
  const notesText = page.locator('.caveat-description').first();
  if (await notesText.count()) {
    console.log('Found caveat-description, clicking...');
    await notesText.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(DIR, 'notebook-editing-notes.png'), fullPage: false });
  }

  // Step 5: Final state
  await page.screenshot({ path: join(DIR, 'notebook-final-state.png'), fullPage: false });
  await page.screenshot({ path: join(DIR, 'notebook-final-full.png'), fullPage: true });

  // Step 6: Check button states
  const deleteBtn = page.locator('button').filter({ hasText: /delete/i }).first();
  if (await deleteBtn.count()) {
    console.log('Delete button found');
  }

  const exportBtn = page.locator('button').filter({ hasText: /export/i }).first();
  if (await exportBtn.count()) {
    const exportDisabled = await exportBtn.isDisabled();
    console.log(`Export disabled: ${exportDisabled}`);
  }

  await browser.close();
  console.log('Notebook screenshots saved');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
