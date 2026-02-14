import { chromium } from 'playwright';
import { join } from 'path';

const DIR = join(import.meta.dirname, 'screenshots');
const BASE = 'http://localhost:3000';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // ── SQL Console ──────────────────────────────────────────────

  // 1. Initial page
  await page.goto(`${BASE}/sql`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(DIR, 'sql-01-initial.png'), fullPage: false });

  // 2. Click a template button to populate SQL
  // Look for template buttons — they are inside the sidebar
  const templateBtns = page.locator('button').filter({ hasText: /demographics|age|gender|kink|fetish|orientation|basic/i });
  const templateCount = await templateBtns.count();
  console.log(`Found ${templateCount} template-like buttons`);

  if (templateCount > 0) {
    await templateBtns.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(DIR, 'sql-02-template-loaded.png'), fullPage: false });
  }

  // 3. Run a query — type SQL if textarea is empty
  const textarea = page.locator('textarea').first();
  const textareaValue = await textarea.inputValue().catch(() => '');
  if (!textareaValue.trim()) {
    await textarea.fill('SELECT age, gender, orientation FROM survey LIMIT 20');
    await page.waitForTimeout(300);
  }

  const runBtn = page.locator('button').filter({ hasText: /run/i }).first();
  if (await runBtn.count()) {
    await runBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: join(DIR, 'sql-03-results.png'), fullPage: false });
  }

  // 4. Sidebar — screenshot the left panel
  // Try to get the sidebar element
  const sidebarEl = page.locator('aside, [class*="sidebar"], div.w-\\[340px\\], div[class*="340"]').first();
  if (await sidebarEl.count()) {
    await sidebarEl.screenshot({ path: join(DIR, 'sql-04-sidebar.png') });
  } else {
    console.log('No sidebar found by class, taking left portion');
  }

  // 5. Full page
  await page.screenshot({ path: join(DIR, 'sql-05-fullpage.png'), fullPage: true });

  // 6. Try to add to notebook — need to check if button is enabled
  const addNotebookBtn = page.locator('button').filter({ hasText: /notebook/i }).first();
  if (await addNotebookBtn.count()) {
    const isDisabled = await addNotebookBtn.isDisabled();
    console.log(`Add to Notebook button disabled: ${isDisabled}`);
    if (!isDisabled) {
      await addNotebookBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(DIR, 'sql-06-notebook-added.png'), fullPage: false });
    } else {
      console.log('Button is disabled, skipping notebook add');
    }
  }

  // 7. Try a bad query for error display
  await textarea.fill('SELECT invalid_column FROM nonexistent_table');
  await runBtn.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: join(DIR, 'sql-07-error.png'), fullPage: false });

  // ── Notebook ─────────────────────────────────────────────────

  // First, let's go back and create a valid notebook entry
  // Run a valid query first
  await textarea.fill('SELECT age, gender FROM survey LIMIT 10');
  await runBtn.click();
  await page.waitForTimeout(3000);

  // Check add to notebook button again
  const addBtn2 = page.locator('button').filter({ hasText: /notebook/i }).first();
  if (await addBtn2.count()) {
    const isDisabled2 = await addBtn2.isDisabled();
    console.log(`Add to Notebook button disabled after valid query: ${isDisabled2}`);
    if (!isDisabled2) {
      await addBtn2.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(DIR, 'sql-08-after-notebook-add.png'), fullPage: false });
    }
  }

  // 1. Go to notebook
  await page.goto(`${BASE}/notebook`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: join(DIR, 'notebook-01-initial.png'), fullPage: false });

  // 2. Full page
  await page.screenshot({ path: join(DIR, 'notebook-02-fullpage.png'), fullPage: true });

  // 3. If there's an entry, try clicking edit
  const editBtn = page.locator('button').filter({ hasText: /edit/i }).first();
  if (await editBtn.count()) {
    const editVisible = await editBtn.isVisible();
    console.log(`Edit button visible: ${editVisible}`);
    if (editVisible) {
      await editBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: join(DIR, 'notebook-03-editing.png'), fullPage: false });
    }
  }

  // 4. Look for export and delete buttons
  const allButtons = page.locator('button');
  const btnCount = await allButtons.count();
  console.log(`Total buttons on notebook page: ${btnCount}`);
  for (let i = 0; i < btnCount; i++) {
    const text = await allButtons.nth(i).textContent();
    console.log(`  Button ${i}: "${text?.trim()}"`);
  }

  await browser.close();
  console.log('All screenshots saved to', DIR);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
