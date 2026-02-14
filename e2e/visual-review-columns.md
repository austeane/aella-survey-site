# Visual Review: Columns Page (`/columns`)

**Date**: 2026-02-12
**Viewport**: 1280x900 (desktop), 768x900 (tablet), 375x812 (mobile)
**Screenshots**: `e2e/screenshots/columns-*.png`

---

## Overall Layout & Structure

The Columns page ("Column Atlas") uses a two-column grid layout (`xl:grid-cols-[1.2fr,0.8fr]`) with the Atlas list on the left and the Column Inspector panel on the right. The inspector is sticky-positioned (`xl:sticky xl:top-4`).

**Verdict**: Layout works well at desktop. Both panels are visible simultaneously, allowing browse-and-inspect workflow. The proportions feel balanced.

---

## Design System Compliance

### Colors -- PASS

- Background is the cream `--paper` (#f5f0e8) throughout
- The inspector panel uses `--sidebar-bg` (#eae3d5) as specified for raised panels
- Text is ink-dark (`--ink`, #1a1612) for primary content
- Muted/faded text uses `--ink-faded` correctly for labels and secondary info
- The accent red (#b8432f) appears in the 3px top bar on the raised-panel inspector, the active nav link underline, and the null-ratio bars
- Tag filter borders use `--rule` correctly
- No purple, blue, neon, or off-palette colors detected
- The `null-badge--late_added` uses #8f5a2b (brown) and `null-badge--not_applicable` uses #4d5d73 (slate) -- these are muted earth-tones and do not violate the palette philosophy, though they are not formally listed in the design tokens

### Typography -- PASS

- **Page title** ("Column Atlas"): Fraunces, bold, large display size -- correct
- **Section headers** ("01 Atlas", "02 Column Inspector"): Fraunces with red section number -- correct
- **Page subtitle**: Source Serif 4, italic, muted -- correct
- **Labels** ("SEARCH COLUMNS", "SORT", "TAG FILTERS", "NUMERIC SUMMARY", "TOP VALUES"): JetBrains Mono, uppercase, small, faded -- correct `mono-label` class
- **Data values** (column names, null ratios, cardinality numbers): JetBrains Mono -- correct `mono-value` class
- **Form controls** (search input, sort dropdown): JetBrains Mono 0.8rem -- correct
- **Caveat titles**: Source Serif 4, 600 weight -- correct
- **Caveat descriptions**: Source Serif 4, `--ink-light` color -- correct
- **Caveat guidance**: Source Serif 4 italic, `--ink-faded` -- correct
- No system fonts, Inter, or sans-serif detected anywhere

### Borders & Corners -- PASS

- All elements have square corners (`rounded-none` explicitly set on Input, Checkbox, Select, SelectContent)
- No border-radius detected in any screenshot
- `editorial-panel` uses `1px solid var(--rule)` border -- correct
- `raised-panel` uses `1px solid var(--rule)` border -- correct
- Column list items separated by `1px solid var(--rule-light)` -- correct
- Tag filter checkboxes are square with `1px solid var(--rule)` border -- correct

### Shadows & Gradients -- PASS

- No box-shadows on any element
- No gradients detected
- Depth is achieved through background contrast (paper vs sidebar-bg) and borders only
- The select dropdown (sort) uses a flat panel with border, no shadow

### Raised Panel (Inspector) -- PASS

- `raised-panel` class applied to the Column Inspector `<aside>` element
- Background: `--sidebar-bg` (#eae3d5) -- warm, slightly darker than paper
- Border: `1px solid var(--rule)` -- present
- 3px red accent top bar: Implemented via `::before` pseudo-element with `border-top: 3px solid var(--accent)` -- visible in screenshots
- Sticky positioning works correctly at desktop

---

## Component-Level Review

### Navigation Bar -- PASS

- "COLUMNS" nav link has red accent color + bottom border indicating active state
- 2px ink border at bottom of nav bar
- Logo in Fraunces, subtitle in Source Serif italic, faded
- Nav links in uppercase with tracking

### Search Input -- PASS

- JetBrains Mono font at 0.8rem
- Square corners (rounded-none)
- 1px rule border, paper background
- Placeholder text in `--ink-faded`
- Label "SEARCH COLUMNS" in uppercase JetBrains Mono, faded -- `editorial-label` pattern
- Height `h-9` is visually consistent

### Sort Dropdown -- PASS

- Matches Input styling: JetBrains Mono, square corners, rule border, paper background
- Dropdown content panel: square corners, rule border, paper background, no shadow
- Dropdown items in JetBrains Mono 0.8rem
- Hover state uses `--paper-warm` background
- Check indicator for selected item

### Tag Filter Checkboxes -- PASS

- Square checkboxes (rounded-none) with rule border
- Labels in JetBrains Mono (`mono-value` class)
- Each checkbox wrapped in a border container with paper background
- Grid layout (responsive: 2-3 columns)
- "TAG FILTERS" label in `mono-label` style
- Checked state shows accent-colored border and check icon

### Column List Items -- PASS

- Column names in `mono-value` (JetBrains Mono)
- Type badges (`null-badge`): tiny uppercase JetBrains Mono, rule border, correct styling
  - "CATEGORICAL" badge in default gray
  - "GATED" badge in accent red border
  - "LATE ADDED" badge in brown border
- Null ratio displayed as text + inline-ratio bar
- Inline-ratio bar: 4px tall, rule-light background, accent fill -- correct
- Cardinality and caveat count shown in faded mono
- Selected item gets `--paper-warm` background highlight -- subtle and appropriate
- Items separated by `--rule-light` border

### Column Inspector Panel -- PASS

- Section header "02 Column Inspector" with red number -- correct
- Column display name + internal name + type badge + missingness badge all on one line
- Sample size display in tiny mono uppercase -- correct
- **Numeric columns**: DataTable with Metric/Value columns, proper editorial table styling
- **Categorical columns**: Top Values table with Value/Count/% columns
- Value labels applied correctly (showing human-readable text for coded values)
- Missingness Context section: null ratio + null meaning badge
- Caveats section: proper caveat-item styling with title/description/guidance hierarchy
- Related Columns: editorial-button links to relationships page
- Explore With: editorial-button links (Cross-tab, Open in SQL, View in Profile for demographic columns)
- All buttons: square corners, ink border, JetBrains Mono uppercase

### "Showing N columns" Counter -- PASS

- Uses `mono-value` in `--ink-faded`
- Correctly updates when search/tag filters are applied (361 full, 4 with "kink" search, fewer with "fetish" tag)

---

## Interaction Screenshots

### Search Filtering (columns-search-filtered.png) -- PASS
- Typing "kink" in search field filters list to 4 matching columns
- Counter updates to "Showing 4 columns"
- Inspector still shows the previously selected column's data
- No layout thrashing or jank apparent

### Tag Filtering (columns-tag-filtered.png) -- PASS
- Checking "fetish" tag filters list to fetish-tagged columns only
- Checkbox shows checked state with accent color
- Counter updates appropriately
- Filtered list renders correctly with all visual elements intact

### Sort Dropdown Open (columns-sort-dropdown.png) -- PASS
- Dropdown overlay has square corners
- No shadow on dropdown
- Options listed in JetBrains Mono
- Selected item ("Name (A-Z)") has check indicator
- Five sort options visible: Name, Lowest/Highest null ratio, Lowest/Highest cardinality

---

## Responsive Behavior

### Tablet (768px) -- PASS with minor note
- Two-column layout collapses to single column (below `xl` breakpoint)
- Atlas panel takes full width
- Inspector panel stacks below the atlas list
- All controls (search, sort, tags) remain usable
- Tag filters grid adjusts to 2 columns
- **Note**: At 768px, the user must scroll past the full column list to reach the inspector. This is a trade-off of single-column layout, but the sticky behavior only applies at `xl` and above, which is the correct choice.

### Mobile (375px) -- PASS with note
- Single column, everything stacks vertically
- Navigation wraps (some items may be truncated at very narrow widths but all are legible)
- Search and sort controls stack vertically
- Tag filters grid adjusts to 2 columns at `sm`, wrapping further on narrow screens
- Column list items wrap properly, badges flow to next line
- Inspector is below the fold
- **Note**: On mobile, the full-page scroll to navigate between list and inspector is expected. A mobile-specific interaction (e.g., drawer or overlay) could improve UX but is not a design system violation.

---

## Issues Found

### No Critical Issues

### Minor Observations

1. **Badge colors not in design tokens**: `null-badge--late_added` (#8f5a2b) and `null-badge--not_applicable` (#4d5d73) use colors not formally listed in the CSS variable system. While they are muted and on-brand, they should ideally be added as named tokens (e.g., `--badge-late`, `--badge-na`) for maintainability.

2. **Scroll area height calculation**: The column list `max-h-[calc(100vh-380px)]` is a magic number. If the header/filters area changes height, this could clip or leave excess space. Not a visual bug currently, but fragile.

3. **Tag filter "fetish" row**: When "fetish" is the only visible tag on a single row (the 3-column grid sometimes leaves a lone item), it has appropriate width. No visual issue, just noting the grid sometimes has uneven rows.

4. **Inspector on initial load**: The first column is auto-selected. If DuckDB is slow to load, there might be a brief moment with no inspector content. The current behavior shows the inspector header with "Select a column" until data loads, which is acceptable.

---

## Summary

| Category | Status |
|---|---|
| Color palette | PASS |
| Typography (fonts, sizes, weights) | PASS |
| Square corners (no border-radius) | PASS |
| No shadows or gradients | PASS |
| Raised panel styling | PASS |
| Form controls | PASS |
| Data display (tables, badges, bars) | PASS |
| Navigation active state | PASS |
| Search/filter interactions | PASS |
| Responsive behavior | PASS |
| **Overall** | **PASS** |

The Columns page fully adheres to the "Ink & Paper" design system. All typography, colors, borders, and component patterns match the specification. The two-column browse-and-inspect layout works well at desktop widths and degrades gracefully to single-column on narrower viewports. No design system violations found.
