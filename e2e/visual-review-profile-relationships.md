# Visual Review: Profile & Relationships Pages

**Reviewer**: reviewer-profile (automated Playwright + visual inspection)
**Date**: 2026-02-12
**Pages**: `/profile`, `/relationships`
**Design system reference**: `docs/design/frontend.md` ("Ink & Paper")

---

## Profile Page (`/profile`)

### Screenshots captured
- `profile-01-initial.png` — Initial page with Single Cohort mode, pre-filled demographic columns
- `profile-02-compare-mode.png` — Compare Cohorts mode toggle active, two cohort panels visible
- `profile-03-combobox-open.png` — ColumnCombobox dropdown open with value list
- `profile-04-with-selection.png` — After navigating with URL params (column + value selected)
- `profile-04b-value-dropdown.png` — Value Select dropdown open showing options
- `profile-05-results-top.png` — Full results page (stat cards + percentile metrics + over-indexing table)
- `profile-06-results-stats.png` through `profile-08-results-bottom.png` — Scrolled views of results
- `profile-09-compare-empty.png` — Compare mode with empty cohort panels

### Findings

#### PASS: Page Title & Subtitle Typography
- "Profile Builder" uses Fraunces 700 at large display size — correct
- Subtitle text is Source Serif 4 italic in muted ink-light — matches spec
- No emoji or icons in headers

#### PASS: Mode Toggle Buttons (Single Cohort / Compare Cohorts)
- Buttons are square-cornered — no border-radius visible
- Active state uses `bg-[var(--ink)]` with `text-[var(--paper)]` (dark fill, light text) — correct
- Inactive state uses `bg-[var(--paper)]` with `text-[var(--ink)]` — correct
- Font is JetBrains Mono, uppercase, small tracking — matches spec for form controls
- Buttons share a common border container (`border border-[var(--rule)]`) with internal divider — clean editorial look
- Toggle group has `width: fit-content` — does not stretch full-width, which is appropriate

#### PASS: Raised Panel (Profile Inputs section)
- Background is `var(--sidebar-bg)` (#eae3d5) — the warm tan color is visible and correct
- Top accent bar: 3px solid red accent visible at the top of the panel
- Border: 1px solid rule color — visible around the panel
- SectionHeader "01 Profile Inputs" uses numbered section format — correct

#### PASS: Filter Slot Cards
- Three-column grid layout for Field 1, Field 2, Field 3
- Each slot has `border border-[var(--rule)] bg-[var(--paper)]` — light cream background with rule border
- Labels ("Field 1", "Value") in JetBrains Mono uppercase — correct editorial-label styling
- Square corners on all slot cards — no border-radius

#### PASS: ColumnCombobox Dropdown
- Dropdown opens with a list of values — no border-radius on the popover
- Text in JetBrains Mono — correct for data/form controls
- Items are clearly readable against paper background

#### PASS: Value Select Dropdown
- Opens cleanly with "None" as first option followed by data values
- No border-radius on dropdown container — square corners confirmed
- Font is JetBrains Mono — correct

#### PASS: Build Profile Button
- Uses the `Button` component with `variant="default"`
- JetBrains Mono, uppercase, small tracking — correct
- `rounded-none` explicitly set in button component — square corners confirmed
- Border uses `var(--ink)` — correct
- Disabled state shows reduced opacity (0.55) — correct behavior
- Active state: `bg-[var(--paper)]` text `var(--ink)` with ink border — matches editorial button style

#### PASS: Stat Cards (People-Like-You Summary)
- Four-column grid: Dataset Size, Cohort Size, Cohort Share, Cohort Rarity
- Large numbers (15,503 / 3,970 / 25.61% / 74.39%) rendered in Fraunces at ~2.2rem — correct
- Label text in JetBrains Mono, 0.65rem, uppercase, faded — matches spec exactly
- Notes (e.g., "N = 3,970", "100% minus cohort share") in italic, faded — correct
- Grid has `1px solid var(--ink)` outer border — correct
- Internal dividers with `1px solid var(--rule)` — correct
- No border-radius on stat cards — square corners

#### PASS: Percentile Metrics Table (Section 03)
- Uses DataTable component wrapping editorial-table styles
- Header row: JetBrains Mono, uppercase, faded, with 2px solid ink bottom border — correct
- Metric names displayed in first column — JetBrains Mono
- Numeric values right-aligned in JetBrains Mono — correct
- Row borders: 1px solid rule-light — correct
- No zebra striping — correct
- Section is inside a raised-panel with accent top bar — correct

#### PASS: Over-Indexing Signals Table (Section 04)
- Table shows Column, Value, Lift, Cohort % (N), Global % (N) columns
- All numeric data in JetBrains Mono — correct
- Lift values formatted as "Nx" — clean presentation
- Column names display human-readable display names — correct
- Values show formatted labels (e.g., "1.8 — Strongly disagree") — good UX
- No border-radius on table cells

#### PASS: "Add to Notebook" Button
- Uses `editorial-button` class — JetBrains Mono, uppercase, small tracking
- `border: 1px solid var(--ink)` with paper background — correct
- Positioned in flex layout with SectionHeader — proper alignment

#### PASS: Compare Mode Layout
- Two-column grid with Cohort A and Cohort B panels
- Each panel has `border border-[var(--rule)]` and proper padding
- "COHORT A" / "COHORT B" labels in mono-label style — JetBrains Mono, uppercase, small tracking
- Each cohort contains its own 3-slot filter grid — correct nested layout
- Compare button replaces Build Profile button — correct behavior

#### PASS: Section Numbering
- "01 Profile Inputs", "02 People-Like-You Summary", "03 Percentile Metrics", "04 Top Over-Indexing Signals"
- Section numbers in accent color — red (#b8432f)
- Fraunces 600 for section titles — correct

#### PASS: Navigation Bar
- "PROFILE" link highlighted in accent color with bottom border — correct active state
- No pill buttons or background highlights — editorial underline style
- Other nav items (ABOUT, DASHBOARD, etc.) in default ink color

#### MINOR ISSUE: Stat Card Value Font Size
- Design spec says "Large numbers: Fraunces 700, 2.5rem" but CSS shows `font-size: 2.2rem`
- This is a minor deviation (2.2rem vs 2.5rem). The visual appearance is still appropriate and readable. Responsive breakpoint reduces to 1.75rem which is fine for smaller screens.

#### PASS: Color Palette
- Paper background (#f5f0e8) — warm cream visible throughout
- Ink text (#1a1612) — deep near-black for primary text
- Accent red (#b8432f) — used for section numbers and accent bar
- No purple, blue, or neon colors detected anywhere on the page

---

## Relationships Page (`/relationships`)

### Screenshots captured
- `relationships-01-initial.png` — Initial page with first column auto-selected and results table
- `relationships-03-results-gender.png` — Same as initial (auto-selects first column alphabetically)
- `relationships-04-results-scrolled.png` — Scrolled view showing more table rows
- `relationships-05-results-fetish.png` — "totalfetishcategory" column selected, showing its associations

### Findings

#### PASS: Page Title & Subtitle Typography
- "Relationship Finder" in Fraunces 700, large display — correct
- Subtitle in Source Serif 4, muted — "Precomputed pairwise associations between survey columns..." — correct
- Dateline showing "X columns / Y relationships" in proper dateline style — correct

#### PASS: Target Column Section (Raised Panel)
- Section "01 Target Column" with numbered header in accent color — correct
- ColumnCombobox with "Select a column..." label in editorial-label style
- Raised panel has sidebar-bg background, rule border, and 3px red accent top bar — all correct
- Square corners — no border-radius

#### PASS: ColumnCombobox Styling
- Combobox trigger displays selected column name
- JetBrains Mono font — correct for form controls
- Square corners (`rounded-none`) — confirmed in component code
- Rule border with paper background — correct

#### PASS: Results Table Structure
- Uses `editorial-table` class directly (not the DataTable component)
- Full-width table with proper column structure:
  - Related Column (with display name + raw column name below in faded text)
  - Metric (badge)
  - Strength (numeric)
  - Label (badge)
  - N (numeric)
  - Strength (visual bar)
- Header: JetBrains Mono, uppercase, faded, 2px solid ink bottom border — correct
- Row borders: 1px solid rule-light — correct
- No zebra striping — correct
- First column in JetBrains Mono — correct

#### PASS: Related Column Links
- Column names are rendered as links to `/explore` with `color: var(--accent)` — red accent links
- Bottom border `1px solid var(--rule-light)` for underline style — correct editorial approach (not default blue underline)
- Below the display name, raw column name shown in `mono-value text-[var(--ink-faded)]` — nice progressive disclosure

#### PASS: Metric Badges ("Cramer's V" / "Correlation")
- Use `null-badge` class — `1px solid var(--rule)` border, JetBrains Mono 0.62rem uppercase
- No border-radius in CSS — square badges confirmed
- Color is `var(--ink-faded)` — appropriately muted for metadata

#### PASS: Strength Label Badges (negligible/weak/moderate/strong)
- Also use `null-badge` class — square corners, no border-radius
- "strong" labels styled with `borderColor: var(--accent)` and `color: var(--accent)` — red accent for emphasis
- "moderate" labels styled with `borderColor: #8f5a2b` and `color: #8f5a2b` — warm brown, stays within palette
- "weak" and "negligible" use default faded styling — appropriate visual hierarchy
- No unwanted border-radius on any badge — confirmed via CSS (null-badge has no border-radius property)

#### PASS: Strength Bar Charts
- Use `inline-ratio` class — 4px height horizontal bars
- Background: `var(--rule-light)` — subtle track
- Fill: `color-mix(in srgb, var(--accent) 70%, transparent)` — semi-transparent red accent
- Bar width proportional to max value in the set — correct relative scaling
- Clean, minimal visualization that fits the editorial aesthetic

#### PASS: Numeric Values
- Strength values (e.g., 0.1985, 0.0519) in JetBrains Mono — correct
- N values (e.g., 15,195) formatted with commas in JetBrains Mono — correct
- Right-aligned via `.numeric` class — correct

#### PASS: Section Header "02 Top Related Columns"
- Numbered "02" in accent red — correct
- Subtitle dynamically shows "X associations for [column]" — helpful context
- Fraunces 600 for title text — correct

#### PASS: Table Density & Readability
- Row padding at 0.56rem — compact but readable
- Sufficient white space between columns
- Long column names (multi-line) handled well with `vertical-align: top`
- The table accommodates both short names and very long descriptive names gracefully

#### PASS: Color Palette
- Consistent warm cream background (#f5f0e8)
- Ink-dark text (#1a1612) for primary content
- Red accent (#b8432f) for links, strong badges, bars, section numbers
- Brown (#8f5a2b) for moderate badges — warm tone consistent with palette
- Faded ink (#8a7e70) for secondary text — correct
- No purple, blue, or neon colors anywhere

#### NOTE: Badge Color `#4d5d73` in CSS
- The `null-badge--not_applicable` variant in `styles.css` uses `#4d5d73` (cool blue-gray)
- This color is NOT used on the Relationships page (which only uses `null-badge` base class and inline style overrides for strong/moderate)
- However, this color appears in `badge.tsx` as a "cool" variant and is used on the Columns page for "not applicable" null reasons
- While not violating the relationships page specifically, `#4d5d73` is a cool blue-gray that slightly conflicts with the "No purple, blue, or neon" guideline. It is muted enough to potentially be acceptable as a neutral, but worth flagging for design consistency.

---

## Summary

### Overall Assessment: STRONG PASS

Both pages are well-implemented and closely follow the "Ink & Paper" design system. The editorial journal aesthetic is maintained consistently.

### Issues Found

| Severity | Page | Issue | Details |
|---|---|---|---|
| Minor | Profile | Stat card value font size | CSS uses 2.2rem vs spec's 2.5rem (0.3rem smaller) |
| Note | Global | `#4d5d73` cool badge color | `null-badge--not_applicable` uses a cool blue-gray; not used on these pages but exists in CSS |

### Design System Compliance Checklist

| Requirement | Profile | Relationships |
|---|---|---|
| Fraunces for display/headers | PASS | PASS |
| Source Serif 4 for body | PASS | PASS |
| JetBrains Mono for data/labels | PASS | PASS |
| No border-radius | PASS | PASS |
| No gradients | PASS | PASS |
| No box-shadows | PASS | PASS |
| Cream paper background | PASS | PASS |
| Ink-dark text | PASS | PASS |
| Red accent only | PASS | PASS |
| No purple/blue/neon | PASS | PASS |
| Square mode toggle buttons | PASS | N/A |
| Raised panels with accent bar | PASS | PASS |
| Editorial table styling | PASS | PASS |
| Section numbering | PASS | PASS |
| Form controls in JetBrains Mono | PASS | PASS |
| No zebra striping | PASS | PASS |
| Navigation active state | PASS | PASS |
