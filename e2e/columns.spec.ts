import { expect, test } from "@playwright/test";

const COUNT_PATTERN = /Showing ([\d,]+) questions/;

async function waitForColumnsLoaded(page: import("@playwright/test").Page) {
  await expect(page.getByText(/Showing [1-9][\d,]* questions/)).toBeVisible({
    timeout: 15_000,
  });
}

async function getColumnCount(
  page: import("@playwright/test").Page,
): Promise<number> {
  const text = (await page.getByText(COUNT_PATTERN).first().textContent()) ?? "";
  const match = text.match(/Showing ([\d,]+) questions/);
  if (!match) return 0;
  return Number.parseInt(match[1].replaceAll(",", ""), 10);
}

function columnButtons(page: import("@playwright/test").Page) {
  return page.locator("button.w-full.text-left");
}

test.describe("Columns page load", () => {
  test("renders page header, topic list, and inspector", async ({ page }) => {
    await page.goto("/columns");
    await expect(page.getByRole("heading", { name: "Browse Topics" })).toBeVisible();
    await expect(page.locator(".app-main").getByText("Topics").first()).toBeVisible();
    await expect(page.locator(".app-main").getByText("Question Inspector").first()).toBeVisible();
  });

  test("column list shows items with metadata", async ({ page }) => {
    await page.goto("/columns");
    await waitForColumnsLoaded(page);

    const count = await getColumnCount(page);
    expect(count).toBeGreaterThan(300);

    const firstButton = columnButtons(page).first();
    await expect(firstButton).toBeVisible();
    await expect(firstButton).toContainText("Missing answers:");
    await expect(firstButton).toContainText("Answer choices:");
    await expect(firstButton).toContainText("Data notes:");
  });
});

test.describe("Search filter", () => {
  test("filters question list in real-time", async ({ page }) => {
    await page.goto("/columns");
    await waitForColumnsLoaded(page);

    const initialCount = await getColumnCount(page);
    const searchInput = page.getByPlaceholder("Type a question or keyword");
    await searchInput.fill("age");

    await expect(page).toHaveURL(/[?&]q=age/, { timeout: 10_000 });
    await expect(async () => {
      const filteredCount = await getColumnCount(page);
      expect(filteredCount).toBeGreaterThan(0);
      expect(filteredCount).toBeLessThan(initialCount);
    }).toPass({ timeout: 5_000 });
  });

  test("search updates URL with q parameter", async ({ page }) => {
    await page.goto("/columns");
    await waitForColumnsLoaded(page);

    const searchInput = page.getByPlaceholder("Type a question or keyword");
    await searchInput.fill("politics");
    await expect(page).toHaveURL(/[?&]q=politics/, { timeout: 10_000 });
  });
});

test.describe("Sort modes", () => {
  test("sort dropdown updates URL and selected option", async ({ page }) => {
    await page.goto("/columns");
    await waitForColumnsLoaded(page);

    const sortTrigger = page
      .locator("label.editorial-label", { hasText: "Sort" })
      .locator('button[role="combobox"]')
      .first();

    await sortTrigger.click();
    await page.getByRole("option", { name: "Most missing answers" }).click();

    await expect(page).toHaveURL(/[?&]sort=null_high/, { timeout: 10_000 });
    await expect(sortTrigger).toContainText("Most missing answers");
  });
});

test.describe("Tag filters", () => {
  test("checking a tag filters the list", async ({ page }) => {
    await page.goto("/columns");
    await waitForColumnsLoaded(page);

    const initialCount = await getColumnCount(page);
    await page.locator("label", { hasText: "Demographics" }).first().click();
    await expect(page).toHaveURL(/[?&]tags=demographic/, { timeout: 10_000 });

    await expect(async () => {
      const count = await getColumnCount(page);
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(initialCount);
    }).toPass({ timeout: 5_000 });
  });

  test("checking multiple tags uses union filtering", async ({ page }) => {
    await page.goto("/columns");
    await waitForColumnsLoaded(page);

    await page.locator("label", { hasText: "Demographics" }).first().click();
    await expect(page).toHaveURL(/[?&]tags=demographic/, { timeout: 10_000 });

    let demographicCount = 0;
    await expect(async () => {
      demographicCount = await getColumnCount(page);
      expect(demographicCount).toBeGreaterThan(0);
    }).toPass({ timeout: 5_000 });

    await page
      .locator("label", { hasText: "Personality (Big Five)" })
      .first()
      .click();

    await expect(page).toHaveURL(
      /[?&]tags=(demographic(%2C|,)ocean|ocean(%2C|,)demographic)/,
      { timeout: 10_000 },
    );

    await expect(async () => {
      const bothCount = await getColumnCount(page);
      expect(bothCount).toBeGreaterThanOrEqual(demographicCount);
    }).toPass({ timeout: 5_000 });
  });
});

test.describe("Column selection and inspector", () => {
  test("clicking a question shows its details in the inspector", async ({
    page,
  }) => {
    await page.goto("/columns");
    await waitForColumnsLoaded(page);

    await page.getByPlaceholder("Type a question or keyword").fill("straightness");
    await expect(async () => {
      const count = await getColumnCount(page);
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(25);
    }).toPass({ timeout: 5_000 });

    await columnButtons(page).first().click();

    const inspector = page.locator("aside.raised-panel");
    await expect(inspector.getByText("Question Inspector")).toBeVisible();
    await expect(inspector.getByText("Missing Answers", { exact: true })).toBeVisible();
    await expect(inspector.getByText("Caveats")).toBeVisible();

    await expect(page).toHaveURL(/[?&]column=/, { timeout: 10_000 });
  });

  test("inspector shows distribution data after DuckDB loads", async ({ page }) => {
    await page.goto("/columns");
    await waitForColumnsLoaded(page);

    const inspector = page.locator("aside.raised-panel");
    await expect(
      inspector.getByText("Top Values").or(inspector.getByText("Numeric Summary")),
    ).toBeVisible({ timeout: 30_000 });
  });
});

test.describe("URL state restoration", () => {
  test("query params restore search/sort/tag state", async ({ page }) => {
    await page.goto("/columns?q=age&sort=null_high&tags=demographic");
    await waitForColumnsLoaded(page);

    const searchInput = page.getByPlaceholder("Type a question or keyword");
    await expect(searchInput).toHaveValue("age");

    const sortTrigger = page
      .locator("label.editorial-label", { hasText: "Sort" })
      .locator('button[role="combobox"]')
      .first();
    await expect(sortTrigger).toContainText("Most missing answers");

    const demographicCheckbox = page
      .locator("label", { hasText: "Demographics" })
      .first()
      .locator("button[role='checkbox']");
    await expect(demographicCheckbox).toHaveAttribute("data-state", "checked");
  });

  test("column param restores selected inspector column", async ({ page }) => {
    await page.goto("/columns?column=age");
    await waitForColumnsLoaded(page);

    const inspector = page.locator("aside.raised-panel");
    await expect(inspector.getByText("Question Inspector")).toBeVisible();
    await expect(inspector.getByText("(age)")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Related columns", () => {
  test("related links navigate to relationships page", async ({ page }) => {
    await page.goto("/columns?column=age");
    await waitForColumnsLoaded(page);

    const inspector = page.locator("aside.raised-panel");
    const relatedHeader = inspector.getByText("Related Questions");
    await relatedHeader.scrollIntoViewIfNeeded();
    await expect(relatedHeader).toBeVisible();

    const relatedLinks = relatedHeader.locator("..").locator("a.editorial-button");
    expect(await relatedLinks.count()).toBeGreaterThan(0);

    await relatedLinks.first().click();
    await expect(page).toHaveURL(/\/relationships\?.*column=/);
  });
});

test.describe("Explore With section", () => {
  test("inspector shows Cross-tab and Open in SQL links", async ({ page }) => {
    await page.goto("/columns?column=age");
    await waitForColumnsLoaded(page);

    const inspector = page.locator("aside.raised-panel");
    const exploreWithHeader = inspector.getByText("Explore With");
    await exploreWithHeader.scrollIntoViewIfNeeded();
    await expect(exploreWithHeader).toBeVisible();

    await expect(inspector.locator("a", { hasText: "Cross-tab" })).toBeVisible();
    await expect(inspector.locator("a", { hasText: "Open in SQL" })).toBeVisible();
  });
});
