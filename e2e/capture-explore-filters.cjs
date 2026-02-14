const { chromium } = require('playwright');
const fs = require('fs');

const SCREENSHOTS = '/Users/austin/dev/kink/e2e/screenshots';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await page.goto('http://localhost:3000/explore');
  await page.waitForTimeout(16000);

  // 1. Capture filter values section
  const filterLabel = await page.$('text=Filter Values');
  if (filterLabel) {
    const flBox = await filterLabel.boundingBox();
    if (flBox) {
      await page.screenshot({
        path: `${SCREENSHOTS}/explore-20-filter-values.png`,
        clip: {
          x: Math.max(0, flBox.x - 20),
          y: Math.max(0, flBox.y - 10),
          width: 1100,
          height: 200
        }
      });
      console.log('Filter values section captured');
    }
  }

  // 2. Checkbox styles
  const checkboxButtons = await page.$$('button[role="checkbox"]');
  console.log(`Found ${checkboxButtons.length} checkbox buttons`);
  if (checkboxButtons.length > 0) {
    const cbStyles = await checkboxButtons[0].evaluate(el => {
      const s = getComputedStyle(el);
      return {
        width: s.width,
        height: s.height,
        border: s.border,
        borderRadius: s.borderRadius,
        bg: s.backgroundColor,
        boxShadow: s.boxShadow,
        appearance: s.appearance
      };
    });
    console.log('Checkbox styles:', JSON.stringify(cbStyles, null, 2));
    fs.writeFileSync(`${SCREENSHOTS}/explore-checkbox-styles.json`, JSON.stringify(cbStyles, null, 2));
  }

  // 3. Click X column selector to open it, capture with search
  const xColumnBtn = await page.$('button:has-text("Straightness")');
  if (xColumnBtn) {
    await xColumnBtn.click();
    await page.waitForTimeout(1000);

    // Now look for the popover/dialog that opens
    const popover = await page.$('[role="dialog"]') ||
                    await page.$('[data-radix-popper-content-wrapper]') ||
                    await page.$('[class*="popover"]');

    if (popover) {
      const pbox = await popover.boundingBox();
      if (pbox) {
        await page.screenshot({
          path: `${SCREENSHOTS}/explore-21-column-selector-open.png`,
          clip: {
            x: Math.max(0, pbox.x - 10),
            y: Math.max(0, pbox.y - 10),
            width: Math.min(1280, pbox.width + 20),
            height: Math.min(600, pbox.height + 20)
          }
        });
        console.log('Column selector popover captured');
      }

      // Popover inner styles
      const popStyles = await popover.evaluate(el => {
        const s = getComputedStyle(el);
        // Also check children
        const input = el.querySelector('input');
        const items = el.querySelectorAll('[role="option"], [cmdk-item]');
        return {
          popover: {
            bg: s.backgroundColor,
            border: s.border,
            borderRadius: s.borderRadius,
            boxShadow: s.boxShadow
          },
          searchInput: input ? (() => {
            const is = getComputedStyle(input);
            return {
              fontFamily: is.fontFamily,
              borderRadius: is.borderRadius,
              border: is.border,
              bg: is.backgroundColor,
              placeholder: input.placeholder
            };
          })() : null,
          optionCount: items.length,
          firstOption: items[0] ? (() => {
            const os = getComputedStyle(items[0]);
            return {
              fontFamily: os.fontFamily,
              fontSize: os.fontSize,
              color: os.color,
              bg: os.backgroundColor,
              borderRadius: os.borderRadius,
              text: items[0].textContent?.trim().slice(0, 50)
            };
          })() : null
        };
      });
      console.log('Popover styles:', JSON.stringify(popStyles, null, 2));
      fs.writeFileSync(`${SCREENSHOTS}/explore-popover-styles.json`, JSON.stringify(popStyles, null, 2));
    } else {
      console.log('No popover found');
      await page.screenshot({ path: `${SCREENSHOTS}/explore-21-column-selector-open.png`, fullPage: false });
    }

    // Type in search
    await page.keyboard.type('gen');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SCREENSHOTS}/explore-22-column-search.png`, fullPage: false });
    console.log('Column search captured');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // 4. Nav bar detail
  await page.screenshot({
    path: `${SCREENSHOTS}/explore-23-navbar.png`,
    clip: { x: 0, y: 0, width: 1280, height: 60 }
  });
  console.log('Navbar captured');

  // 5. Nav styles
  const navStyles = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    if (!nav) return null;
    const s = getComputedStyle(nav);
    const links = nav.querySelectorAll('a');
    const activeLink = nav.querySelector('.nav-link-active');
    return {
      nav: { bg: s.backgroundColor, borderBottom: s.borderBottom, fontFamily: s.fontFamily },
      activeLink: activeLink ? (() => {
        const as = getComputedStyle(activeLink);
        return { color: as.color, fontWeight: as.fontWeight, textDecoration: as.textDecoration, borderBottom: as.borderBottom };
      })() : null,
      linkCount: links.length
    };
  });
  console.log('Nav styles:', JSON.stringify(navStyles, null, 2));

  // 6. Capture the "raised-panel" vs "editorial-panel" styling
  const raisedPanel = await page.$('.raised-panel');
  if (raisedPanel) {
    const rpStyles = await raisedPanel.evaluate(el => {
      const s = getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        border: s.border,
        borderTop: s.borderTop,
        borderRadius: s.borderRadius,
        boxShadow: s.boxShadow,
        padding: s.padding
      };
    });
    console.log('Raised panel styles:', JSON.stringify(rpStyles, null, 2));
    fs.writeFileSync(`${SCREENSHOTS}/explore-raised-panel-styles.json`, JSON.stringify(rpStyles, null, 2));
  }

  const editorialPanel = await page.$('.editorial-panel');
  if (editorialPanel) {
    const epStyles = await editorialPanel.evaluate(el => {
      const s = getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        border: s.border,
        borderTop: s.borderTop,
        borderRadius: s.borderRadius,
        boxShadow: s.boxShadow,
        padding: s.padding
      };
    });
    console.log('Editorial panel styles:', JSON.stringify(epStyles, null, 2));
    fs.writeFileSync(`${SCREENSHOTS}/explore-editorial-panel-styles.json`, JSON.stringify(epStyles, null, 2));
  }

  // 7. Section header styles
  const sectionHeader = await page.$('.section-header');
  const sectionNumber = await page.$('.section-number');
  if (sectionHeader && sectionNumber) {
    const shStyles = await sectionHeader.evaluate(el => {
      const s = getComputedStyle(el);
      return { fontFamily: s.fontFamily, fontWeight: s.fontWeight, fontSize: s.fontSize, color: s.color, borderBottom: s.borderBottom };
    });
    const snStyles = await sectionNumber.evaluate(el => {
      const s = getComputedStyle(el);
      return { fontFamily: s.fontFamily, fontWeight: s.fontWeight, fontSize: s.fontSize, color: s.color };
    });
    console.log('Section header styles:', JSON.stringify(shStyles, null, 2));
    console.log('Section number styles:', JSON.stringify(snStyles, null, 2));
    fs.writeFileSync(`${SCREENSHOTS}/explore-section-styles.json`, JSON.stringify({ header: shStyles, number: snStyles }, null, 2));
  }

  // 8. Sample size display styles
  const sampleSize = await page.$('.sample-size');
  if (sampleSize) {
    const ssStyles = await sampleSize.evaluate(el => {
      const s = getComputedStyle(el);
      const item = el.querySelector('.sample-size-item');
      return {
        container: { display: s.display, gap: s.gap, bg: s.backgroundColor },
        item: item ? (() => {
          const is = getComputedStyle(item);
          return { fontFamily: is.fontFamily, fontSize: is.fontSize, color: is.color, bg: is.backgroundColor, borderRadius: is.borderRadius };
        })() : null
      };
    });
    console.log('Sample size styles:', JSON.stringify(ssStyles, null, 2));
  }

  // 9. Table totals row styling
  const totalRow = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    const lastRow = rows[rows.length - 1];
    if (!lastRow) return null;
    const s = getComputedStyle(lastRow);
    const firstTd = lastRow.querySelector('td');
    return {
      row: { bg: s.backgroundColor, fontWeight: s.fontWeight, borderTop: s.borderTop },
      firstTd: firstTd ? (() => {
        const ts = getComputedStyle(firstTd);
        return { fontWeight: ts.fontWeight, color: ts.color, borderTop: ts.borderTop };
      })() : null
    };
  });
  console.log('Total row styles:', JSON.stringify(totalRow, null, 2));

  await browser.close();
  console.log('Done!');
})();
