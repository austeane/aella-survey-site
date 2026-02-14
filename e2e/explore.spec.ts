import { test, expect, type Page } from "@playwright/test";

/**
 * Helper: select a column in a ColumnCombobox using keyboard navigation.
 * Opens the dropdown, types to filter, waits for React to update filtered
 * options and clamped highlight index, then presses Enter.
 *
 * IMPORTANT: use column names that uniquely match a single option (e.g.
 * "straightness", "politics", "biomale") to avoid picking the wrong one.
 */
async function selectColumn(
  page: Page,
  labelText: string,
  columnName: string,
) {
  const label = page.locator("label.editorial-label", {
    hasText: labelText,
  });
  const trigger = label.locator("button:has(svg)").first();
  await trigger.click();

  const searchInput = label.locator('input[placeholder="Search columns..."]');
  await searchInput.waitFor({ state: "visible", timeout: 5000 });
  await searchInput.fill(columnName);

  // Wait for React to filter options and clamp highlighted index via useEffect
  await page.waitForTimeout(500);

  await searchInput.press("Enter");

  // Wait for dropdown to close (React conditionally unmounts it)
  await expect(searchInput).not.toBeVisible({ timeout: 5000 });
}

/**
 * Wait for the default pivot to load. The explore page defaults to
 * straightness x politics, both categorical, so a pivot table renders.
 */
async function waitForDefaultPivot(page: Page) {
  await expect(
    page.locator("label.editorial-label", { hasText: "X question" }),
  ).toBeVisible({ timeout: 30000 });

  await expect(page.locator(".editorial-table")).toBeVisible({
    timeout: 30000,
  });
}

test.describe("Explore page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/explore");
  });

  test("loads and shows controls after DuckDB initializes", async ({
    page,
  }) => {
    // Page title visible immediately
    await expect(
      page.locator("h1", { hasText: "Explore Two Questions" }),
    ).toBeVisible();

    // Controls section appears once schema loads
    await expect(
      page.locator("text=Edit this chart").first(),
    ).toBeVisible({ timeout: 30000 });

    // X/Y Column labels present
    await expect(
      page.locator("label.editorial-label", { hasText: "X question" }),
    ).toBeVisible();
    await expect(
      page.locator("label.editorial-label", { hasText: "Y question" }),
    ).toBeVisible();
  });

  test("selects X and Y columns via ColumnCombobox", async ({ page }) => {
    await waitForDefaultPivot(page);

    // Default X is "straightness" => display "Sexual Orientation"
    const xButton = page
      .locator("label.editorial-label", { hasText: "X question" })
      .locator("button:has(svg)")
      .first();
    await expect(xButton).toContainText("Sexual Orientation");

    // Now switch X to "biomale" using selectColumn
    await selectColumn(page, "X question", "biomale");
    await expect(xButton).toContainText("Sex (biological male)", { timeout: 5000 });

    // Switch Y to "straightness"
    await selectColumn(page, "Y question", "straightness");
    const yButton = page
      .locator("label.editorial-label", { hasText: "Y question" })
      .locator("button:has(svg)")
      .first();
    await expect(yButton).toContainText("Sexual Orientation", {
      timeout: 5000,
    });
  });

  test("renders pivot matrix with default columns", async ({ page }) => {
    await waitForDefaultPivot(page);

    // Corner cell: "Y \\ X"
    await expect(
      page.locator(".editorial-table th", { hasText: "Y \\ X" }),
    ).toBeVisible();

    // "Row Total" column header
    await expect(
      page.locator(".editorial-table th", { hasText: "Row Total" }),
    ).toBeVisible();

    // "Total" row at bottom
    await expect(
      page.locator(".editorial-table td", { hasText: "Total" }),
    ).toBeVisible();

    // Numeric cell buttons exist
    const cells = page.locator(".editorial-table tbody td.numeric button");
    const cellCount = await cells.count();
    expect(cellCount).toBeGreaterThan(0);
  });

  test("normalization modes change cell format", async ({ page }) => {
    await waitForDefaultPivot(page);

    // Default is row normalization from route defaults.
    const firstCell = page
      .locator(".editorial-table tbody td.numeric button")
      .first();
    const countText = await firstCell.textContent();
    expect(countText).toBeTruthy();
    expect(countText).toContain("%");

    // Switch to "Row %"
    const normTrigger = page
      .locator("label.editorial-label", {
        hasText: "How to count",
      })
      .locator('button[role="combobox"]')
      .first();
    await normTrigger.click();
    await page.locator('[role="option"]', { hasText: "Row %" }).click();
    await expect(firstCell).toContainText("%", { timeout: 5000 });

    // Switch to "Column %"
    await normTrigger.click();
    await page.locator('[role="option"]', { hasText: "Column %" }).click();
    await expect(firstCell).toContainText("%", { timeout: 5000 });

    // Switch to "Overall %"
    await normTrigger.click();
    await page.locator('[role="option"]', { hasText: "Overall %" }).click();
    await expect(firstCell).toContainText("%", { timeout: 5000 });

    // Back to "Counts"
    await normTrigger.click();
    await page.locator('[role="option"]', { hasText: "Counts" }).click();
    const backToCount = await firstCell.textContent();
    expect(backToCount).not.toContain("%");
  });

  test("topN control changes the number of matrix columns", async ({
    page,
  }) => {
    await waitForDefaultPivot(page);

    // Count initial header columns
    const initialHeaderCount = await page
      .locator(".editorial-table thead th")
      .count();

    // Change topN to 3 (minimum)
    const topNInput = page.locator('input[name="top_n"]');
    await topNInput.fill("3");
    await topNInput.press("Tab");

    // Wait for table to re-render
    await page.waitForTimeout(1000);
    const newHeaderCount = await page
      .locator(".editorial-table thead th")
      .count();

    // Fewer or equal columns (3 data cols + corner + "Row Total" = 5, maybe +1 "Other")
    expect(newHeaderCount).toBeLessThanOrEqual(initialHeaderCount);
    expect(newHeaderCount).toBeGreaterThanOrEqual(3);
  });

  test("filter column shows checkboxes with values", async ({ page }) => {
    // Wait for controls and filter values to load
    await expect(
      page.locator("label.editorial-label", { hasText: "X question" }),
    ).toBeVisible({ timeout: 30000 });

    await expect(page.locator("text=Filter values")).toBeVisible({
      timeout: 30000,
    });

    // Checkbox filter options should exist
    const filterLabels = page.locator(
      'label:has(button[role="checkbox"])',
    );
    const count = await filterLabels.count();
    expect(count).toBeGreaterThan(0);

    // Toggle a checkbox
    const firstCheckbox = filterLabels
      .first()
      .locator('button[role="checkbox"]');
    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute("data-state", "checked");

    await firstCheckbox.click();
    await expect(firstCheckbox).toHaveAttribute("data-state", "unchecked");
  });

  test("clicking a cell shows selected cell detail panel", async ({
    page,
  }) => {
    await waitForDefaultPivot(page);

    // Click the first data cell
    const firstDataCell = page
      .locator(".editorial-table tbody td.numeric button")
      .first();
    await firstDataCell.click();

    // Selected Cell panel should appear
    await expect(
      page.locator("text=Selected Cell").first(),
    ).toBeVisible({ timeout: 5000 });

    // Percentages displayed
    await expect(page.locator("text=People:").first()).toBeVisible();
    await expect(page.locator("text=% of row:").first()).toBeVisible();
    await expect(page.locator("text=% of column:").first()).toBeVisible();
    await expect(page.locator("text=% overall:").first()).toBeVisible();

    // Links to Profile and SQL
    await expect(
      page.locator("a, button", { hasText: "Open this cohort in Profile" }),
    ).toBeVisible();
    await expect(
      page.locator("a", { hasText: "Generate SQL for this cohort" }),
    ).toBeVisible();
  });

  test("URL state updates with selected columns", async ({ page }) => {
    await waitForDefaultPivot(page);

    // Default URL should contain x=straightness and y=politics
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url).toContain("x=straightness");
    expect(url).toContain("y=politics");

    // Change X to "biomale"
    await selectColumn(page, "X question", "biomale");
    await page.waitForTimeout(500);
    const url2 = page.url();
    expect(url2).toContain("x=biomale");

    // Navigate directly via URL and verify state restores
    await page.goto("/explore?x=biomale&y=politics");
    await expect(
      page.locator("label.editorial-label", { hasText: "X question" }),
    ).toBeVisible({ timeout: 30000 });

    const xButton = page
      .locator("label.editorial-label", { hasText: "X question" })
      .locator("button:has(svg)")
      .first();
    await expect(xButton).toContainText("Sex (biological male)", { timeout: 10000 });

    await expect(page.locator(".editorial-table")).toBeVisible({
      timeout: 30000,
    });
  });

  test("Add to Notebook saves entry", async ({ page }) => {
    await waitForDefaultPivot(page);

    // Click "Add to Notebook"
    const notebookButton = page.locator("button", {
      hasText: "Add to Notebook",
    });
    await expect(notebookButton).toBeVisible();
    await notebookButton.click();

    // Button text changes to "Saved!" temporarily
    await expect(
      page.locator("button", { hasText: "Saved!" }),
    ).toBeVisible({ timeout: 3000 });

    // Navigate to notebook page — entry should include cross-tab info
    await page.goto("/notebook");
    await expect(
      page.locator("text=straightness").first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("normalization param persists in URL", async ({ page }) => {
    await page.goto("/explore?x=straightness&y=politics&normalization=row");

    await expect(
      page.locator("label.editorial-label", { hasText: "X question" }),
    ).toBeVisible({ timeout: 30000 });

    await expect(page.locator(".editorial-table")).toBeVisible({
      timeout: 30000,
    });

    // Cells should contain "%" since row normalization is active
    const firstCell = page
      .locator(".editorial-table tbody td.numeric button")
      .first();
    await expect(firstCell).toContainText("%", { timeout: 5000 });
  });
});
