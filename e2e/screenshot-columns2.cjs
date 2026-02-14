const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto('http://localhost:3000/columns');
  await page.waitForTimeout(12000);

  // Find the search input by placeholder
  const searchInput = await page.$('input[placeholder="Type a column name"]');
  if (searchInput) {
    await searchInput.fill('kink');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/screenshots/columns-search-filtered.png', fullPage: true });
    console.log('Search filtered screenshot taken');
    await searchInput.fill('');
    await page.waitForTimeout(1000);
  } else {
    console.log('Search input not found');
  }

  // Find tag checkboxes - they are Radix Checkbox components
  // Click a tag label
  const tagLabels = await page.$$('label');
  for (const label of tagLabels) {
    const text = await label.textContent();
    if (text && text.includes('fetish')) {
      await label.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'e2e/screenshots/columns-tag-filtered.png', fullPage: true });
      console.log('Tag filtered screenshot taken');
      break;
    }
  }

  // Screenshot the tags area specifically
  // Find "Tag Filters" text and screenshot that region
  const tagFiltersText = await page.$('text=Tag Filters');
  if (tagFiltersText) {
    const box = await tagFiltersText.boundingBox();
    if (box) {
      await page.screenshot({
        path: 'e2e/screenshots/columns-tags-area.png',
        clip: { x: Math.max(0, box.x - 10), y: Math.max(0, box.y - 10), width: 600, height: 120 }
      });
      console.log('Tags area screenshot taken');
    }
  }

  // Also capture the sort dropdown open
  const selectTrigger = await page.$('[role="combobox"]');
  if (selectTrigger) {
    await selectTrigger.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/columns-sort-dropdown.png', fullPage: false });
    console.log('Sort dropdown screenshot taken');
    await page.keyboard.press('Escape');
  }

  await browser.close();
  console.log('Done!');
})();
