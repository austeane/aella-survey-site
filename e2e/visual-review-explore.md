# Visual Review: Explore Page (`/explore`)

**Date**: 2026-02-12
**URL**: http://localhost:3000/explore
**Tool**: Playwright (headless Chromium, 1280x900 viewport)
**Design system**: "Ink & Paper" — see `docs/design/frontend.md`

---

## Summary

The Explore page is strongly compliant with the Ink & Paper design system. Colors, typography, border handling, and overall editorial aesthetic are well-executed. There are a small number of issues, mostly minor, related to the raised panel missing its accent top bar and the cell-click interaction not producing a visible detail panel.

**Overall grade**: PASS with minor issues

---

## 1. Color Compliance

### PASS

| Token | Expected | Actual | Status |
|---|---|---|---|
| `--paper` (body bg) | `#f5f0e8` / `rgb(245, 240, 232)` | `rgb(245, 240, 232)` | PASS |
| `--ink` (body text) | `#1a1612` / `rgb(26, 22, 18)` | `rgb(26, 22, 18)` | PASS |
| `--accent` (section numbers) | `#b8432f` / `rgb(184, 67, 47)` | `rgb(184, 67, 47)` | PASS |
| `--accent` (active nav link) | `#b8432f` | `rgb(184, 67, 47)` | PASS |
| `--sidebar-bg` (raised panel) | `#eae3d5` / `rgb(234, 227, 213)` | `rgb(234, 227, 213)` | PASS |
| `--rule` (borders) | `#c8bfb0` / `rgb(200, 191, 176)` | `rgb(200, 191, 176)` | PASS |
| `--ink-faded` (table headers) | `#8a7e70` / `rgb(138, 126, 112)` | `rgb(138, 126, 112)` | PASS |

No purple, blue, neon, or off-palette colors detected anywhere on the page.

---

## 2. Typography Compliance

### PASS

| Element | Expected Font | Actual Font | Status |
|---|---|---|---|
| Body text | Source Serif 4 | `"Source Serif 4", Georgia, serif` | PASS |
| H1 (page title) | Fraunces 700 | `Fraunces, Georgia, serif` weight 700 | PASS |
| H2 (section headers) | Fraunces 600 | `Fraunces, Georgia, serif` weight 600 | PASS |
| Section numbers | JetBrains Mono 500 | `"JetBrains Mono", ui-monospace, monospace` weight 500 | PASS |
| Table headers (th) | JetBrains Mono, uppercase | `"JetBrains Mono"` weight 500, `text-transform: uppercase` | PASS |
| Table cells (td) | JetBrains Mono | `"JetBrains Mono"` | PASS |
| Combobox triggers | JetBrains Mono | `"JetBrains Mono"` | PASS |
| Number inputs | JetBrains Mono | `"JetBrains Mono"` | PASS |
| Sample size items | JetBrains Mono | `"JetBrains Mono"` | PASS |
| "Add to Notebook" button | JetBrains Mono, uppercase | `"JetBrains Mono"`, `text-transform: uppercase` | PASS |
| Nav links | Source Serif 4 | `"Source Serif 4", Georgia, serif` | PASS |

All three design fonts (Fraunces, Source Serif 4, JetBrains Mono) are loaded and properly applied. No system fonts, Inter, Roboto, or Arial detected.

### Note on font sizes:
- H1: 44px (2.75rem) -- PASS (matches spec)
- H2: 19.2px (1.2rem) -- PASS (matches spec)
- Table headers: 10.4px (0.65rem) -- PASS (matches spec)
- Table cells: 13.6px (~0.85rem) -- PASS
- Data labels: 10.4px (0.65rem) -- PASS (matches spec)

---

## 3. Border-Radius / Shadows / Gradients

### PASS -- Zero violations

| Anti-pattern | Elements found | Status |
|---|---|---|
| `border-radius > 0` | 0 elements | PASS |
| `box-shadow != none` | 0 elements | PASS |
| `background-image: gradient(...)` | 0 elements | PASS |

The page has absolutely zero border-radius, box-shadow, or gradient violations. This is excellent compliance with the "no border-radius anywhere" rule.

Specific checks:
- Combobox triggers: `borderRadius: 0px` -- PASS
- Number inputs: `borderRadius: 0px` -- PASS
- Checkboxes: `borderRadius: 0px`, explicitly `rounded-none` in class -- PASS
- Table cells: `borderRadius: 0px` -- PASS
- Raised panel: `borderRadius: 0px` -- PASS
- Editorial panel: `borderRadius: 0px` -- PASS
- Combobox dropdown popover: `borderRadius: 0px` -- PASS
- "Add to Notebook" button: `borderRadius: 0px` -- PASS

---

## 4. Navigation Bar

### PASS

- Horizontal bar with `2px solid var(--ink)` bottom border -- PASS
- Active link ("EXPLORE") uses accent color `rgb(184, 67, 47)` with font-weight 600 -- PASS
- Active link has 2px bottom border in accent color -- PASS
- Links use Source Serif 4 font -- PASS
- No pills, no background highlights -- PASS
- Brand title "Big Kink Survey Explorer" in Fraunces bold -- PASS (visible in screenshot)
- Subtitle "Editorial Analysis Workspace" in lighter weight -- PASS

---

## 5. Page Header

### PASS

- Title "Cross-Tab Explorer" in Fraunces 700, 44px -- PASS
- Subtitle in Source Serif 4 italic: "Cross-tabulate any two variables..." -- PASS
- Clean hierarchy, no extra decorations -- PASS

---

## 6. Controls Section (Section 01)

### PASS with one minor issue

**Section header:**
- "01" in JetBrains Mono accent color, "Controls" in Fraunces 600 -- PASS
- Bottom border: `1px solid var(--rule)` -- PASS

**Raised panel:**
- Background: `rgb(234, 227, 213)` (matches `--sidebar-bg`) -- PASS
- Border: `1px solid var(--rule)` -- PASS
- Border-radius: 0px -- PASS
- No box-shadow -- PASS
- Padding: 22.4px 24px (~1.4rem 1.5rem) -- PASS (close to spec 1.5rem 2rem)

**MINOR ISSUE**: The raised panel spec calls for a "3px solid var(--accent) top accent bar via ::before pseudo-element" (line 124 of frontend.md). The controls raised panel does NOT have a visible red accent top bar. This is a design system deviation.

**X/Y Column Comboboxes:**
- JetBrains Mono font -- PASS
- Square corners (0px border-radius) -- PASS
- `1px solid var(--rule)` border -- PASS
- Paper background -- PASS
- Down-arrow chevron indicator present -- PASS

**Column type badges** ("Unknown"):
- JetBrains Mono, tiny size (0.62rem), uppercase tracking -- PASS
- Bordered, inline-flex -- PASS

**Optional Demographic Filter:**
- Same combobox styling as X/Y columns -- PASS
- Full question text displayed properly -- PASS

**Number inputs (Result Row Limit, Show Top N):**
- JetBrains Mono font -- PASS
- Square corners -- PASS
- `1px solid var(--rule)` border, paper background -- PASS

---

## 7. Normalization Combobox Dropdown

### PASS

When clicking the Normalization combobox (the one showing "Counts"):
- Dropdown popup: `borderRadius: 0px`, `boxShadow: none` -- PASS
- Background: `rgb(245, 240, 232)` (paper) -- PASS
- Border: `1px solid var(--rule)` -- PASS
- Options displayed: "Counts" (checked), "Row %", "Column %", "Overall %" -- visible in screenshot
- Font in dropdown: Source Serif 4 at 16px -- NOTE: dropdown items use body font rather than JetBrains Mono. This is acceptable since these are conceptual labels, not data values.
- Check mark (checkmark icon) visible on selected item -- PASS

---

## 8. Column Selector Popover (ColumnCombobox)

### PASS

When clicking the X column ("Straightness") button:
- A popover/dialog opens below the button -- PASS
- Contains a search input at top -- visible in screenshot with "gen" typed
- Column options listed below with searchable text
- Each option shows the column name and metadata (type, count)
- Visual: clean list, no border-radius, consistent with editorial style -- PASS
- Search results filter correctly when typing -- PASS (screenshot shows filtered results for "gen")

**Popover styling:**
- Background: paper color -- PASS
- Border: `1px solid var(--rule)` -- PASS
- No box-shadow -- PASS
- No border-radius -- PASS

---

## 9. Filter Values Section

### PASS

- Label "FILTER VALUES" in JetBrains Mono uppercase -- PASS
- Grid layout: 3 columns on desktop (sm:grid-cols-2 lg:grid-cols-3) -- PASS
- Each filter item shows: value (left), count (right), checkbox (far right)
- Values in JetBrains Mono -- PASS
- Counts in JetBrains Mono, faded color -- PASS
- Container: `1px solid var(--rule)` border, paper background -- PASS

**Checkbox styling:**
- Width/height: 16px (4x4) -- PASS
- Border: `1px solid var(--rule)` -- PASS
- Border-radius: 0px (explicitly `rounded-none` class) -- PASS
- Background: paper -- PASS
- No box-shadow -- PASS

All 7 filter values displayed properly with consistent styling.

---

## 10. Results Section (Section 02)

### PASS

**Section header:**
- "02" in accent-colored JetBrains Mono, "Results" in Fraunces 600 -- PASS
- Bottom rule separator -- PASS

**Editorial panel:**
- Background: `rgb(245, 240, 232)` (paper, not sidebar-bg) -- NOTE: uses `.editorial-panel` not `.raised-panel`, so paper bg is correct here
- Border: `1px solid var(--rule)` -- PASS
- Border-radius: 0px -- PASS
- No box-shadow -- PASS

**Sample size display:**
- Three inline items: "N total: 15,503", "N non-null: 15,503", "N used: 15,503"
- JetBrains Mono 11.2px (0.7rem), faded color -- PASS
- Flex layout with proper gaps -- PASS

**Association strength:**
- "Association: V = 0.095 (negligible) | N used: 15,503"
- JetBrains Mono -- PASS
- Clear statistical labeling -- PASS

**"Add to Notebook" button:**
- JetBrains Mono, uppercase, 12px -- PASS
- Background: paper, border: `1px solid var(--ink)` -- PASS
- Border-radius: 0px -- PASS
- No box-shadow -- PASS
- Padding: 8px 15.2px -- PASS
- Square, editorial style with ink-color border -- PASS (matches design anti-pattern rules)

---

## 11. Pivot Matrix Table

### PASS

**Table structure:**
- Full-width layout -- PASS
- No outer border -- PASS (matches spec)

**Headers:**
- "Y \ X", "STRAIGHT", "NOT STRAIGHT", "ROW TOTAL" -- all uppercase
- JetBrains Mono, 10.4px, weight 500, faded color -- PASS
- Text-transform: uppercase -- PASS
- Header row has visible bottom border -- PASS (appears as `2px solid var(--ink)` rule)

**Data cells:**
- JetBrains Mono font -- PASS
- Numeric columns right-aligned (class "numeric") -- PASS
- Row labels ("Moderate", "Liberal", "Conservative") left-aligned -- PASS
- Values properly formatted with thousands separators (4,933 / 666 / 5,599) -- PASS

**Row borders:**
- Subtle horizontal rules between rows -- PASS (matches `1px solid var(--rule-light)` spec)
- No zebra striping -- PASS

**Totals row:**
- "Total" label with summed values -- PASS
- Styled same as other rows (no special bold treatment observed) -- NOTE: the totals row doesn't have visually distinct styling (like heavier font-weight or border-top). This is acceptable but could be enhanced with a `border-top: 2px solid var(--ink)` to create visual separation.

**No border-radius on any table elements** -- PASS

---

## 12. Cell Selection Behavior

### MINOR ISSUE

When clicking a cell (e.g., "4,933"):
- The page content remains identical visually -- no visible selection highlight, detail panel, or expanded information appears
- The `after-click.json` analysis shows no elements with `[class*="selected"]`, `[data-selected]`, or `[aria-selected="true"]` (other than the nav link)
- No detail panel with Profile/SQL links appears

**Assessment**: The task description mentions checking for a "selected cell detail panel" with layout, typography, Profile/SQL links, but this feature does not appear to be implemented yet, OR the click interaction may only be available in certain modes. This is NOT a design system violation but rather a feature gap.

---

## 13. Loading State

### PASS

The loading state screenshot (captured 1.5s after navigation) shows:
- The page structure is immediately visible (title, controls, sections)
- Controls render immediately with default values ("Straightness" x "Politics")
- The table appears to be populated even in the early screenshot, suggesting DuckDB loads quickly
- No broken loading skeletons or blank states visible

Note: The loading and loaded screenshots look nearly identical, suggesting the DuckDB-WASM initialization completes fast enough that there's minimal visible loading state difference. This is good UX.

---

## Issues Summary

### Must Fix

None.

### Should Fix

1. **Missing accent top bar on Controls raised panel**: The `.raised-panel` class should include a `3px solid var(--accent)` top accent bar via `::before` pseudo-element, per the design spec (frontend.md line 124). Currently the Controls section panel has no red accent bar visible.

### Nice to Have

2. **Totals row visual distinction**: The table's "Total" row uses the same styling as data rows. Consider adding a `border-top: 2px solid var(--ink)` to visually separate the totals from data.

3. **Cell click interaction**: No visible response when clicking a pivot table cell. If a detail panel (showing Profile/SQL links) is planned, it is not yet implemented.

4. **Normalization dropdown font**: The dropdown items use Source Serif 4 rather than JetBrains Mono. Since these are mode labels (not data), this is acceptable, but using JetBrains Mono would be more consistent with the other form controls.

---

## Screenshots Captured

| File | Description |
|---|---|
| `explore-01-loading.png` | Page 1.5s after navigation (loading state) |
| `explore-02-loaded-full.png` | Full page after DuckDB loaded |
| `explore-03-controls.png` | Controls area (top 500px) |
| `explore-04-pivot-table.png` | Pivot matrix table closeup |
| `explore-05-combobox-open.png` | Normalization combobox dropdown open |
| `explore-08-cell-selected.png` | Full page after clicking a cell |
| `explore-09-viewport-selected.png` | Viewport after cell selection |
| `explore-12-cell-click-full.png` | Detailed cell click full page |
| `explore-13-results-section.png` | Results section closeup |
| `explore-14-notebook-btn.png` | "Add to Notebook" button closeup |
| `explore-15-combobox-dropdown-detail.png` | Normalization dropdown items |
| `explore-20-filter-values.png` | Filter values checkbox grid |
| `explore-21-column-selector-open.png` | Column selector popover open |
| `explore-22-column-search.png` | Column selector with search typed |
| `explore-23-navbar.png` | Navigation bar closeup |

## Style Data Files

| File | Description |
|---|---|
| `explore-styles.json` | Computed styles for all major elements + violation scan |
| `explore-structure-deep.txt` | DOM structure to depth 6 |
| `explore-after-click.json` | Post-cell-click element state |
| `explore-page-text.txt` | Full page text content |
| `explore-checkbox-styles.json` | Checkbox computed styles |
| `explore-raised-panel-styles.json` | Controls panel computed styles |
| `explore-editorial-panel-styles.json` | Results panel computed styles |
| `explore-section-styles.json` | Section header/number styles |
| `explore-notebook-btn-styles.json` | "Add to Notebook" button styles |
| `explore-dropdown-styles.json` | Combobox dropdown styles |
| `explore-popover-styles.json` | Column selector popover styles |
