const { chromium } = require('playwright');
const fs = require('fs');

const SCREENSHOTS = '/Users/austin/dev/kink/e2e/screenshots';

async function safeClipScreenshot(page, path, box, padding = 10) {
  const vp = page.viewportSize();
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const clip = {
    x: Math.max(0, Math.floor(box.x - padding)),
    y: Math.max(0, Math.floor(box.y - padding)),
    width: Math.min(vp.width, Math.ceil(box.width + padding * 2)),
    height: Math.min(pageHeight, Math.ceil(box.height + padding * 2))
  };
  // Ensure clip is within page bounds
  if (clip.x + clip.width > vp.width) clip.width = vp.width - clip.x;
  if (clip.width <= 0 || clip.height <= 0) {
    console.log(`  Skipping screenshot ${path}: invalid clip dimensions`);
    return false;
  }
  await page.screenshot({ path, clip });
  return true;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // 1. Loading state
  await page.goto('http://localhost:3000/explore');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SCREENSHOTS}/explore-01-loading.png`, fullPage: true });
  console.log('1. Loading state captured');

  // 2. Wait for DuckDB to load and data
  await page.waitForTimeout(15000);
  await page.screenshot({ path: `${SCREENSHOTS}/explore-02-loaded-full.png`, fullPage: true });
  console.log('2. Fully loaded state captured');

  // 3. Controls area - top portion
  await page.screenshot({
    path: `${SCREENSHOTS}/explore-03-controls.png`,
    clip: { x: 0, y: 0, width: 1280, height: 500 }
  });
  console.log('3. Controls area captured');

  // 4. Pivot table - use fullPage and scroll to table
  const table = await page.$('table');
  if (table) {
    await table.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const box = await table.boundingBox();
    if (box) {
      console.log(`  Table box: x=${box.x} y=${box.y} w=${box.width} h=${box.height}`);
      const ok = await safeClipScreenshot(page, `${SCREENSHOTS}/explore-04-pivot-table.png`, box, 10);
      if (ok) console.log('4. Pivot table captured');
      else console.log('4. Pivot table clip failed');
    }
  } else {
    console.log('4. No table found');
  }

  // Scroll back to top for combobox interaction
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // 5. Open X column combobox
  const comboboxButtons = await page.$$('button[role="combobox"]');
  console.log(`Found ${comboboxButtons.length} combobox buttons`);

  if (comboboxButtons.length > 0) {
    await comboboxButtons[0].click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SCREENSHOTS}/explore-05-combobox-open.png`, fullPage: false });
    console.log('5. Combobox open state captured');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // 6. Open Y combobox if available
  if (comboboxButtons.length > 1) {
    await comboboxButtons[1].click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SCREENSHOTS}/explore-06-combobox-y-open.png`, fullPage: false });
    console.log('6. Y combobox open captured');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // 7. Look for checkboxes (filters)
  const checkboxes = await page.$$('input[type="checkbox"]');
  console.log(`Found ${checkboxes.length} checkboxes`);
  if (checkboxes.length > 0) {
    const firstCb = checkboxes[0];
    const cbBox = await firstCb.boundingBox();
    if (cbBox) {
      await safeClipScreenshot(page, `${SCREENSHOTS}/explore-07-filters.png`,
        { x: cbBox.x - 20, y: cbBox.y - 20, width: 500, height: 300 }, 0);
      console.log('7. Filter area captured');
    }
  }

  // 8. Click a cell in the pivot table
  if (table) {
    await table.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
  }

  const cells = await page.$$('table td');
  console.log(`Found ${cells.length} table cells`);

  let cellClicked = false;
  for (let i = 0; i < cells.length && i < 50; i++) {
    const cell = cells[i];
    const text = await cell.textContent();
    if (text && text.trim() && /^\d+/.test(text.trim())) {
      try {
        await cell.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `${SCREENSHOTS}/explore-08-cell-selected.png`, fullPage: true });
        console.log(`8. Cell selected (text: "${text.trim()}")`);
        cellClicked = true;
      } catch (e) {
        console.log(`  Cell click failed: ${e.message.slice(0, 80)}`);
      }
      break;
    }
  }

  if (!cellClicked) {
    console.log('8. Could not click a cell');
  }

  // 9. Viewport with selection
  await page.screenshot({ path: `${SCREENSHOTS}/explore-09-viewport-selected.png`, fullPage: false });
  console.log('9. Viewport with selection captured');

  // 10. Extract computed styles
  const styles = await page.evaluate(() => {
    const results = {};

    const body = document.body;
    const bodyStyles = getComputedStyle(body);
    results.body = {
      bg: bodyStyles.backgroundColor,
      color: bodyStyles.color,
      fontFamily: bodyStyles.fontFamily
    };

    const h1 = document.querySelector('h1');
    if (h1) {
      const s = getComputedStyle(h1);
      results.h1 = { fontFamily: s.fontFamily, fontWeight: s.fontWeight, color: s.color, fontSize: s.fontSize };
    }

    const h2 = document.querySelector('h2');
    if (h2) {
      const s = getComputedStyle(h2);
      results.h2 = { fontFamily: s.fontFamily, fontWeight: s.fontWeight, color: s.color, fontSize: s.fontSize };
    }

    const th = document.querySelector('th');
    if (th) {
      const s = getComputedStyle(th);
      results.th = { fontFamily: s.fontFamily, fontWeight: s.fontWeight, color: s.color, textTransform: s.textTransform, fontSize: s.fontSize, borderRadius: s.borderRadius };
    }

    const td = document.querySelector('td');
    if (td) {
      const s = getComputedStyle(td);
      results.td = { fontFamily: s.fontFamily, color: s.color, fontSize: s.fontSize, borderRadius: s.borderRadius };
    }

    const combobox = document.querySelector('[role="combobox"]');
    if (combobox) {
      const s = getComputedStyle(combobox);
      results.combobox = { fontFamily: s.fontFamily, borderRadius: s.borderRadius, border: s.border, bg: s.backgroundColor, color: s.color };
    }

    const select = document.querySelector('select');
    if (select) {
      const s = getComputedStyle(select);
      results.select = { fontFamily: s.fontFamily, borderRadius: s.borderRadius, border: s.border, bg: s.backgroundColor };
    }

    const numInput = document.querySelector('input[type="number"]');
    if (numInput) {
      const s = getComputedStyle(numInput);
      results.numberInput = { fontFamily: s.fontFamily, borderRadius: s.borderRadius, border: s.border, bg: s.backgroundColor };
    }

    // Scan for violations: shadows, border-radius, gradients
    const allEls = document.querySelectorAll('*');
    const shadowViolations = [];
    const radiusViolations = [];
    const gradientViolations = [];

    for (const el of allEls) {
      const s = getComputedStyle(el);
      if (s.boxShadow && s.boxShadow !== 'none') {
        shadowViolations.push({
          tag: el.tagName, cls: (el.className?.toString() || '').slice(0, 80), shadow: s.boxShadow.slice(0, 120)
        });
      }
      const br = parseFloat(s.borderRadius);
      if (br > 0) {
        radiusViolations.push({
          tag: el.tagName, cls: (el.className?.toString() || '').slice(0, 80), borderRadius: s.borderRadius
        });
      }
      if (s.backgroundImage && s.backgroundImage !== 'none' && s.backgroundImage.includes('gradient')) {
        gradientViolations.push({
          tag: el.tagName, cls: (el.className?.toString() || '').slice(0, 80), bg: s.backgroundImage.slice(0, 120)
        });
      }
    }

    results.violations = {
      shadows: shadowViolations.slice(0, 30),
      borderRadius: radiusViolations.slice(0, 40),
      gradients: gradientViolations.slice(0, 10)
    };

    // Check fonts actually loaded
    results.fontsLoaded = document.fonts ? Array.from(document.fonts).map(f => ({
      family: f.family, weight: f.weight, style: f.style, status: f.status
    })).slice(0, 30) : [];

    return results;
  });

  fs.writeFileSync(`${SCREENSHOTS}/explore-styles.json`, JSON.stringify(styles, null, 2));
  console.log('10. Computed styles saved');

  // 11. Get page HTML structure
  const structure = await page.evaluate(() => {
    function walk(el, depth = 0) {
      if (depth > 3) return '';
      let r = '';
      const tag = el.tagName?.toLowerCase() || '';
      if (!tag) return '';
      const cls = (el.className?.toString() || '').slice(0, 100);
      const role = el.getAttribute?.('role') || '';
      const text = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 ? el.textContent.trim().slice(0, 40) : '';
      r += '  '.repeat(depth) + `<${tag}` + (cls ? ` class="${cls}"` : '') + (role ? ` role="${role}"` : '') + '>' + (text ? ` "${text}"` : '') + '\n';
      for (const child of el.children || []) {
        r += walk(child, depth + 1);
      }
      return r;
    }
    return walk(document.body);
  });
  fs.writeFileSync(`${SCREENSHOTS}/explore-structure.txt`, structure);
  console.log('11. Page structure saved');

  await browser.close();
  console.log('Done!');
})();
