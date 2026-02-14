import { test, expect } from "@playwright/test";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
  { to: "/columns", label: "Browse Topics" },
  { to: "/profile", label: "Build a Profile" },
  { to: "/relationships", label: "What's Connected?" },
  { to: "/sql", label: "SQL Console" },
  { to: "/notebook", label: "Notebook" },
  { to: "/data-quality", label: "Data Quality" },
  { to: "/about", label: "About" },
] as const;

test.describe("Root navigation bar", () => {
  test("renders all nav links", async ({ page }) => {
    await page.goto("/");
    const navLinksContainer = page.locator(".nav-links--desktop");
    for (const link of navLinks) {
      await expect(navLinksContainer.getByRole("link", { name: link.label })).toBeVisible();
    }
  });

  for (const link of navLinks) {
    test(`"${link.label}" link navigates to ${link.to}`, async ({ page }) => {
      await page.goto("/about"); // start somewhere neutral
      const nav = page.locator(".nav-links--desktop");
      await nav.getByRole("link", { name: link.label }).click();
      await expect(page).toHaveURL(new RegExp(`^http://localhost:3000${link.to === "/" ? "/$" : link.to.replace("/", "\\/")}`));
    });
  }

  test("active link has nav-link-active class", async ({ page }) => {
    await page.goto("/about");
    const aboutLink = page.locator(".nav-links--desktop").getByRole("link", { name: "About" });
    await expect(aboutLink).toHaveClass(/nav-link-active/);

    // other links should NOT have active class
    const homeLink = page.locator(".nav-links--desktop").getByRole("link", { name: "Home" });
    await expect(homeLink).not.toHaveClass(/nav-link-active/);
  });

  test("active class updates on navigation", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator(".nav-links--desktop");
    await expect(nav.getByRole("link", { name: "Home" })).toHaveClass(/nav-link-active/);

    await nav.getByRole("link", { name: "Explore" }).click();
    await expect(nav.getByRole("link", { name: "Explore" })).toHaveClass(/nav-link-active/);
    await expect(nav.getByRole("link", { name: "Home" })).not.toHaveClass(/nav-link-active/);
  });

  test("mobile menu reveals links", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: /open navigation menu/i });
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toHaveAttribute("aria-controls", "mobile-nav-links");
    await expect(page.locator(".nav-links--desktop")).toBeHidden();
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
    // First "Try This" link: Explore orientation vs politics
    const tryThisLink = page.getByRole("link", { name: "Explore orientation vs politics" });
    await expect(tryThisLink).toBeVisible();
    await tryThisLink.click();
    await expect(page).toHaveURL(/\/explore\?.*x=straightness/);
    await expect(page).toHaveURL(/\/explore\?.*y=politics/);
  });

  test("second Try This link navigates to explore with gender params", async ({ page }) => {
    const link = page.getByRole("link", { name: "Compare gender and relationship style" });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/explore\?.*x=biomale/);
    await expect(page).toHaveURL(/\/explore\?.*y=/);
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
      // Wait for the nav to confirm the app shell rendered
      await expect(page.locator(".app-nav")).toBeVisible();
      // Wait for main content area
      await expect(page.locator(".app-main")).toBeVisible();

      expect(errors).toEqual([]);
    });
  }
});
