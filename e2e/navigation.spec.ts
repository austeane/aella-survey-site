import { test, expect, type Page } from "@playwright/test";

const desktopTopLinks = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/sql", label: "SQL Console" },
  { to: "/notebook", label: "Notebook" },
  { to: "/about", label: "About" },
] as const;

const exploreDropdownLinks = [
  { to: "/explore/crosstab", label: "Compare Questions" },
  { to: "/columns", label: "Browse Topics" },
  { to: "/profile", label: "Build a Profile" },
  { to: "/relationships", label: "What's Connected?" },
  { to: "/data-quality", label: "Data Quality" },
] as const;

function pathRegex(path: string): RegExp {
  if (path === "/") return /^http:\/\/localhost:3000\/$/;
  return new RegExp(`^http://localhost:3000${path.replace(/\//g, "\\/")}`);
}

async function openMobileMenu(page: Page) {
  const menuButton = page.locator(".nav-toggle");
  await expect(menuButton).toBeVisible();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const expanded = await menuButton.getAttribute("aria-expanded");
    if (expanded === "true") return;

    await menuButton.click();
    await page.waitForTimeout(120);
  }

  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
}

test.describe("Root navigation bar", () => {
  test("renders top-level links and Explore dropdown links", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator(".nav-links--desktop");

    for (const link of desktopTopLinks) {
      await expect(nav.getByRole("link", { name: link.label })).toBeVisible();
    }

    const compareQuestions = nav.getByRole("link", { name: "Compare Questions" });
    await expect(compareQuestions).not.toBeVisible();

    await nav.getByRole("link", { name: "Explore" }).hover();

    for (const link of exploreDropdownLinks) {
      await expect(nav.getByRole("link", { name: link.label })).toBeVisible();
    }
  });

  for (const link of desktopTopLinks) {
    test(`top-level \"${link.label}\" navigates to ${link.to}`, async ({ page }) => {
      await page.goto("/about");
      const nav = page.locator(".nav-links--desktop");
      await nav.getByRole("link", { name: link.label }).click();
      await expect(page).toHaveURL(pathRegex(link.to));
    });
  }

  for (const link of exploreDropdownLinks) {
    test(`Explore dropdown \"${link.label}\" navigates to ${link.to}`, async ({ page }) => {
      await page.goto("/about");
      const nav = page.locator(".nav-links--desktop");
      await nav.getByRole("link", { name: "Explore" }).hover();
      await nav.getByRole("link", { name: link.label }).click();
      await expect(page).toHaveURL(pathRegex(link.to));
    });
  }

  test("Explore top-level link is active across grouped routes", async ({ page }) => {
    const groupedRoutes = [
      "/explore",
      "/explore/crosstab",
      "/columns",
      "/profile",
      "/relationships",
      "/data-quality",
    ];

    for (const route of groupedRoutes) {
      await page.goto(route);
      const exploreLink = page.locator(".nav-links--desktop").getByRole("link", { name: "Explore" });
      await expect(exploreLink).toHaveClass(/nav-link-active/);
    }

    await page.goto("/about");
    const nav = page.locator(".nav-links--desktop");
    await expect(nav.getByRole("link", { name: "About" })).toHaveClass(/nav-link-active/);
    await expect(nav.getByRole("link", { name: "Explore" })).not.toHaveClass(/nav-link-active/);
  });

  test("mobile menu supports Explore expansion and closes after navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await openMobileMenu(page);

    const mobileMenu = page.locator("#mobile-nav-links");
    const exploreToggle = mobileMenu.getByRole("button", { name: /explore/i });

    await expect(exploreToggle).toHaveAttribute("aria-expanded", "false");
    await exploreToggle.click();
    await expect(exploreToggle).toHaveAttribute("aria-expanded", "true");

    const compareQuestionsLink = mobileMenu.getByRole("link", { name: "Compare Questions" });
    await expect(compareQuestionsLink).toBeVisible();
    await compareQuestionsLink.click();

    await expect(page).toHaveURL(pathRegex("/explore/crosstab"));
    await expect(page.locator(".nav-toggle")).toHaveAttribute("aria-expanded", "false");
  });

  test("mobile menu closes on Escape and resets Explore group state", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");

    await openMobileMenu(page);

    const mobileMenu = page.locator("#mobile-nav-links");
    const exploreToggle = mobileMenu.getByRole("button", { name: /explore/i });
    await exploreToggle.click();
    await expect(exploreToggle).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Escape");
    await expect(page.locator(".nav-toggle")).toHaveAttribute("aria-expanded", "false");

    await openMobileMenu(page);
    await expect(mobileMenu.getByRole("button", { name: /explore/i })).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("Brand link", () => {
  test("renders title and subtitle", async ({ page }) => {
    await page.goto("/");
    const brand = page.locator(".brand-link");
    await expect(brand.locator(".brand-title")).toHaveText("Big Kink Survey Explorer");
    await expect(brand.locator(".brand-subtitle")).toHaveText("Question-First Research Explorer");
  });

  test("clicking brand navigates home", async ({ page }) => {
    await page.goto("/about");
    await page.locator(".brand-link").click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("About page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/about");
  });

  test("loads with correct title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "About This Project" })).toBeVisible();
  });

  test("shows all numbered sections", async ({ page }) => {
    const expectedSections = [
      "The Survey",
      "The Dataset We Work With",
      "What This Explorer Does",
      "Try This",
      "Caveats & Interpretation",
      "Credits & Links",
      "For AI Agents",
    ];
    for (const section of expectedSections) {
      await expect(page.getByText(section, { exact: false }).first()).toBeVisible();
    }
  });

  test("shows dataset stats", async ({ page }) => {
    await expect(page.getByText("~15,500")).toBeVisible();
    await expect(page.getByText("365", { exact: true })).toBeVisible();
  });

  test('"Try This" example links navigate correctly', async ({ page }) => {
    const tryThisLink = page.getByRole("link", { name: "Explore orientation vs politics" });
    await expect(tryThisLink).toBeVisible();
    await tryThisLink.click();
    await expect(page).toHaveURL(/\/explore\/crosstab\?.*x=straightness/);
    await expect(page).toHaveURL(/\/explore\/crosstab\?.*y=politics/);
  });

  test("second Try This link navigates to explore with gender params", async ({ page }) => {
    const link = page.getByRole("link", { name: "Compare gender and relationship style" });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/explore\/crosstab\?.*x=biomale/);
    await expect(page).toHaveURL(/\/explore\/crosstab\?.*y=/);
  });

  test("third Try This link navigates to relationships", async ({ page }) => {
    const link = page.getByRole("link", { name: "Jump to strongest associations for straightness" });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/relationships\?.*column=straightness/);
  });
});

test.describe("Page load smoke tests", () => {
  const pages = [
    { path: "/", name: "Home" },
    { path: "/about", name: "About" },
    { path: "/explore", name: "Explore" },
    { path: "/explore/crosstab", name: "Compare Questions" },
    { path: "/columns", name: "Browse Topics" },
    { path: "/profile", name: "Build a Profile" },
    { path: "/relationships", name: "What's Connected?" },
    { path: "/sql", name: "SQL Console" },
    { path: "/notebook", name: "Notebook" },
    { path: "/data-quality", name: "Data Quality" },
  ];

  for (const pg of pages) {
    test(`${pg.name} (${pg.path}) loads without JS errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      await page.goto(pg.path);
      await expect(page.locator(".app-nav")).toBeVisible();
      await expect(page.locator(".app-main")).toBeVisible();

      expect(errors).toEqual([]);
    });
  }
});
