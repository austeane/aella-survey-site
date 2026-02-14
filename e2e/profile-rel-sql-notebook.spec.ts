import { test, expect } from "@playwright/test";

// DuckDB-WASM queries can be slow; give plenty of room
const DUCKDB_TIMEOUT = 30_000;

// ---------------------------------------------------------------------------
// Profile page tests
// ---------------------------------------------------------------------------
test.describe("Profile page (/profile)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Build a Profile" })).toBeVisible();
  });

  test("loads with mode toggle buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: "One Group" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Compare Two Groups" })).toBeVisible();
  });

  test("single mode: select filter, pick value, build profile, see results", async ({ page }) => {
    // Wait for schema to load (filter slots appear)
    await expect(page.getByText("Field 1")).toBeVisible({ timeout: DUCKDB_TIMEOUT });

    // The first combobox should already be populated with a default column.
    // We need to pick a value from the Value dropdown for the first slot.
    // Wait for value options to load (the Select should become enabled).
    const firstValueTrigger = page.locator("label").filter({ hasText: "Value" }).first().locator("button");
    await expect(firstValueTrigger).toBeEnabled({ timeout: DUCKDB_TIMEOUT });

    // Click the Value select and pick the first non-None option
    await firstValueTrigger.click();
    const firstOption = page.getByRole("option").filter({ hasNotText: "None" }).first();
    await expect(firstOption).toBeVisible({ timeout: 5_000 });
    await firstOption.click();

    // Run one-group analysis
    const buildBtn = page.getByRole("button", { name: "Run Group Analysis" });
    await expect(buildBtn).toBeEnabled({ timeout: 5_000 });
    await buildBtn.click();

    // Wait for results: stat cards should appear
    await expect(page.getByText("Dataset Size")).toBeVisible({ timeout: DUCKDB_TIMEOUT });
    await expect(page.getByText("Cohort Size")).toBeVisible({ timeout: DUCKDB_TIMEOUT });
    await expect(page.getByText("Cohort Share", { exact: true })).toBeVisible({ timeout: DUCKDB_TIMEOUT });

    // Over-indexing table section
    await expect(page.getByText("Most Unusually Common Signals")).toBeVisible({ timeout: DUCKDB_TIMEOUT });
  });

  test("compare mode: toggle, see cohort A and B panels", async ({ page }) => {
    // Click compare mode
    await page.getByRole("button", { name: "Compare Two Groups" }).click();

    // Cohort A and Cohort B panels should appear
    await expect(page.getByText("Cohort A").first()).toBeVisible();
    await expect(page.getByText("Cohort B").first()).toBeVisible();

    // Button should show "Compare" not "Build Profile"
    await expect(page.getByRole("button", { name: "Compare", exact: true })).toBeVisible();
  });

  test("URL state persists mode selection", async ({ page }) => {
    // Switch to compare mode
    await page.getByRole("button", { name: "Compare Two Groups" }).click();
    // Wait for URL to update
    await expect(page).toHaveURL(/mode=compare/, { timeout: 5_000 });

    // Switch back to single
    await page.getByRole("button", { name: "One Group" }).click();
    // "mode=compare" should be gone
    await expect(page).not.toHaveURL(/mode=compare/, { timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Relationships page tests
// ---------------------------------------------------------------------------
test.describe("Relationships page (/relationships)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/relationships");
    await expect(page.getByRole("heading", { name: "What's Connected?" })).toBeVisible();
  });

  test("loads with column combobox and results table", async ({ page }) => {
    // Target Column section
    await expect(page.getByText("Question to start from")).toBeVisible();

    // Results table headers
    await expect(page.getByRole("columnheader", { name: "Related Question" })).toBeVisible({ timeout: DUCKDB_TIMEOUT });
    await expect(page.getByRole("columnheader", { name: "Strength" }).first()).toBeVisible();
  });

  test("selecting a column shows related columns with metrics", async ({ page }) => {
    // Navigate directly with the column param to avoid combobox ambiguity
    await page.goto("/relationships?column=straightness");

    // URL should reflect the selection
    await expect(page).toHaveURL(/column=straightness/);

    // Results table should show rows with metric labels
    const table = page.locator(".editorial-table");
    await expect(table).toBeVisible({ timeout: DUCKDB_TIMEOUT });

    // Should have strength label badges (negligible/weak/moderate/strong)
    const strengthBadge = table.locator("td").filter({ hasText: /negligible|weak|moderate|strong/ }).first();
    await expect(strengthBadge).toBeVisible();
  });

  test("result links navigate to /explore with x and y params", async ({ page }) => {
    // Table should load with default column selected
    const firstLink = page.locator(".editorial-table a").first();
    await expect(firstLink).toBeVisible({ timeout: DUCKDB_TIMEOUT });

    // Get the href and verify it points to /explore with params
    const href = await firstLink.getAttribute("href");
    expect(href).toContain("/explore");
    expect(href).toContain("x=");
    expect(href).toContain("y=");
  });

  test("URL state: navigating with ?column= preselects", async ({ page }) => {
    await page.goto("/relationships?column=straightness");

    // The combobox trigger should show "straightness" (or its display name)
    await expect(page).toHaveURL(/column=straightness/);

    // Table should have results
    const table = page.locator(".editorial-table");
    await expect(table).toBeVisible({ timeout: DUCKDB_TIMEOUT });
  });
});

// ---------------------------------------------------------------------------
// SQL Console tests
// ---------------------------------------------------------------------------
test.describe("SQL Console (/sql)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sql");
    await expect(page.getByRole("heading", { name: "SQL Console" })).toBeVisible();
  });

  test("loads with sidebar templates and editor", async ({ page }) => {
    // Templates section
    await expect(page.getByText("Templates", { exact: true })).toBeVisible();

    // All 5 template buttons
    await expect(page.getByRole("button", { name: "Distribution (categorical)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Distribution (numeric)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cross-tab" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cohort filter" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Correlation" })).toBeVisible();

    // Editor textarea should contain starter SQL
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue(/SELECT/);

    // Run Query button
    await expect(page.getByRole("button", { name: "Run Query" })).toBeVisible();
  });

  test("clicking a template populates the textarea", async ({ page }) => {
    await page.getByRole("button", { name: "Distribution (categorical)" }).click();
    const textarea = page.locator("textarea");
    await expect(textarea).toHaveValue(/\{\{column\}\}/);
  });

  test("run query and see results table", async ({ page }) => {
    // The starter SQL should already be in the textarea. Just click Run.
    const runBtn = page.getByRole("button", { name: "Run Query" });
    await expect(runBtn).toBeEnabled({ timeout: DUCKDB_TIMEOUT });
    await runBtn.click();

    // Results section should appear
    await expect(page.getByText("Results")).toBeVisible({ timeout: DUCKDB_TIMEOUT });
    await expect(page.getByText("Rows returned")).toBeVisible({ timeout: DUCKDB_TIMEOUT });
  });

  test("limit input restricts results", async ({ page }) => {
    // Set limit to 5
    const limitInput = page.locator('input[name="query_limit"]');
    await limitInput.fill("5");
    await limitInput.press("Tab");
    await expect(limitInput).toHaveValue("5");

    // Run the starter query
    const runBtn = page.getByRole("button", { name: "Run Query" });
    await expect(runBtn).toBeEnabled({ timeout: DUCKDB_TIMEOUT });
    await runBtn.click();

    // Check row count in results
    await expect(page.getByText("Rows returned")).toBeVisible({ timeout: DUCKDB_TIMEOUT });
    await expect(page.getByText(/Limit applied:\s*5\b/)).toBeVisible({
      timeout: DUCKDB_TIMEOUT,
    });
  });

  test("column sidebar: search filters column list", async ({ page }) => {
    // Schema columns should load — wait for at least one column button in the aside
    const aside = page.locator("aside");
    await expect(aside.locator("button").filter({ hasText: /^[a-z]/ }).first()).toBeVisible({ timeout: DUCKDB_TIMEOUT });

    // Type a search term
    const searchInput = page.locator('input[name="schema_search"]');
    await searchInput.fill("gender");

    // Filtered list should show a button containing "gender"
    const columnBtn = aside.locator("button").filter({ hasText: "gender" }).first();
    await expect(columnBtn).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Notebook page tests
// ---------------------------------------------------------------------------
test.describe("Notebook page (/notebook)", () => {
  test("loads and shows empty state", async ({ page }) => {
    // Clear localStorage first to ensure clean state
    await page.goto("/notebook");
    await page.evaluate(() => localStorage.removeItem("bks-notebook"));
    await page.reload();

    await expect(page.getByRole("heading", { name: "Research Notebook" })).toBeVisible();
    await expect(page.getByText("No entries yet")).toBeVisible();
  });

  test("export button is disabled when no entries", async ({ page }) => {
    await page.goto("/notebook");
    await page.evaluate(() => localStorage.removeItem("bks-notebook"));
    await page.reload();

    const exportBtn = page.getByRole("button", { name: "Export as JSON" });
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeDisabled();
  });

  test("entry added from SQL page shows up and can be deleted", async ({ page }) => {
    // First, clear notebook
    await page.goto("/notebook");
    await page.evaluate(() => localStorage.removeItem("bks-notebook"));

    // Go to SQL page and run a query to create a notebook entry
    await page.goto("/sql");
    const runBtn = page.getByRole("button", { name: "Run Query" });
    await expect(runBtn).toBeEnabled({ timeout: DUCKDB_TIMEOUT });
    await runBtn.click();
    await expect(page.getByText("Results")).toBeVisible({ timeout: DUCKDB_TIMEOUT });

    // Click "Add to Notebook"
    await page.getByRole("button", { name: "Add to Notebook" }).click();
    await expect(page.getByText("Saved!")).toBeVisible({ timeout: 5_000 });

    // Navigate to Notebook page
    await page.goto("/notebook");
    await expect(page.getByRole("heading", { name: "Research Notebook" })).toBeVisible();

    // Entry should be visible
    await expect(page.getByText("SQL:").first()).toBeVisible({ timeout: 5_000 });

    // "Open source" link should be present
    await expect(page.getByText("Open source")).toBeVisible();

    // Export button should be enabled
    const exportBtn = page.getByRole("button", { name: "Export as JSON" });
    await expect(exportBtn).toBeEnabled();

    // Delete the entry — handle the confirm dialog
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).first().click();

    // Entry should be gone
    await expect(page.getByText("No entries yet")).toBeVisible({ timeout: 5_000 });
  });
});
