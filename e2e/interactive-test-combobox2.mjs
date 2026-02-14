import { chromium } from '../node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const dir = 'e2e/screenshots/interactive';

async function snap(name) {
  await page.screenshot({ path: `${dir}/${name}.png` });
  console.log(`  -> ${name}.png`);
}

await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(12000);

// Scroll to Column Inspector
const inspector = page.locator('text=Column Inspector').first();
await inspector.scrollIntoViewIfNeeded();
await page.waitForTimeout(500);

// Click the select button
const selectBtn = page.locator('.raised-panel button').first();
await selectBtn.click();
await page.waitForTimeout(1000);

// Check for any new elements that appeared in the DOM
const allPopovers = await page.evaluate(() => {
  const els = document.querySelectorAll('[data-state], [role="listbox"], [role="option"], [data-radix-popper-content-wrapper], [data-radix-select-content], [data-side]');
  return Array.from(els).map(el => ({
    tag: el.tagName,
    role: el.getAttribute('role'),
    dataState: el.getAttribute('data-state'),
    className: el.className.substring(0, 100),
    childCount: el.children.length,
    text: el.textContent?.substring(0, 80)
  }));
});
console.log('Popovers/data-state elements:', JSON.stringify(allPopovers, null, 2));

await snap('39-combobox-click-check-dom');

// Check if Select content rendered
const selectContent = page.locator('[data-radix-select-content], [data-radix-popper-content-wrapper]');
console.log('Select content count:', await selectContent.count());

// Try the Radix select viewport
const selectViewport = page.locator('[data-radix-select-viewport]');
console.log('Select viewport count:', await selectViewport.count());

// Full page screenshot to see if dropdown is somewhere off-screen
await page.screenshot({ path: `${dir}/40-combobox-fullpage.png`, fullPage: true });
console.log('  -> 40-combobox-fullpage.png');

// If the dropdown IS open, scroll within it
if (await selectViewport.count() > 0) {
  const options = page.locator('[data-radix-select-viewport] [role="option"]');
  const optCount = await options.count();
  console.log(`Found ${optCount} options in select viewport`);

  // Screenshot the open dropdown
  const vpBox = await selectViewport.boundingBox();
  if (vpBox) {
    await page.screenshot({
      path: `${dir}/41-dropdown-open-detail.png`,
      clip: { x: vpBox.x - 5, y: vpBox.y - 5, width: vpBox.width + 10, height: Math.min(vpBox.height + 10, 500) }
    });
    console.log('  -> 41-dropdown-open-detail.png');
  }

  // Select "Gender" option
  const genderOpt = page.locator('[role="option"]:has-text("Gender")').first();
  if (await genderOpt.count() > 0) {
    await genderOpt.click();
    await page.waitForTimeout(2000);
    await snap('42-after-select-gender');
  }
} else {
  // Maybe it's a custom implementation with different markup
  // Check for any visible overlay
  const overlays = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const visible = [];
    for (const el of all) {
      const zIndex = window.getComputedStyle(el).zIndex;
      if (zIndex !== 'auto' && parseInt(zIndex) > 10) {
        visible.push({
          tag: el.tagName,
          class: el.className.substring(0, 60),
          zIndex,
          children: el.children.length,
          text: el.textContent?.substring(0, 60)
        });
      }
    }
    return visible;
  });
  console.log('High z-index elements:', JSON.stringify(overlays, null, 2));
}

// Try pressing Escape and reopening
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await snap('43-after-escape');

// Check the SelectTrigger's data-state
const triggerState = await selectBtn.evaluate(el => ({
  dataState: el.getAttribute('data-state'),
  ariaExpanded: el.getAttribute('aria-expanded'),
  ariaHasPopup: el.getAttribute('aria-haspopup')
}));
console.log('Trigger state:', triggerState);

// Try clicking again with force
await selectBtn.click({ force: true });
await page.waitForTimeout(1000);

// Check data-state again
const triggerState2 = await selectBtn.evaluate(el => ({
  dataState: el.getAttribute('data-state'),
  ariaExpanded: el.getAttribute('aria-expanded'),
  ariaHasPopup: el.getAttribute('aria-haspopup')
}));
console.log('Trigger state after re-click:', triggerState2);

// Count all options now
const allOptions = page.locator('[role="option"]');
console.log('All options in DOM:', await allOptions.count());

await snap('44-reopen-attempt');

// Let's check if it uses native <select> instead
const nativeSelect = page.locator('select');
console.log('Native selects:', await nativeSelect.count());

await browser.close();
console.log('\n=== Combobox debug complete ===');
