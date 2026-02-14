const { chromium } = require('playwright');
const fs = require('fs');

const SCREENSHOTS = '/Users/austin/dev/kink/e2e/screenshots';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Navigate and wait for data
  await page.goto('http://localhost:3000/explore');
  await page.waitForTimeout(16000);

  // Deeper structure dump
  const structure = await page.evaluate(() => {
    function walk(el, depth = 0) {
      if (depth > 6) return '';
      let r = '';
      const tag = el.tagName?.toLowerCase() || '';
      if (!tag) return '';
      const cls = (el.className?.toString() || '').slice(0, 120);
      const role = el.getAttribute?.('role') || '';
      const dataTestid = el.getAttribute?.('data-testid') || '';
      const type = el.getAttribute?.('type') || '';
      const text = (el.children.length === 0 && el.textContent) ? el.textContent.trim().slice(0, 50) : '';
      const attrs = [];
      if (cls) attrs.push(`class="${cls}"`);
      if (role) attrs.push(`role="${role}"`);
      if (dataTestid) attrs.push(`data-testid="${dataTestid}"`);
      if (type) attrs.push(`type="${type}"`);
      r += '  '.repeat(depth) + `<${tag}` + (attrs.length ? ' ' + attrs.join(' ') : '') + '>';
      if (text) r += ` "${text}"`;
      r += '\n';
      for (const child of el.children || []) {
        r += walk(child, depth + 1);
      }
      return r;
    }
    return walk(document.querySelector('.page') || document.body);
  });
  fs.writeFileSync(`${SCREENSHOTS}/explore-structure-deep.txt`, structure);
  console.log('Deep structure saved');

  // Click a data cell to trigger selection
  const cells = await page.$$('table td');
  for (let i = 0; i < cells.length; i++) {
    const text = await cells[i].textContent();
    if (text && /^\d/.test(text.trim())) {
      await cells[i].click();
      console.log(`Clicked cell: "${text.trim()}"`);
      break;
    }
  }
  await page.waitForTimeout(1500);

  // Full page after click
  await page.screenshot({ path: `${SCREENSHOTS}/explore-12-cell-click-full.png`, fullPage: true });
  console.log('Cell click full page captured');

  // Check what changed - look for any new panels, highlights, etc
  const afterClickHTML = await page.evaluate(() => {
    // Look for selected states, highlight classes, detail panels
    const selected = document.querySelectorAll('[class*="selected"], [class*="active"], [class*="highlight"], [data-selected], [aria-selected="true"]');
    const panels = document.querySelectorAll('[class*="detail"], [class*="panel"], [class*="sidebar"], [class*="drawer"]');

    const results = {
      selectedElements: Array.from(selected).map(el => ({
        tag: el.tagName, cls: el.className?.toString().slice(0, 100)
      })),
      panelElements: Array.from(panels).map(el => ({
        tag: el.tagName, cls: el.className?.toString().slice(0, 100),
        visible: el.offsetParent !== null,
        text: el.textContent?.slice(0, 200)
      }))
    };

    return results;
  });
  fs.writeFileSync(`${SCREENSHOTS}/explore-after-click.json`, JSON.stringify(afterClickHTML, null, 2));
  console.log('After-click state saved');

  // Capture the results section specifically
  const resultsSection = await page.evaluate(() => {
    // Find section headers
    const headers = Array.from(document.querySelectorAll('h2, h3, [class*="section"]'));
    return headers.map(h => ({
      tag: h.tagName,
      text: h.textContent?.trim().slice(0, 80),
      cls: h.className?.toString().slice(0, 100)
    }));
  });
  console.log('Section headers:', JSON.stringify(resultsSection));

  // Zoom into the Results section area
  const resultsH2 = await page.$('h2:has-text("Results")');
  if (resultsH2) {
    const rbox = await resultsH2.boundingBox();
    if (rbox) {
      await page.screenshot({
        path: `${SCREENSHOTS}/explore-13-results-section.png`,
        clip: {
          x: 0,
          y: Math.max(0, rbox.y - 10),
          width: 1280,
          height: Math.min(600, 600)
        }
      });
      console.log('Results section captured');
    }
  }

  // Check the "Add to Notebook" button styling
  const addBtn = await page.$('button:has-text("Add to Notebook"), button:has-text("ADD TO NOTEBOOK"), button:has-text("notebook")');
  if (addBtn) {
    const btnStyles = await addBtn.evaluate(el => {
      const s = getComputedStyle(el);
      return {
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        color: s.color,
        bg: s.backgroundColor,
        border: s.border,
        borderRadius: s.borderRadius,
        textTransform: s.textTransform,
        padding: s.padding,
        boxShadow: s.boxShadow
      };
    });
    console.log('Add to Notebook button styles:', JSON.stringify(btnStyles, null, 2));
    fs.writeFileSync(`${SCREENSHOTS}/explore-notebook-btn-styles.json`, JSON.stringify(btnStyles, null, 2));

    const btnBox = await addBtn.boundingBox();
    if (btnBox) {
      await page.screenshot({
        path: `${SCREENSHOTS}/explore-14-notebook-btn.png`,
        clip: {
          x: Math.max(0, btnBox.x - 20),
          y: Math.max(0, btnBox.y - 20),
          width: Math.min(400, btnBox.width + 40),
          height: Math.min(100, btnBox.height + 40)
        }
      });
      console.log('Notebook button captured');
    }
  } else {
    console.log('No "Add to Notebook" button found');
  }

  // Check association / Cramer's V section
  const assocText = await page.evaluate(() => {
    const body = document.body.textContent || '';
    const match = body.match(/(?:association|cram|V\s*[=:])[^.]+/i);
    return match ? match[0] : null;
  });
  console.log('Association text found:', assocText);

  // Check all text content for the key stats area
  const statsText = await page.evaluate(() => {
    const mainEl = document.querySelector('.page');
    return mainEl ? mainEl.textContent.replace(/\s+/g, ' ').trim() : '';
  });
  fs.writeFileSync(`${SCREENSHOTS}/explore-page-text.txt`, statsText);
  console.log('Page text saved');

  // Combobox open - capture with more detail
  const comboboxButtons = await page.$$('button[role="combobox"]');
  if (comboboxButtons.length > 0) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await comboboxButtons[0].click();
    await page.waitForTimeout(1000);

    // Find the dropdown/listbox that opened
    const listbox = await page.$('[role="listbox"]') || await page.$('[data-radix-popper-content-wrapper]') || await page.$('[class*="popover"]');
    if (listbox) {
      const lbox = await listbox.boundingBox();
      if (lbox) {
        await page.screenshot({
          path: `${SCREENSHOTS}/explore-15-combobox-dropdown-detail.png`,
          clip: {
            x: Math.max(0, lbox.x - 10),
            y: Math.max(0, lbox.y - 10),
            width: Math.min(1280, lbox.width + 20),
            height: Math.min(600, lbox.height + 20)
          }
        });
        console.log('Combobox dropdown detail captured');
      }

      // Get dropdown styles
      const dropdownStyles = await listbox.evaluate(el => {
        const s = getComputedStyle(el);
        return {
          fontFamily: s.fontFamily,
          fontSize: s.fontSize,
          bg: s.backgroundColor,
          border: s.border,
          borderRadius: s.borderRadius,
          boxShadow: s.boxShadow,
          color: s.color
        };
      });
      console.log('Dropdown styles:', JSON.stringify(dropdownStyles, null, 2));
      fs.writeFileSync(`${SCREENSHOTS}/explore-dropdown-styles.json`, JSON.stringify(dropdownStyles, null, 2));
    } else {
      console.log('No listbox/popover found after combobox click');
      // screenshot full page to see what opened
      await page.screenshot({ path: `${SCREENSHOTS}/explore-15-combobox-fullpage.png`, fullPage: true });
    }

    // Check for search input inside the dropdown
    const searchInput = await page.$('[role="combobox"] input, input[placeholder*="search"], input[placeholder*="Search"]');
    if (searchInput) {
      const siStyles = await searchInput.evaluate(el => {
        const s = getComputedStyle(el);
        return {
          fontFamily: s.fontFamily,
          borderRadius: s.borderRadius,
          border: s.border,
          bg: s.backgroundColor
        };
      });
      console.log('Search input styles:', JSON.stringify(siStyles, null, 2));
    }

    await page.keyboard.press('Escape');
  }

  await browser.close();
  console.log('Done!');
})();
