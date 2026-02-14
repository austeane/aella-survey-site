const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // 1. Full page screenshot
  await page.goto('http://localhost:3000/columns');
  await page.waitForTimeout(12000); // wait for DuckDB-WASM to load
  await page.screenshot({ path: 'e2e/screenshots/columns-full.png', fullPage: true });
  console.log('1. Full page screenshot taken');

  // 2. Column list detail - zoom into left panel showing some items
  const listItems = await page.locator('[class*="column"], [role="listbox"], [role="list"], ul, ol').first();
  // Take a viewport-cropped screenshot of the left side
  await page.screenshot({
    path: 'e2e/screenshots/columns-list-detail.png',
    clip: { x: 0, y: 100, width: 500, height: 700 }
  });
  console.log('2. Column list detail screenshot taken');

  // 3. Search input area - top of the page
  await page.screenshot({
    path: 'e2e/screenshots/columns-search-area.png',
    clip: { x: 0, y: 0, width: 640, height: 300 }
  });
  console.log('3. Search area screenshot taken');

  // 4. Click on a column to open inspector
  // Try clicking the first clickable column item
  const columnItems = await page.$$('button, [role="option"], [data-column], a');
  let clicked = false;
  for (const item of columnItems) {
    const text = await item.textContent();
    if (text && (text.includes('age') || text.includes('gender') || text.includes('Age'))) {
      await item.click();
      clicked = true;
      console.log('Clicked column:', text.trim().substring(0, 50));
      break;
    }
  }
  if (!clicked) {
    // Fallback: click in the left column area
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const box = await btn.boundingBox();
      if (box && box.x < 500 && box.y > 150) {
        await btn.click();
        clicked = true;
        const t = await btn.textContent();
        console.log('Clicked fallback button:', (t || '').trim().substring(0, 50));
        break;
      }
    }
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'e2e/screenshots/columns-inspector.png', fullPage: true });
  console.log('4. Inspector panel screenshot taken');

  // 5. Inspector panel detail - right side
  await page.screenshot({
    path: 'e2e/screenshots/columns-inspector-detail.png',
    clip: { x: 500, y: 0, width: 780, height: 900 }
  });
  console.log('5. Inspector detail screenshot taken');

  // 6. Search filtering - type in search
  const searchInput = await page.$('input[type="search"], input[type="text"], input[placeholder*="earch"], input[placeholder*="ilter"]');
  if (searchInput) {
    await searchInput.click();
    await searchInput.fill('kink');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'e2e/screenshots/columns-search-filtered.png', fullPage: true });
    console.log('6. Search filtered screenshot taken');

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(1000);
  } else {
    console.log('6. Search input not found, skipping');
  }

  // 7. Tag checkboxes area
  // Look for checkboxes/tags area
  const checkboxes = await page.$$('input[type="checkbox"]');
  if (checkboxes.length > 0) {
    const firstCheckbox = checkboxes[0];
    const box = await firstCheckbox.boundingBox();
    if (box) {
      await page.screenshot({
        path: 'e2e/screenshots/columns-tags-area.png',
        clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: 500, height: 300 }
      });
      console.log('7. Tags area screenshot taken');

      // Click a checkbox to filter
      await firstCheckbox.click();
      await page.waitForTimeout(1500);
      await page.screenshot({ path: 'e2e/screenshots/columns-tag-filtered.png', fullPage: true });
      console.log('8. Tag filtered screenshot taken');
    }
  } else {
    console.log('7-8. No checkboxes found, skipping');
  }

  // 9. Narrow viewport for responsive check
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('http://localhost:3000/columns');
  await page.waitForTimeout(8000);
  await page.screenshot({ path: 'e2e/screenshots/columns-tablet.png', fullPage: true });
  console.log('9. Tablet viewport screenshot taken');

  // 10. Mobile viewport
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3000/columns');
  await page.waitForTimeout(8000);
  await page.screenshot({ path: 'e2e/screenshots/columns-mobile.png', fullPage: true });
  console.log('10. Mobile viewport screenshot taken');

  await browser.close();
  console.log('Done! All screenshots saved to e2e/screenshots/');
})();
