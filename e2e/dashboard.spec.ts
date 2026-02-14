import { expect, test } from "@playwright/test";

const DATA_TIMEOUT = 30_000;

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "The Big Kink Survey" }),
    ).toBeVisible();
  });

  test("renders hero and section headers", async ({ page }) => {
    await expect(
      page.getByText("What 15,000 people revealed about desire"),
    ).toBeVisible();
    await expect(page.getByText("Based on 15,503 anonymized survey responses.")).toBeVisible();

    await expect(page.getByText("What the data shows")).toBeVisible();
    await expect(page.getByText("Build your own chart")).toBeVisible();
    await expect(page.getByText("Questions you can explore")).toBeVisible();
    await expect(page.getByText("About the Data")).toBeVisible();
  });

  test("featured findings area loads tabs and sample size", async ({ page }) => {
    const tabs = page.getByRole("tab");
    await expect(tabs.first()).toBeVisible({ timeout: DATA_TIMEOUT });
    expect(await tabs.count()).toBeGreaterThan(3);

    await expect(page.locator("#featured-chart-heading")).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    await expect(page.getByText(/Sample size: N =/)).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
  });

  test("switching finding updates URL and selected tab", async ({ page }) => {
    await expect(page.getByRole("tab").first()).toBeVisible({ timeout: DATA_TIMEOUT });

    const before = page.url();
    const nextTab = page.locator('[role="tab"][aria-selected="false"]').first();
    await nextTab.click();

    await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);
    await expect(page).toHaveURL(/\/\?chart=/);
    expect(page.url()).not.toBe(before);
  });

  test("featured explore link includes x/y params", async ({ page }) => {
    const exploreFurther = page.getByRole("link", { name: "Explore this further" });
    await expect(exploreFurther).toBeVisible({ timeout: DATA_TIMEOUT });

    const href = await exploreFurther.getAttribute("href");
    expect(href).toContain("/explore");
    expect(href).toContain("x=");
    expect(href).toContain("y=");
  });

  test("build-your-own section exposes controls and deep-link", async ({
    page,
  }) => {
    await expect(page.getByText("Build your own chart")).toBeVisible();
    await expect(
      page.locator("label.editorial-label", { hasText: "X question" }),
    ).toBeVisible();
    await expect(
      page.locator("label.editorial-label", { hasText: "Y question" }),
    ).toBeVisible();
    await expect(
      page.locator("label.editorial-label", { hasText: "Chart type" }),
    ).toBeVisible();

    const openLink = page.getByRole("link", { name: "Open this in Explore" });
    await expect(openLink).toBeVisible({ timeout: DATA_TIMEOUT });
    await expect(openLink).toHaveAttribute("href", /\/explore\?x=.*&y=.*/);
  });

  test("question cards include promoted items and links", async ({ page }) => {
    await expect(page.getByText("Questions you can explore")).toBeVisible();
    await expect(page.getByText("Popular")).toHaveCount(2);
    await expect(page.getByRole("link", { name: "Open chart" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Open page" }).first()).toBeVisible();
  });
});
