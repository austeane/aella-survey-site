import { chromium } from 'playwright';

const SCREENSHOTS = '/Users/austin/dev/kink/e2e/screenshots';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // 1. Loading state - capture quickly after navigation
  await page.goto('http://localhost:3000/explore');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCREENSHOTS}/explore-01-loading.png`, fullPage: true });
  console.log('1. Loading state captured');

  // 2. Wait for DuckDB to load and data to appear
  await page.waitForTimeout(15000);
  await page.screenshot({ path: `${SCREENSHOTS}/explore-02-loaded-full.png`, fullPage: true });
  console.log('2. Fully loaded state captured');

  // 3. Controls area - clip to top portion
  await page.screenshot({
    path: `${SCREENSHOTS}/explore-03-controls.png`,
    clip: { x: 0, y: 0, width: 1280, height: 500 }
  });
  console.log('3. Controls area captured');

  // 4. Try to find and screenshot the pivot matrix table
  const table = await page.$('table');
  if (table) {
    const box = await table.boundingBox();
    if (box) {
      await page.screenshot({
        path: `${SCREENSHOTS}/explore-04-pivot-table.png`,
        clip: {
          x: Math.max(0, box.x - 10),
          y: Math.max(0, box.y - 10),
          width: Math.min(1280, box.width + 20),
          height: Math.min(2000, box.height + 20)
        }
      });
      console.log('4. Pivot table captured');
    }
  } else {
    console.log('4. No table found');
  }

  // 5. Open X column combobox
  // Look for combobox trigger buttons
  const comboboxButtons = await page.$$('button[role="combobox"]');
  console.log(`Found ${comboboxButtons.length} combobox buttons`);

  if (comboboxButtons.length > 0) {
    await comboboxButtons[0].click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SCREENSHOTS}/explore-05-combobox-open.png`, fullPage: false });
    console.log('5. Combobox open state captured');

    // Close the combobox by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // 6. Try to find filter checkboxes / filter section
  const filterSection = await page.$('[data-testid="filters"]') || await page.$('text=Filter');
  if (filterSection) {
    const fbox = await filterSection.boundingBox();
    if (fbox) {
      await page.screenshot({
        path: `${SCREENSHOTS}/explore-06-filters.png`,
        clip: {
          x: Math.max(0, fbox.x - 10),
          y: Math.max(0, fbox.y - 10),
          width: Math.min(1280, fbox.width + 200),
          height: Math.min(600, fbox.height + 100)
        }
      });
      console.log('6. Filter section captured');
    }
  } else {
    console.log('6. No filter section found directly');
  }

  // 7. Click a cell in the pivot table to open detail panel
  const cells = await page.$$('table td');
  console.log(`Found ${cells.length} table cells`);

  // Find a cell with content (not empty)
  for (const cell of cells) {
    const text = await cell.textContent();
    if (text && text.trim() && !text.includes('Total') && !text.includes('Other')) {
      await cell.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${SCREENSHOTS}/explore-07-cell-selected.png`, fullPage: true });
      console.log('7. Cell selected state captured');
      break;
    }
  }

  // 8. Look for the detail/selection panel that appears
  const detailPanel = await page.$('[class*="detail"]') || await page.$('[class*="panel"]') || await page.$('[class*="selected"]');
  if (detailPanel) {
    const dbox = await detailPanel.boundingBox();
    if (dbox) {
      await page.screenshot({
        path: `${SCREENSHOTS}/explore-08-detail-panel.png`,
        clip: {
          x: Math.max(0, dbox.x - 10),
          y: Math.max(0, dbox.y - 10),
          width: Math.min(1280, dbox.width + 20),
          height: Math.min(800, dbox.height + 20)
        }
      });
      console.log('8. Detail panel captured');
    }
  } else {
    console.log('8. No detail panel found via class');
  }

  // 9. Full page screenshot after cell selection (for overall review)
  await page.screenshot({ path: `${SCREENSHOTS}/explore-09-full-with-selection.png`, fullPage: true });
  console.log('9. Full page with selection captured');

  // 10. Look for association strength / Cramer's V display
  const cramerText = await page.$('text=Cram') || await page.$('text=V =') || await page.$('text=Association');
  if (cramerText) {
    const cbox = await cramerText.boundingBox();
    if (cbox) {
      await page.screenshot({
        path: `${SCREENSHOTS}/explore-10-association.png`,
        clip: {
          x: Math.max(0, cbox.x - 50),
          y: Math.max(0, cbox.y - 30),
          width: 500,
          height: 200
        }
      });
      console.log('10. Association strength captured');
    }
  }

  // 11. Scroll down to see if there's more content below the table
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOTS}/explore-11-bottom.png`, fullPage: false });
  console.log('11. Bottom of page captured');

  await browser.close();
  console.log('Done!');
})();
