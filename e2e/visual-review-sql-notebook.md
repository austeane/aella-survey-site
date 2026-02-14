# Visual Review: SQL Console + Notebook Pages

**Reviewer**: reviewer-sql (automated Playwright + visual inspection)
**Date**: 2026-02-12
**Pages**: `/sql`, `/notebook`
**Viewport**: 1440x900

---

## SQL Console (`/sql`)

### Overall Layout

The SQL Console uses a two-column grid layout (`xl:grid-cols-[340px,1fr]`) with a sidebar (`raised-panel`) on the left and a main editor area (`editorial-panel`) on the right. On smaller screens these stack vertically. The layout is clean and functional.

**PASS** - Two-panel layout with proper proportions.

### Navigation Bar

- Active "SQL" link correctly uses `var(--accent)` (#b8432f) text color with a 2px bottom border underline in accent color.
- Logo "Big Kink Survey Explorer" in Fraunces bold, subtitle "Editorial Analysis Workspace" in Source Serif italic -- correct.
- Nav links in uppercase, appropriate tracking.
- `2px solid var(--ink)` bottom border on the nav bar -- correct.

**PASS** - Navigation fully conforms to design system.

### Page Header

- "SQL Console" title in Fraunces 700, large display size -- correct.
- Subtitle in Source Serif italic, faded ink color -- correct.
- Rule divider below header -- present and correct.

**PASS** - Page header matches design system.

### Sidebar (`raised-panel`)

- Background: `var(--sidebar-bg)` (#eae3d5) -- visually confirmed, warm off-white panel distinct from main paper background.
- 3px accent red top border (via `::before` pseudo-element) -- **visible and correct**.
- Border: `1px solid var(--rule)` -- present.
- Section header "01 Schema & Templates" with red section number -- correct Fraunces heading with accent number.

**PASS** - Raised panel styling is correct.

### Template Buttons

- Five template buttons: Distribution (categorical), Distribution (numeric), Cross-tab, Cohort filter, Correlation.
- Rendered as `ghost` variant buttons: transparent background, `var(--ink-light)` text color.
- JetBrains Mono font, uppercase, appropriate tracking.
- Left-aligned with `justify-start`.
- **No border-radius** -- confirmed `rounded-none` in button base class.
- Hover state adds `var(--rule)` border and darkens text to `var(--ink)`.

**PASS** - Template buttons follow ghost variant pattern, square corners.

### Column Search Input

- "SEARCH COLUMNS" label in JetBrains Mono uppercase (`.editorial-label` class) -- correct.
- Input field: `var(--paper)` background, `var(--rule)` border, JetBrains Mono font, `rounded-none`.
- Placeholder "Filter by name" in `var(--ink-faded)`.

**PASS** - Input styling conforms to design system.

### Column List (ScrollArea)

- Columns rendered inside a `ScrollArea` with `border border-[var(--rule)] bg-[var(--paper)]`.
- Each column name is a ghost button at 0.72rem, left-aligned, truncated.
- Column names display full survey question text (e.g., long descriptive strings).
- Scroll area has a configurable max height `calc(100vh-520px)` with min 200px.
- Column names use JetBrains Mono (inherited from button base class).

**PASS** - Column list is functional and properly styled.

### Editor Section

- Section header "02 Editor" with red accent number -- correct.
- Textarea: JetBrains Mono font, `var(--paper)` background, `var(--rule)` border, **no border-radius** (`rounded-none`).
- Height `h-64` (16rem) -- appropriate for SQL editing.
- SQL text renders in monospace at 0.8rem -- clear and readable.
- Focus state changes border to `var(--ink)` -- correct.

**PASS** - SQL textarea matches design system specifications.

### Button Row (Run Query, Export CSV, Add to Notebook)

- **"Run Query"** button: `filled` variant -- dark ink background (`var(--ink)`) with paper text (`var(--paper)`). Square corners. JetBrains Mono uppercase. Visually prominent and correct.
- **"Export CSV"** button: `accent` variant -- `var(--accent)` border and text on paper background. Square corners.
- **"Add to Notebook"** button: `ghost` variant -- transparent, ink-light text. Becomes enabled when query results exist; disabled state at 55% opacity.
- **Limit input**: Labeled "LIMIT" in editorial-label style. Input field with number type, paper background, rule border, JetBrains Mono.
- All buttons are `rounded-none` -- **no border-radius anywhere**.

**PASS** - Button row styling is correct. All variants render as specified.

### Results Table

- Section header "03 Results" with red accent number.
- Sample size display: "Rows returned: X" and "Limit applied: 1,000" in JetBrains Mono uppercase, faded ink color -- uses `.sample-size` / `.sample-size-item` classes correctly.
- Truncation warning "Results may be truncated" shown in accent red when row count equals limit.
- Table rendered via `DataTable` component.
- Table headers in JetBrains Mono uppercase, faded -- conforms to editorial table pattern.
- Table header has `2px solid var(--ink)` bottom border -- correct.
- Table rows have `1px solid var(--rule-light)` bottom borders -- correct.
- No zebra striping -- correct.
- Data values render cleanly (straightness, politics, respondent counts).

**PASS** - Results table conforms to editorial data table pattern.

### Error Display

- SQL errors show in `.alert.alert--error` styling.
- Background: `#f0ded8` (warm pink), border: `#8b1a1a` (dark red), text: `#8b1a1a`.
- Error message includes DuckDB parser error text.
- **No border-radius** on alert box -- correct.
- Error is clearly visible and distinguishable from surrounding content.

**PASS** - Error display follows alert pattern correctly.

### "Saved!" Feedback

- After clicking "Add to Notebook", button text changes to "Saved!" for 2 seconds.
- The button inverts to dark background momentarily (screenshot captured this state).
- Provides clear visual feedback without modal or toast.

**PASS** - Feedback mechanism is simple and effective.

---

## Notebook (`/notebook`)

### Page Header

- "Research Notebook" title in Fraunces 700, large display size -- correct.
- Subtitle "Saved findings from explorations, profiles, and SQL queries." in Source Serif italic -- correct.
- Rule divider below -- present.

**PASS** - Consistent page header pattern.

### Empty State

- Uses `.alert.alert--warn` styling: warm yellow background (`#efe0be`), amber border (`#8a5b10`), dark amber text (`#6d490f`).
- Message: "No entries yet. Add findings from Explore, Profile, or SQL pages."
- Properly contained within the "Entries" editorial panel.
- **No border-radius** on alert -- correct.

**PASS** - Empty state is informative and correctly styled.

### Entries Section (with entries)

- Section header "01 Entries" with red accent number in editorial panel.
- Entry items use `.caveat-item` styling: bottom border `1px solid var(--rule-light)`, padding 0.85rem.
- **Title**: `.caveat-title` at 600 weight, 0.95rem -- renders in Source Serif 4 (body font). Cursor changes to pointer on hover with "Click to edit title" tooltip.
- **Type badge**: `.null-badge` styled -- JetBrains Mono, tiny uppercase, bordered pill. Shows "sql" for SQL-originated entries. Square corners (no border-radius on badge).
- **Dateline**: Formatted date in uppercase (e.g., "FEB 12, 2026, 10:51 PM") -- JetBrains Mono, faded.
- **"Open source" link**: Styled with accent color, underline decoration using `var(--rule)` that transitions to `var(--accent)` on hover.
- **Results summary**: "X rows, Y columns" in JetBrains Mono, faded ink.
- **Notes placeholder**: "Click to add notes..." in `.caveat-description` style -- ink-light color, 0.85rem.
- **Delete button**: `accent` variant, `sm` size -- red accent border/text, square corners. Positioned to the right of the entry.

**PASS** - Entry list layout is well-structured and editorial.

### Inline Editing

- **Title editing**: Clicking the title replaces it with an `Input` component (JetBrains Mono, paper background, rule border). Autofocused. Saves on blur or Enter key.
- **Notes editing**: Clicking the notes placeholder replaces it with a `Textarea` component (JetBrains Mono, paper background, min-height 60px). Saves on blur.
- Both editing states maintain consistent styling with the rest of the form controls.
- **No border-radius** on edit inputs/textareas -- correct (`rounded-none` applied).

**PASS** - Inline editing works and maintains design consistency.

### Export Section

- Uses `raised-panel` styling: `var(--sidebar-bg)` background, rule border, 3px accent red top bar.
- Section header "02 Export" with red accent number.
- "Export as JSON" button: `default` variant -- ink border, paper background, ink text. Square corners.
- Button is disabled (55% opacity) when no entries exist; enabled when entries are present.

**PASS** - Export section correctly uses raised panel pattern.

---

## Summary of Findings

### Conformance Score: EXCELLENT

All major design system requirements are met across both pages:

| Requirement | SQL Console | Notebook | Status |
|---|---|---|---|
| Cream paper background (#f5f0e8) | Yes | Yes | PASS |
| Ink text (#1a1612) | Yes | Yes | PASS |
| Red accent (#b8432f) | Yes | Yes | PASS |
| Fraunces for headers | Yes | Yes | PASS |
| Source Serif 4 for body | Yes | Yes | PASS |
| JetBrains Mono for data/code | Yes | Yes | PASS |
| No border-radius (square corners) | Yes | Yes | PASS |
| No gradients | Yes | Yes | PASS |
| No box-shadows | Yes | Yes | PASS |
| Raised panel (sidebar-bg, accent top bar) | Yes | Yes | PASS |
| Editorial table pattern | Yes | N/A | PASS |
| Alert styling (error/warn) | Yes | Yes | PASS |
| Button variants (filled/accent/ghost/default) | Yes | Yes | PASS |
| Section headers with red numbers | Yes | Yes | PASS |

### Issues Found: NONE (Critical or Major)

### Minor Observations (not bugs, just notes)

1. **Column list in sidebar shows very long question text**: The column names are full survey question text (e.g., "Engaging with or fantasizing about what arouses me feels therapeutic or healing to me"). These truncate correctly via `truncate` class, but the tooltip shows the full name. This is intentional and useful.

2. **Sidebar scroll area fills most of the viewport**: The `max-h-[calc(100vh-520px)]` calculation works well at 1440x900 but should be verified at smaller heights. The `min-h-[200px]` guard is appropriate.

3. **"Add to Notebook" button uses ghost variant**: This makes it visually less prominent than "Run Query" and "Export CSV", which is appropriate hierarchy (primary action > secondary action > tertiary action).

4. **Notebook page is sparse with few entries**: With only one entry, the page has significant whitespace below the Export section. This is acceptable for a utility page and will fill naturally as users add more entries.

5. **No confirmation toast/banner after notebook save**: The button text changes to "Saved!" for 2 seconds, which is subtle. Users may miss it. Consider adding a brief success alert, though this is a minor UX preference, not a design system violation.

---

## Screenshots Captured

### SQL Console
- `sql-01-initial.png` -- Initial page load
- `sql-02-template-loaded.png` -- After clicking template button
- `sql-03-results.png` -- After running query with results
- `sql-04-sidebar.png` -- Sidebar panel detail
- `sql-05-fullpage.png` -- Full page scroll capture
- `sql-07-error.png` -- Error state with bad SQL
- `sql-detail-01-header.png` -- Navigation bar zoom
- `sql-detail-02-templates.png` -- Page title zoom
- `sql-detail-03-filter-input.png` -- Schema section header zoom
- `sql-detail-04-query-buttons.png` -- Template buttons + filter input zoom
- `sql-detail-05-editor-area.png` -- Editor area with buttons zoom
- `sql-detail-07-results-scrolled.png` -- Scrolled view showing columns + editor
- `sql-results-01-full.png` -- Full page with complete query results
- `sql-results-02-table-view.png` -- Scrolled to results table
- `sql-results-03-table-rows.png` -- Results table with data rows
- `sql-after-notebook-add.png` -- After adding result to notebook ("Saved!" state)

### Notebook
- `notebook-01-initial.png` -- Empty state (no entries)
- `notebook-02-fullpage.png` -- Empty state full page
- `notebook-with-entry-01.png` -- With one entry
- `notebook-with-entry-02-full.png` -- With entry, full page
- `notebook-editing-title.png` -- Inline title editing
- `notebook-editing-notes.png` -- Inline notes editing
- `notebook-final-state.png` -- After editing
- `notebook-detail-01-header.png` -- Header zoom
- `notebook-detail-02-entries.png` -- Entries section zoom
- `notebook-detail-03-export.png` -- Export section zoom
