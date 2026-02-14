# Visual Review: Dashboard (/) and About (/about)

**Date:** 2026-02-12
**Viewport:** 1280x900 (+ 768px and 480px responsive)
**Method:** Playwright interactive testing + source inspection
**Design spec:** `docs/design/frontend.md`
**Screenshots:** `e2e/screenshots/interactive/`

---

## Summary

Both pages faithfully implement the "Ink & Paper" design system. The editorial journal aesthetic is strong: warm cream backgrounds, ink-dark typography, Fraunces display headers, JetBrains Mono data labels, and restrained red accent. Interactive testing revealed 2 bugs, 1 functional issue, and several minor observations.

**Issues found:** 2 bugs, 1 functional issue, 4 minor observations

---

## Bugs

### BUG 1 (Medium): About Page Stat Grid — Wrong CSS Class Names

The "Dataset We Work With" stat grid uses class names `stat-value` and `stat-label`, but the CSS only defines `stat-cell-value` and `stat-cell-label`. The numbers (~15,500 / 365 / 5) and labels (Respondents / Columns / Variable Categories) render in unstyled body font (Source Serif 4, 16px, weight 400) instead of the intended Fraunces 700 2.5rem display + JetBrains Mono uppercase labels.

Computed styles confirm the bug:
- `stat-value` renders as `font-family: "Source Serif 4"`, `fontSize: 16px`, `fontWeight: 400`
- Should be: `font-family: "Fraunces"`, `fontSize: 2.2rem+`, `fontWeight: 700`

**Location:** `src/routes/about.tsx:78-87`
**Fix:** Change `stat-value` to `stat-cell-value` and `stat-label` to `stat-cell-label`
**Screenshot:** `69-about-stat-grid-detail.png` — numbers and labels run together with no visual hierarchy

### BUG 2 (Low): Nav Truncation at 768px — "NOTEBOOK" Becomes "NOTEBO"

At 768px viewport width, the nav bar wraps to a second line but the rightmost link "NOTEBOOK" is truncated to "NOTEBO" because the nav-links container has `overflow-x: auto` (from the responsive CSS at `src/styles.css:507`) but no scroll indicator. Users cannot see there is more content to scroll to.

**Location:** `src/styles.css:504-508` (responsive nav rules)
**Screenshot:** `22-responsive-768-nav.png`

---

## Functional Issue

### Explore Links Carry Stale URL Search Params

When clicking any link that navigates to `/explore` (from About page or Dashboard table links), stale search parameters persist in the URL. For example, the About page "Compare gender and relationship style" link has `href="/explore?x=gender&y=relationshipstyle"` (correct in the DOM) but after client-side navigation, the URL becomes `/explore?x=straightness&y=politics&filterColumn=...` with completely wrong values.

This happens even with a completely fresh browser context (no prior navigation history), suggesting the Explore page's component-level state initialization or TanStack Router's search param handling is overwriting the incoming URL params.

**Reproduction:**
1. Open `/about` in a fresh browser context
2. Click "Compare gender and relationship style"
3. Observe URL is `/explore?x=straightness&y=politics&filterColumn=...` instead of `?x=gender&y=relationshipstyle`

**Impact:** "Try This" links on About page don't work as intended. All Dashboard table column links that navigate to Explore also carry stale params.
**Screenshot:** `65-about-trythis-navigated-explore.png`, `67-about-navigated-gender-explore.png`

---

## Interactive Test Results

### Loading States (Dashboard)
- **PASS** — Initial page load shows content immediately (no blank flash)
- **PASS** — DuckDB initialization loads data within ~3-5 seconds
- **PASS** — Stat cards, tables, and all sections render correctly after load
- **Screenshots:** `01-loading-skeleton.png`, `02-loading-mid.png`, `03-loaded-final.png`

### Navigation Bar
- **PASS** — All 8 nav links present: About, Dashboard, Explore, Columns, Profile, Relationships, SQL, Notebook
- **PASS** — Hover state: inactive links transition from faded to ink color (0.2s ease)
- **PASS** — Active state: "DASHBOARD" in accent red with 2px bottom border
- **PASS** — Click navigation works — clicking "About" navigates to `/about`, back button returns correctly
- **PASS** — Brand link navigates to Dashboard (/)
- **Screenshots:** `04-nav-hover-about.png`, `04-nav-hover-explore.png`, `06-nav-click-about.png`

### Stat Cards
- **PASS** — Grid row with 1px solid ink outer border
- **PASS** — Internal dividers: 1px solid rule between cells
- **PASS** — Labels in JetBrains Mono uppercase, faded
- **PASS** — Values in Fraunces 700, large display
- **Screenshot:** `08-stat-cards-detail.png`

### Section Headers (01-07)
- **PASS** — All 7 headers render with correct numbering, fonts, and colors
- **PASS** — Numbers in JetBrains Mono accent red, titles in Fraunces 600
- **Screenshots:** `09-section-header-0.png` through `09-section-header-6.png`

### Data Tables
- **PASS** — Table headers: JetBrains Mono uppercase with 2px ink bottom border
- **PASS** — Row borders: 1px solid rule-light, no zebra
- **PASS** — Column name links styled in accent red with underline
- **PASS** — Hover on table rows: no visible hover effect (correct per spec — "no card hover lift effects")
- **PASS** — Link hover: underline decoration changes from rule to accent color
- **PASS** — Click on "Biomale" link navigates to Explore page (functional, though URL params are wrong per the functional issue above)
- **Screenshots:** `10-table-row-hover.png`, `12-hover-biomale-link.png`, `13-after-click-biomale.png`

### Column Inspector Combobox (Section 07)
- **PASS** — Trigger button: JetBrains Mono, square corners, rule border, paper background, chevron icon
- **PASS** — Click opens dropdown: absolutely positioned, z-50, paper background, rule border, square corners
- **PASS** — Search input inside dropdown: JetBrains Mono, placeholder "Search columns...", square corners
- **PASS** — Typing filters options in real-time (tested "age", "gender")
- **PASS** — Option items: display name in Source Serif, technical name in JetBrains Mono faded
- **PASS** — Highlighted option uses paper-warm background
- **PASS** — Selected option marked with asterisk
- **PASS** — Selecting "Gender" updates the distribution table to show gender values
- **PASS** — Escape key closes dropdown
- **PASS** — Click outside closes dropdown
- **PASS** — "No matching columns" message shown for invalid search ("zzzznothing")
- **Screenshots:** `46-inspector-dropdown-open.png`, `47-inspector-search-age.png`, `48-inspector-search-gender.png`, `49-inspector-selected-gender.png`, `55-inspector-no-results.png`

### Keyboard Navigation
- **PASS** — Tab order: brand link -> nav links (About through Notebook) -> content links
- **PASS** — Focus rings visible on all focusable elements
- **PASS** — Enter key on focused link triggers navigation
- **NOTE** — Focus ring uses browser-default blue (`rgb(0, 95, 204)` auto outline). This is technically a blue color in a "no blue" design system, but it's the standard accessibility focus indicator. Customizing it to accent red would be an enhancement, not a bug.
- **Screenshots:** `81-focus-tab1.png`, `82-focus-nav-link.png`, `84-focus-first-content.png`

### About Page — Link Interactions
- **PASS** — Aella external link: hover changes underline from rule to accent color
- **PASS** — All 5 external links have `target="_blank"` and `rel="noopener noreferrer"`
- **PASS** — "Try This" internal links navigate correctly (Explore, Relationships pages)
- **PASS** — "What This Explorer Does" links navigate to correct pages
- **PASS** — `/llms.txt` link navigates to plain text page with correct content
- **PASS** — Code blocks (MCP configs) render in JetBrains Mono on sidebar-bg background with rule border
- **Screenshots:** `62-about-aella-hover.png`, `70-about-code-block-detail.png`, `80-llmstxt-page.png`

### About Page — Keyboard
- **PASS** — Tab navigates through all interactive elements
- **PASS** — Focus visible on links
- **Screenshots:** `72-about-tab-focus.png`, `73-about-tab-focus-deeper.png`

### Responsive — 768px
- **PASS** — Nav wraps to second line
- **PASS** — Brand title and subtitle remain readable
- **PASS** — Stat cards: font-size reduces to 1.75rem (responsive CSS rule)
- **PASS** — Tables remain readable, no horizontal overflow issues
- **PASS** — Column Inspector combobox and distribution table fit within viewport
- **PASS** — Two-column layout sections stack to single column
- **BUG** — Nav "NOTEBOOK" truncated (see Bug 2 above)
- **Screenshots:** `20-responsive-768-top.png`, `21-responsive-768-full.png`, `22-responsive-768-nav.png`

### Responsive — 480px
- **PASS** — Nav fully wraps, links remain individually readable
- **PASS** — Stat cards stack vertically (grid-cols-1)
- **PASS** — Page title reduces to 2.1rem
- **PASS** — Tables narrow but remain readable
- **PASS** — About page reads well at narrow width
- **NOTE** — At 480px, some nav links ("RELATIONSHIPS", "PROFILE") are cut off at the right edge similarly to the 768px issue. The `overflow-x: auto` allows scrolling but there's no visual indicator.
- **Screenshots:** `26-responsive-480-top.png`, `27-responsive-480-full.png`, `78-about-responsive-480-top.png`, `79-about-responsive-480-full.png`

---

## Minor Observations

### 1. Stat Cell Value Size (Dashboard)
CSS `.stat-cell-value` uses `font-size: 2.2rem`, spec says `2.5rem`. Subtle visual difference.
**File:** `src/styles.css:242`

### 2. `not_applicable` Badge Color (#4d5d73)
Uses blue-gray outside the approved palette. Serves a data-semantic purpose but technically violates "no blue."
**Files:** `src/styles.css:440-441`, `src/components/ui/badge.tsx:14`

### 3. Browser Default Focus Ring Color
Focus outlines use `rgb(0, 95, 204)` (browser default blue). Consider customizing to `var(--accent)` or `var(--ink)` for design consistency while maintaining accessibility.

### 4. No Loading Skeleton Visible
The initial page load at 500ms (screenshot `01-loading-skeleton.png`) already shows rendered content. Either loading is very fast or the skeleton transitions are sub-500ms. Not necessarily a problem, but the loading skeleton couldn't be verified visually.

---

## Design System Compliance Matrix

| Requirement | Dashboard | About |
|---|---|---|
| Cream paper background (#f5f0e8) | PASS | PASS |
| Ink text (#1a1612) | PASS | PASS |
| Red accent (#b8432f) only | PASS | PASS |
| Fraunces for display/headers | PASS | PASS |
| Source Serif 4 for body | PASS | PASS |
| JetBrains Mono for data/labels | PASS | PASS |
| No border-radius (square corners) | PASS | PASS |
| No gradients | PASS | PASS |
| No box-shadows | PASS | PASS |
| No dark mode | PASS | PASS |
| 2px ink nav bottom border | PASS | PASS |
| Active nav link in accent red | PASS | PASS |
| Section headers numbered in accent | PASS | PASS |
| Table headers: JetBrains uppercase, 2px ink | PASS | N/A |
| Table rows: 1px rule-light, no zebra | PASS | N/A |
| Raised panels: sidebar-bg, rule, 3px accent top | PASS | N/A |
| Max-width centering | PASS (1200px) | PASS (780px) |
| Paper noise texture overlay | PASS | PASS |
| fadeUp entrance animation | PASS | PASS |
| Nav hover transitions | PASS | PASS |
| Combobox: square, JetBrains, rule border | PASS | N/A |
| External links: target blank, noopener | N/A | PASS |
| Responsive nav wrapping | PARTIAL | PARTIAL |

---

## Action Items (Priority Order)

1. **BUG FIX (Medium):** In `src/routes/about.tsx:78-87`, change `stat-value` to `stat-cell-value` and `stat-label` to `stat-cell-label` to fix the unstyled dataset stats.

2. **BUG FIX (Medium — Functional):** Investigate why Explore page client-side navigation overwrites incoming URL search params. Links with explicit `search={{ x: "gender", y: "relationshipstyle" }}` render correct `href` in the DOM but navigation produces wrong params. Likely in the Explore route's `validateSearch` or component initialization logic.

3. **BUG FIX (Low):** At 768px, the nav "NOTEBOOK" link is truncated. Consider adding a scroll indicator, reducing nav link padding at this breakpoint, or abbreviating link text.

4. **OPTIONAL:** Increase `.stat-cell-value` font-size from 2.2rem to 2.5rem in `src/styles.css:242` to match spec.

5. **OPTIONAL:** Customize focus ring to use `var(--accent)` or `var(--ink)` instead of browser default blue.

6. **OPTIONAL:** Consider replacing `#4d5d73` (blue-gray) badge color with a warm-toned alternative.
