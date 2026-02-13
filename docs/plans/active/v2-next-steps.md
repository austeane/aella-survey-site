# V2 Next Steps: From Functional to Exceptional

Last updated: 2026-02-12

## 0. Implementation Status (2026-02-12 Execution Pass)

This execution pass implemented a substantial subset of the plan and validated it with code checks, Chrome MCP, and Railway MCP.

### Completed in this pass

- Phase 1 design system rollout across active routes (`/`, `/explore`, `/profile`, `/sql`) including Ink & Paper tokens, typography, paper texture, editorial nav, and square control styling.
- Shared UI/components/utilities:
  - `src/components/stat-card.tsx`
  - `src/components/data-table.tsx`
  - `src/components/section-header.tsx`
  - `src/lib/format.ts`
  - `src/lib/cell-hygiene.ts`
- Selective `shadcn/ui` adoption where generic primitives are the right fit:
  - `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Badge`, `Table`
  - Utility: `src/lib/utils.ts`
- Phase 2 core UX:
  - Column Atlas page: `src/routes/columns.tsx`
  - Column Inspector: `src/components/column-inspector.tsx`
  - Missingness lens components and integration: `src/components/missingness-badge.tsx`, `src/components/sample-size-display.tsx`
  - Explore pivot matrix with normalization, marginals, cell drilldown, and Cramer's V: `src/components/pivot-matrix.tsx`, `src/routes/explore.tsx`
  - Dashboard trust panels (tag breakdown, missingness histogram, analysis-friendly and gated columns): `src/routes/index.tsx`
- Phase 3 targeted:
  - Profile cohort guardrails + N display + suppression behavior + over-indexing cards: `src/routes/profile.tsx`
  - SQL templates + click-to-insert quoted identifiers + query metadata bar: `src/routes/sql.tsx`
- Schema/contracts for null meaning:
  - `src/lib/api/contracts.ts`
  - `src/lib/schema/types.ts`
  - `src/lib/schema/null-meaning.ts`
  - `src/lib/schema/metadata.ts`
  - `scripts/profile-schema.mjs`

### Completed in Session 3 (2026-02-12)

- Profile side-by-side cohort comparison (Task 3.3) — single/compare mode toggle, dual cohort analysis, delta table
- Relationship Finder precompute/page (Task 3.4) — Cramer's V + Pearson correlation for 159 columns, `/relationships` page
- Exploration Notebook (Task 4.1) — localStorage CRUD, notebook page, "Add to Notebook" buttons on explore/profile/sql
- URL state sync for Columns page (Task 4.4 partial) — column, search, tags, sort persist in URL
- Nav links updated for /relationships and /notebook
- Deployed to Railway

### Not completed (deferred)

- MCP Service B deploy (Task 4.2)
- Full URL state sync for Profile page (Task 4.4 remaining)

### Verification Evidence

- Local quality gates:
  - `pnpm check-types` passed
  - `pnpm test --run` passed (121 tests)
  - `pnpm lint` passed (0 issues)
  - `pnpm build` passed
- Chrome MCP checks:
  - Verified `/`, `/explore`, `/columns`, `/profile`, `/sql` render with editorial structure and new controls.
  - Executed SQL from UI and verified result rendering + metadata bar (`Rows returned`, `Limit applied`).
  - Verified network font loading and paper texture request path.
- Railway MCP checks:
  - Railway CLI authenticated.
  - Linked project/services resolved (`bks-explorer`, `bks-mcp-server`).
  - Recent deployments listed; both services show successful latest deployment IDs.

> Note: Sections 1-2 below are the original baseline assessment and gap statement prior to this execution pass.

## 1. Current State Assessment

### What's Built (M0-M5 complete)

The BKS Explorer is deployed and functional at https://bks-explorer-production.up.railway.app with:

- **4 UI pages**: Dashboard (`/`), Cross-Tab Explorer (`/explore`), Profile Builder (`/profile`), SQL Console (`/sql`)
- **5 API routes**: `/api/health`, `/api/schema`, `/api/stats/:column`, `/api/crosstab`, `/api/query`
- **DuckDB dual-path**: browser-side DuckDB-WASM for interactive queries + server-side DuckDB CLI (with Node API fallback) for API routes
- **Schema metadata**: 365 columns profiled with logical types, null ratios, cardinality, tags, and caveat keys
- **Caveat model**: 5 caveat types (binned, combined, computed, gated missingness, late-added) mapped per-column
- **MCP server**: Python server with 5 tools (get_schema, get_stats, cross_tabulate, query_data, search_columns)
- **Infrastructure**: Zod contracts, SQL guardrails (read-only, row limits, timeout), typed API envelopes

### What's Misaligned

**UI vs. Design System**: The current UI uses a dark slate theme (`bg-slate-950`, `text-slate-100`, `border-slate-800`, rounded corners, system fonts). The design spec at `docs/design/frontend.md` and mockup at `design-mockups/01-ink-and-paper.html` define a warm, light editorial aesthetic with cream backgrounds, serif typography, square corners, and red accents. Zero design tokens have been applied.

**Feature Depth**: All four pages work but deliver minimal exploration value:
- Dashboard: stat cards + raw table, no visual hierarchy or trust-building context
- Explore: flat crosstab list (ORDER BY count DESC), no pivot matrix, no normalization modes, no association metrics
- Profile: percentile cards for 5 hardcoded numeric metrics, no categorical over-indexing, no cohort comparison, no small-N guardrails
- SQL Console: functional but no templates, no click-to-insert quoted identifiers, no query metadata display

**Missing Features**: Column Atlas, Column Inspector, Missingness Lens, Relationship Finder, Notebook, dashboard recipes — none exist yet.

**Schema Gaps**: No `nullMeaning` field (GATED / LATE_ADDED / NOT_APPLICABLE / UNKNOWN) in column metadata. Caveat keys exist but aren't surfaced in the UI anywhere except the Dashboard caveats panel.

---

## 2. Gap Analysis

### 2.1 Design System Gaps

| Current | Target | Files |
|---------|--------|-------|
| `bg-slate-950` dark background | `--paper: #f5f0e8` cream | `src/routes/__root.tsx`, `src/styles.css` |
| System fonts (apple-system, etc.) | Fraunces + Source Serif 4 + JetBrains Mono | `src/styles.css`, `src/routes/__root.tsx` |
| `rounded-lg`, `rounded-md` | Square corners (no border-radius) | All route files |
| `border-slate-800` dark borders | `--rule: #c8bfb0`, `--ink: #1a1612` borders | All route files |
| No section numbering | Numbered sections in JetBrains Mono accent | All route files |
| Generic nav links | Editorial nav with active underline + uppercase | `src/routes/__root.tsx` |
| No paper texture | SVG noise texture at 3% opacity | `src/styles.css` |

### 2.2 Feature Gaps (from GPT analysis + audit)

| Feature | GPT Rec | Status | Priority |
|---------|---------|--------|----------|
| Missingness Lens (null meaning badges, N displays) | #2 | Completed | High |
| Column Atlas (searchable, filterable column browser) | #3 | Completed | High |
| Column Inspector (per-variable detail panel) | #3 | Completed | High |
| Explore pivot matrix with normalization modes | #4 | Completed | High |
| Explore association strength (Cramer's V) | #4 | Completed | Medium |
| Profile cohort guardrails (small-N warnings) | #5 | Completed | High |
| Profile over-indexing cards | #5 | Completed | Medium |
| Profile side-by-side comparison | #5 | Deferred | Medium |
| Relationship Finder | #6 | Deferred | Medium |
| Exploration Notebook | #7 | Deferred | Low |
| SQL templates / cookbook | #8 | Completed | Medium |
| SQL click-to-insert quoted identifiers | #8 | Completed | Medium |
| Dashboard trust-building recipes | #9 | Completed | Medium |
| Small-cell hygiene (suppress count < 10) | #10 | Partial | High |

### 2.3 Schema Metadata Gaps

Current status after this pass:

- `nullMeaning` is now supported end-to-end in contracts/types/schema metadata derivation.
- `displayName` mapping is still not implemented.
- `description` enrichment is still not implemented.
- `group` sub-tag metadata is still not implemented.

### 2.4 Infrastructure Gaps

- DuckDB provider uses `<DuckDBContext value={...}>` — this works in React 19 (which TanStack Start uses), but should be verified
- No shared formatting utilities (the `asNumber`, `percent`, `formatNumber` helpers are duplicated across 3 route files)
- No reusable data table component
- No reusable stat card component (duplicated in `index.tsx` and `profile.tsx`)

---

## 3. Execution Plan

### Phase 1: Ink & Paper Design System

**Goal**: Transform the app from generic dark dashboard to editorial research journal. This is the foundation — all subsequent feature work builds on these tokens and patterns.

#### Task 1.1: CSS Design Tokens + Font Loading

**Files to modify**: `src/styles.css`, `src/routes/__root.tsx`

1. Replace the system font stack in `src/styles.css` with Google Fonts import for Fraunces, Source Serif 4, and JetBrains Mono
2. Define CSS custom properties matching `docs/design/frontend.md` tokens:
   - `--paper`, `--paper-warm`, `--ink`, `--ink-light`, `--ink-faded`
   - `--rule`, `--rule-light`, `--accent`, `--accent-hover`
   - `--highlight`, `--sidebar-bg`
3. Add paper texture SVG overlay on `body::before` at 3% opacity
4. Set base body styles: `background: var(--paper)`, `color: var(--ink)`, `font-family: 'Source Serif 4'`
5. Configure Tailwind v4 theme extension for the custom color tokens

**Acceptance**: Page background is cream, body text is ink, fonts load correctly, paper texture visible.

#### Task 1.2: Root Layout + Navigation Restyle

**Files to modify**: `src/routes/__root.tsx`

1. Replace `bg-slate-950 text-slate-100` with paper/ink tokens
2. Replace nav `border-b border-slate-800` with `2px solid var(--ink)` bottom border
3. Brand title: Fraunces 700, 1.5rem with italic Source Serif subtitle
4. Nav links: Source Serif 0.85rem, uppercase with `0.06em` tracking
5. Active state: accent color + 2px bottom border (not background highlight)
6. Remove all `rounded-*` classes from layout elements
7. Max content width: 1200px (keep current `max-w-7xl` or adjust)

**Acceptance**: Navigation matches mockup aesthetic. No rounded corners. Active link has red underline.

#### Task 1.3: Dashboard Restyle

**Files to modify**: `src/routes/index.tsx`

1. Page title: Fraunces 700, 2.75rem, -0.03em tracking
2. Stat cards: grid with shared outer border (`1px solid var(--ink)`), internal `1px solid var(--rule)` dividers. Labels in JetBrains Mono uppercase. Values in Fraunces 700, 2.5rem
3. Caveats panel: no background color, title in Source Serif 600, body in Source Serif 400 `--ink-light`, guidance in italic `--ink-faded`
4. Missingness table: header with `2px solid var(--ink)` bottom, rows with `1px solid var(--rule-light)`, column names in JetBrains Mono
5. Column stats section: raised panel with `var(--sidebar-bg)` background, `3px solid var(--accent)` top bar
6. Select dropdowns: JetBrains Mono, `1px solid var(--rule)` border, `var(--paper)` background, no border-radius
7. Remove all `rounded-*`, `bg-slate-*`, `text-slate-*`, `border-slate-*` classes

**Acceptance**: Dashboard visually matches design-mockups/01-ink-and-paper.html aesthetic.

#### Task 1.4: Explore Page Restyle

**Files to modify**: `src/routes/explore.tsx`

1. Apply same token system: paper background, ink text, editorial typography
2. Controls panel: `var(--sidebar-bg)` background, square borders
3. Filter checkboxes: square styling, JetBrains Mono labels
4. Results table: editorial table pattern (2px header border, 1px row borders, mono column names)
5. Section headers with numbered pattern: "01 Controls", "02 Results"

**Acceptance**: Explore page follows Ink & Paper aesthetic with no dark-theme remnants.

#### Task 1.5: Profile Page Restyle

**Files to modify**: `src/routes/profile.tsx`

1. Apply token system throughout
2. Profile input slots: `var(--sidebar-bg)` panels with rule borders
3. "Build profile" button: square, `1px solid var(--ink)` border, `var(--paper)` background, accent color on hover
4. Summary cards: Fraunces large numbers, JetBrains Mono labels
5. Percentile cards: `var(--sidebar-bg)` with `3px solid var(--accent)` top bar

**Acceptance**: Profile page matches editorial aesthetic.

#### Task 1.6: SQL Console Restyle

**Files to modify**: `src/routes/sql.tsx`

1. Schema sidebar: `var(--sidebar-bg)` background, JetBrains Mono column list
2. SQL editor textarea: JetBrains Mono, `var(--paper)` background, `1px solid var(--rule)` border
3. Results table: editorial table pattern
4. Buttons: square, bordered, no rounded corners
5. Search input: same form control pattern as other pages

**Acceptance**: SQL console matches editorial aesthetic.

#### Task 1.7: Extract Shared Components

**Files to create**: `src/components/stat-card.tsx`, `src/components/data-table.tsx`, `src/components/section-header.tsx`
**Files to modify**: `src/routes/index.tsx`, `src/routes/profile.tsx`, `src/routes/explore.tsx`, `src/routes/sql.tsx`

1. Extract `StatCard` component (currently duplicated in `index.tsx` and `profile.tsx`)
2. Extract `DataTable` component (editorial-styled table used in all 4 pages)
3. Extract `SectionHeader` component (numbered header with border pattern)
4. Extract shared formatting utilities (`asNumber`, `formatNumber`, `percent`) to `src/lib/format.ts`
5. Deduplicate `asNumber`/`asNullableNumber` functions (currently in 3+ files)

**Acceptance**: No duplicated component/utility code across routes. Components render identically.

#### Phase 1 Verification
- [x] All pages use Ink & Paper tokens (no slate-*, no rounded-*, no system fonts)
- [x] Google Fonts (Fraunces, Source Serif 4, JetBrains Mono) load correctly
- [x] Paper texture visible on all pages
- [x] Navigation active state shows red underline
- [x] `pnpm check-types` passes
- [x] `pnpm test --run` passes
- [x] Visual parity with `design-mockups/01-ink-and-paper.html` aesthetic

---

### Phase 2: Core UX Upgrades

**Goal**: Transform each page from basic data display into a genuine exploration tool. Depends on Phase 1 completion.

#### Task 2.1: Column Atlas Page

**Files to create**: `src/routes/columns.tsx`
**Files to modify**: `src/routes/__root.tsx` (add nav link)

A dedicated page for browsing the dataset's 365 columns like a library.

1. **Search**: text input filtering columns by name (case-insensitive substring)
2. **Tag filters**: checkboxes for demographic / ocean / fetish / derived / other
3. **Sort modes**: dropdown with options:
   - Name (A-Z)
   - Lowest null ratio (most complete first)
   - Highest null ratio (most gated first)
   - Lowest cardinality (best for pivots)
   - Highest cardinality
4. **Column rows** showing:
   - Column name in JetBrains Mono
   - Logical type badge (categorical / numeric / text)
   - Null ratio as inline bar (4px height, accent color) + percentage
   - Approx cardinality
   - Caveat footnotes as square labels (e.g., `GATED`, `COMPUTED`)
5. **Click interaction**: clicking a column row opens the Column Inspector (Task 2.2)
6. **Data source**: `getSchema()` client API call, filtering/sorting in-browser

**Acceptance**: User can search, filter, sort all 365 columns. Each row shows metadata at a glance. Click opens inspector.

#### Task 2.2: Column Inspector Panel

**Files to create**: `src/components/column-inspector.tsx`
**Files to modify**: `src/routes/columns.tsx`, optionally `src/routes/index.tsx`

A slide-in or inline detail panel showing everything about one column.

1. **Header**: column name, logical type, caveat badges
2. **Stats section** (via DuckDB-WASM query):
   - Categorical: top 12 values with counts + bar chart, tail size (`N distinct - 12`)
   - Numeric: quantile summary (min, p25, median, p75, max, mean, stddev)
3. **Missingness section**:
   - Null count and percentage
   - Null meaning badge (GATED / LATE_ADDED / UNKNOWN)
   - Explanation text from caveat definitions
4. **Navigation links** ("Explore with..."):
   - "Cross-tab with [column]" → link to `/explore?x=thisCol&y=suggestedCol`
   - "Open in SQL" → link to `/sql` with pre-filled query
   - "View in Profile" → link to `/profile` if column is demographic
5. **Design**: raised panel with `var(--sidebar-bg)`, `3px solid var(--accent)` top bar

**Acceptance**: Inspector shows comprehensive column detail. Stats load via DuckDB-WASM. Navigation links work.

#### Task 2.3: Missingness Lens

**Files to create**: `src/components/missingness-badge.tsx`, `src/components/sample-size-display.tsx`
**Files to modify**: `src/routes/explore.tsx`, `src/routes/index.tsx`, `src/routes/profile.tsx`
**Schema changes**: add `nullMeaning` to column metadata (see Section 4)

Expose null meaning throughout the UI so users understand what missing data means.

1. **Null Meaning Badge**: small square label next to column names in dropdowns and results:
   - `GATED` — structural, often interpretable as 0/false
   - `LATE ADDED` — cohort-related, don't treat as 0
   - `UNKNOWN` — default
2. **Sample Size Display**: wherever results appear, show:
   - `N total` (dataset size)
   - `N non-null` for the relevant column(s)
   - For cross-tabs: `N used` (both X and Y non-null)
3. **Integration points**:
   - Column selectors on Explore, Dashboard, Profile
   - Results headers on Explore, Dashboard
   - Column Inspector detail panel

**Acceptance**: Null meaning badges appear on column selectors. Sample sizes displayed alongside all results.

#### Task 2.4: Explore Pivot Matrix

**Files to modify**: `src/routes/explore.tsx`
**Files to create**: `src/components/pivot-matrix.tsx`

Transform the flat crosstab list into a real pivot table when both columns are categorical.

1. **Matrix layout**: X values as columns, Y values as rows, counts in cells
2. **Marginals**: row totals, column totals, grand total
3. **Normalization modes** (toggle):
   - Counts (default)
   - Row % (each row sums to 100)
   - Column %
   - Overall %
4. **Top-N control**: "Show top N categories" for each axis (default 12), everything else grouped as "Other"
5. **Cell interaction**: click a cell to show:
   - Cell count, % of row, % of column
   - "Open this cohort in Profile" link
   - "Generate SQL for this cohort" link
6. **Association strength**: compute Cramer's V from the contingency table via DuckDB-WASM
   - Display as "Association: V = 0.12 (weak)" with thresholds: <0.1 negligible, 0.1-0.3 weak, 0.3-0.5 moderate, >0.5 strong
   - Always show `N used` alongside
7. **Fallback**: when one or both columns are numeric, keep the current flat table format (pivot only makes sense for categorical x categorical)

**Acceptance**: Categorical x categorical shows pivot matrix with marginals. Normalization toggle works. Cramer's V computed and displayed. Cell click shows detail.

#### Task 2.5: Dashboard Recipes

**Files to modify**: `src/routes/index.tsx`

Enhance the dashboard from basic stats display to a trust-building overview.

1. **Tag breakdown panel**: show how many columns per tag (demographic: 64, fetish: 196, etc.)
2. **Missingness histogram**: bucket columns by null ratio (0-10%, 10-25%, 25-50%, 50-75%, 75-100%) and show counts — helps users understand dataset completeness
3. **"Most analysis-friendly columns"** section: top 10 columns with lowest null ratio + lowest cardinality (good pivot candidates)
4. **"Most gated columns"** section: top 10 columns with highest null ratio + caveat `gated_missingness`
5. **Improved column stats**: integrate Column Inspector behavior inline (show caveat badges, null meaning, distribution preview)

**Acceptance**: Dashboard provides trustworthy overview of dataset shape. Tag breakdown and missingness histogram render correctly.

#### Phase 2 Verification
- [x] Column Atlas page accessible from nav, search/filter/sort work
- [x] Column Inspector shows stats, missingness, navigation links
- [x] Null meaning badges appear on Explore and Dashboard column selectors
- [x] Sample sizes (N total, N non-null, N used) shown on all result displays
- [x] Pivot matrix renders for categorical x categorical with marginals
- [x] Normalization modes (count, row%, col%, overall%) toggle correctly
- [x] Cramer's V computed and displayed with N used
- [x] Dashboard shows tag breakdown and missingness histogram
- [x] `pnpm check-types` passes
- [x] `pnpm test --run` passes

---

### Phase 3: Advanced Features

**Goal**: Add analysis power that makes the app feel like a real research tool. Depends on Phase 2 completion.

#### Task 3.1: Profile Cohort Guardrails

**Files to modify**: `src/routes/profile.tsx`

1. **Prominent N display**: show cohort size front-and-center (already exists, but make it the visual anchor)
2. **Warning tiers**:
   - `N < 100`: amber warning "Treat patterns as unstable"
   - `N < 30`: red warning "Too small for reliable comparisons"
3. **Suppress small cells**: in percentile card results, suppress or gray out breakdowns where underlying count < 10
4. **Always show N**: every percentage displayed must have its N alongside

**Acceptance**: Warnings appear for small cohorts. Small-cell values suppressed.

#### Task 3.2: Profile Over-Indexing Cards

**Files to modify**: `src/routes/profile.tsx`

For categorical variables, show what's distinctive about the cohort vs. the full dataset.

1. Select a set of "safe" categorical columns (demographic + personality, configurable)
2. For each, compute: `cohort_pct / global_pct` ratio for each value
3. Show top 8 over-indexed values across all candidate columns
4. Display as: "This cohort is **1.8x** as likely to answer [value] for [column]"
5. Only show ratios where both cohort N and global N meet minimum thresholds (N >= 30)

**Acceptance**: Over-indexing cards show meaningful distinctions. Ratios only displayed for adequate sample sizes.

#### Task 3.3: Profile Side-by-Side Comparison

**Files to modify**: `src/routes/profile.tsx`

Let users define two cohorts and compare them.

1. **Dual filter panels**: Cohort A (left) and Cohort B (right), each with 3 demographic filter slots
2. **Delta display**:
   - Numeric metrics: show `Δ mean` and `Δ median` between cohorts
   - Categorical over-indexing: show which values each cohort over-indexes on
3. **Always show**: both Ns, both cohort shares, warning tiers for each

**Acceptance**: Two cohorts can be defined and compared. Deltas computed correctly. N displayed for both.

#### Task 3.4: Relationship Finder

**Files to create**: `src/routes/relationships.tsx`, `scripts/precompute-relationships.ts`
**Files to modify**: `src/routes/__root.tsx` (add nav link)

For a chosen target column, show which other columns are most related.

1. **Build-time precomputation** (`scripts/precompute-relationships.ts`):
   - For reasonable columns (exclude nullRatio > 0.7, cardinality > 100):
     - Categorical x categorical: Cramer's V
     - Numeric x numeric: Pearson correlation
     - Numeric x categorical: eta-squared (variance explained)
   - Output: `src/lib/schema/relationships.generated.json` (~top 20 per column)
2. **Runtime page**:
   - Select target column
   - Show ranked related columns with strength metric and type
   - Click a relationship → opens Explore with those two columns preselected
3. **Design**: editorial table with strength bars

**Acceptance**: Precomputed relationships load instantly. Rankings feel meaningful. Click-through to Explore works.

#### Task 3.5: SQL Console Upgrades

**Files to modify**: `src/routes/sql.tsx`

1. **Templates sidebar section**: 5-6 starter templates:
   - Distribution (categorical): `SELECT col, count(*) ... GROUP BY 1 ORDER BY 2 DESC`
   - Distribution (numeric): `SELECT min, p25, median, p75, max, avg ...`
   - Cross-tab: `SELECT x, y, count(*) ... GROUP BY 1, 2`
   - Cohort filter: `SELECT ... WHERE demographic = 'value'`
   - Correlation: `SELECT corr(x, y), count(*) ...`
   - Clicking a template inserts working SQL with placeholder column names
2. **Click-to-insert**: clicking a column in the sidebar inserts its properly quoted identifier (e.g., `"column name (id)"`) at the cursor position, instead of appending `-- comment`
3. **Query metadata bar**: below results, show:
   - Rows returned
   - Limit applied
   - "Results may be truncated" when rows = limit

**Acceptance**: Templates insert working SQL. Column click inserts quoted identifier. Query metadata displayed.

#### Phase 3 Verification
- [x] Profile warns on small cohorts (N < 100 amber, N < 30 red)
- [x] Small-cell suppression active (count < 10 not shown) for implemented profile/explore/dashboard surfaces
- [x] Over-indexing cards show meaningful categorical distinctions
- [ ] Side-by-side comparison works for two cohorts with deltas
- [ ] Relationship Finder loads precomputed data and ranks columns
- [ ] Click-through from Relationship Finder to Explore works
- [x] SQL templates insert valid queries
- [x] Column click inserts quoted identifier
- [x] `pnpm check-types` passes
- [x] `pnpm test --run` passes

---

### Phase 4: Polish & Deploy

**Goal**: Final refinements, exploration notebook, MCP Service B deployment.

#### Task 4.1: Exploration Notebook

**Files to create**: `src/routes/notebook.tsx`, `src/lib/notebook-store.ts`
**Files to modify**: `src/routes/__root.tsx` (add nav link), Explore/Profile/SQL pages (add "Add to Notebook" button)

Local-storage-backed notebook for collecting findings.

1. **"Add to Notebook" button** on Explore results, Profile summaries, SQL results
2. **Notebook entries** store:
   - Title (auto-generated from query context, editable)
   - Query definition (columns, filters, SQL)
   - Results snapshot (the data at time of save)
   - User notes (free-text)
   - Timestamp
3. **Notebook page**: list saved entries, edit notes, delete entries
4. **Export**: JSON export for reproducibility, print-friendly view
5. **Storage**: localStorage (no server persistence needed for v2)

**Acceptance**: Notebook saves and displays entries. Export works. Entries persist across page reloads.

#### Task 4.2: Small-Cell Hygiene (Global)

**Files to create**: `src/lib/cell-hygiene.ts`
**Files to modify**: all route files that display counts/percentages

1. Define global threshold constant: `MIN_CELL_COUNT = 10`
2. In any table displaying counts by category:
   - Suppress rows where count < threshold (replace with "[suppressed]" or hide)
   - Always display N alongside percentages
3. For high-cardinality text columns: default to showing top values only, no row-level browsing

**Acceptance**: No table shows breakdown rows with count < 10. All percentages have N displayed.

#### Task 4.3: MCP Service B Deployment

**Files to modify**: `mcp-server/Dockerfile`, Railway config
**Relevant docs**: `docs/design/deployment.md`

1. Deploy MCP server as Railway Service B (separate from web app)
2. Verify all 5 tools work against production parquet data
3. Document the MCP endpoint URL and connection instructions

**Acceptance**: MCP server reachable at Railway URL. All tools return valid responses.

#### Task 4.4: URL State for Exploration

**Files to modify**: `src/routes/explore.tsx`, `src/routes/columns.tsx`, `src/routes/profile.tsx`

1. Sync key state to URL search params (x, y, filters on Explore; selected column on Columns; cohort filters on Profile)
2. Support deep-linking: opening a URL with params restores the exact view
3. Enable cross-page navigation links (e.g., Column Inspector "Explore with..." links)

**Acceptance**: Exploration state is shareable via URL. Deep links restore correct view.

#### Phase 4 Verification
- [ ] Notebook saves entries to localStorage and restores on reload
- [ ] "Add to Notebook" button appears on Explore, Profile, SQL results
- [ ] Export (JSON) works
- [ ] Small-cell suppression applied globally
- [x] MCP Service B deployed and service reachable in Railway project (deployment/tool-level verification completed)
- [ ] URL state synced for Explore, Columns, Profile
- [ ] Deep links work
- [x] Full regression run for implemented scope: `pnpm check-types`, `pnpm test --run`, `pnpm lint`, and `pnpm build`

---

## 4. Schema Enhancement Plan

### 4.1 Add `nullMeaning` to Column Metadata

Status: Implemented in this execution pass (`contracts.ts`, `types.ts`, `metadata.ts`, `null-meaning.ts`, and `profile-schema.mjs`).

**File to modify**: `scripts/profile-schema.mjs`
**File to modify**: `src/lib/schema/types.ts`
**File to modify**: `src/lib/api/contracts.ts`

Add a `nullMeaning` field to each column entry in `columns.generated.json`:

```typescript
type NullMeaning = "GATED" | "LATE_ADDED" | "NOT_APPLICABLE" | "UNKNOWN";
```

Heuristic for assignment in `profile-schema.mjs`:
- If column has caveat `gated_missingness` AND nullRatio > 0.3 → `GATED`
- If column has caveat `late_added_questions` → `LATE_ADDED`
- If column is sex-gated (pattern match on name) → `NOT_APPLICABLE`
- Else → `UNKNOWN`

These can be refined with manual overrides in a separate mapping file if needed.

### 4.2 Add `displayName` to Column Metadata

Status: Deferred.

Many columns have long names like `"Engaging with or fantasizing about what arouses me feels therapeutic or healing to me" (vmq8jqw)`. Adding a short `displayName` (e.g., "Therapeutic arousal") improves UI readability.

**Approach**: Generate from column name by:
1. Stripping the `(id)` suffix
2. Truncating to ~40 characters with ellipsis if needed
3. Manual overrides for key columns (demographics, OCEAN, derived scores)

Store in a separate `src/lib/schema/display-names.ts` mapping file rather than regenerating the full JSON.

### 4.3 Update Contracts and Types

Status: Implemented.

Add to `ColumnMetadataSchema` in `src/lib/api/contracts.ts`:
```typescript
nullMeaning: z.enum(["GATED", "LATE_ADDED", "NOT_APPLICABLE", "UNKNOWN"]).default("UNKNOWN"),
```

Add to `ColumnMetadata` in `src/lib/schema/types.ts`:
```typescript
nullMeaning?: "GATED" | "LATE_ADDED" | "NOT_APPLICABLE" | "UNKNOWN";
```

---

## 5. Files Index

### Files to Create

| File | Phase | Purpose |
|------|-------|---------|
| `src/components/stat-card.tsx` | 1 | Reusable stat card component |
| `src/components/data-table.tsx` | 1 | Reusable editorial-styled data table |
| `src/components/section-header.tsx` | 1 | Numbered section header component |
| `src/lib/format.ts` | 1 | Shared formatting utilities |
| `src/routes/columns.tsx` | 2 | Column Atlas page |
| `src/components/column-inspector.tsx` | 2 | Column detail panel |
| `src/components/missingness-badge.tsx` | 2 | Null meaning badge component |
| `src/components/sample-size-display.tsx` | 2 | N display component |
| `src/components/pivot-matrix.tsx` | 2 | Pivot table component |
| `src/components/ui/button.tsx` | 1 | shadcn button primitive |
| `src/components/ui/input.tsx` | 1 | shadcn input primitive |
| `src/components/ui/textarea.tsx` | 1 | shadcn textarea primitive |
| `src/components/ui/select.tsx` | 1 | shadcn select primitive |
| `src/components/ui/checkbox.tsx` | 1 | shadcn checkbox primitive |
| `src/components/ui/badge.tsx` | 1 | shadcn badge primitive |
| `src/components/ui/table.tsx` | 1 | shadcn table primitive |
| `src/lib/utils.ts` | 1 | `cn()` utility for class merging |
| `src/lib/schema/null-meaning.ts` | 4 | nullMeaning inference utility |
| `src/routes/relationships.tsx` | 3 | Relationship Finder page |
| `scripts/precompute-relationships.ts` | 3 | Build-time relationship computation |
| `src/lib/schema/relationships.generated.json` | 3 | Precomputed relationship data |
| `src/lib/schema/display-names.ts` | 4 | Short display names for columns |
| `src/routes/notebook.tsx` | 4 | Exploration Notebook page |
| `src/lib/notebook-store.ts` | 4 | localStorage notebook persistence |
| `src/lib/cell-hygiene.ts` | 4 | Small-cell suppression utilities |

### Files to Modify

| File | Phase | Changes |
|------|-------|---------|
| `src/styles.css` | 1 | Design tokens, fonts, paper texture |
| `src/routes/__root.tsx` | 1, 2, 3, 4 | Restyle nav, add new page links |
| `src/routes/index.tsx` | 1, 2 | Restyle, add dashboard recipes |
| `src/routes/explore.tsx` | 1, 2 | Restyle, pivot matrix, Cramer's V |
| `src/routes/profile.tsx` | 1, 3 | Restyle, guardrails, over-indexing, comparison |
| `src/routes/sql.tsx` | 1, 3 | Restyle, templates, click-to-insert |
| `src/lib/schema/types.ts` | 4 | Add nullMeaning type |
| `src/lib/api/contracts.ts` | 4 | Add nullMeaning to schema |
| `src/lib/schema/metadata.ts` | 4 | Derive `nullMeaning` in API schema output |
| `scripts/profile-schema.mjs` | 4 | Compute nullMeaning per column |

---

## 6. Reusable Infrastructure

### Existing Utilities to Leverage

| Utility | Location | Use For |
|---------|----------|---------|
| `useDuckDBQuery(sql)` | `src/lib/duckdb/use-query.ts` | All client-side data queries |
| `useDuckDB()` | `src/lib/duckdb/provider.tsx` | Direct DuckDB access for complex multi-step queries |
| `quoteIdentifier()` | `src/lib/duckdb/sql-helpers.ts` | Safe column name quoting in generated SQL |
| `quoteLiteral()` | `src/lib/duckdb/sql-helpers.ts` | Safe value quoting in WHERE clauses |
| `buildWhereClause()` | `src/lib/duckdb/sql-helpers.ts` | Filter-to-SQL conversion |
| `getSchema()` | `src/lib/client/api.ts` | Fetching column metadata (all pages need this) |
| `getCaveatKeysForColumn()` | `src/lib/schema/caveats.ts` | Looking up caveats for badges |
| `CAVEAT_DEFINITIONS` | `src/lib/schema/caveats.ts` | Rendering caveat explanations |
| `getSchemaMetadata()` | `src/lib/schema/metadata.ts` | Server-side metadata access |

### Patterns to Follow

- **Data fetching**: `useEffect` + `getSchema()` for metadata, `useDuckDBQuery(sql)` for data
- **SQL generation**: `useMemo` to build SQL from state, pass to `useDuckDBQuery`
- **API contract**: all server endpoints use `okResponse()` / `errorResponse()` from `api-response.ts`
- **Type safety**: Zod schemas in `contracts.ts` for all API boundaries

---

## 7. Dependency Order

```
Phase 1 (Design System)
  └── Task 1.1 CSS Tokens
  └── Task 1.2 Root/Nav (depends on 1.1)
  └── Tasks 1.3-1.6 Page Restyles (depend on 1.1, independent of each other)
  └── Task 1.7 Shared Components (depends on 1.3-1.6 being complete)

Phase 2 (Core UX) — depends on Phase 1
  └── Task 2.1 Column Atlas (independent)
  └── Task 2.2 Column Inspector (depends on 2.1 for housing)
  └── Task 2.3 Missingness Lens (independent, can parallelize with 2.1/2.2)
  └── Task 2.4 Explore Pivot Matrix (independent)
  └── Task 2.5 Dashboard Recipes (independent)

Phase 3 (Advanced) — depends on Phase 2
  └── Tasks 3.1-3.3 Profile upgrades (depend on missingness lens from 2.3)
  └── Task 3.4 Relationship Finder (independent, benefits from Column Atlas)
  └── Task 3.5 SQL Console Upgrades (independent)

Phase 4 (Polish) — depends on Phase 3
  └── Task 4.1 Notebook (depends on Explore/Profile/SQL being feature-complete)
  └── Task 4.2 Small-Cell Hygiene (can run anytime)
  └── Task 4.3 MCP Service B (independent)
  └── Task 4.4 URL State (depends on pages being feature-complete)
```

---

## 8. Open Questions

1. **Font self-hosting vs. Google Fonts CDN**: Google Fonts CDN is simpler but adds an external dependency and a FOUT flash. Self-hosting gives more control. Recommendation: start with Google Fonts CDN, switch to self-hosted if latency is noticeable.

2. **Relationship precomputation scope**: 365 columns produce ~66k pairs. Filtering to columns with nullRatio < 0.7 and cardinality < 100 reduces this significantly. Need to verify the filtered set size and computation time before committing to build-time vs. on-demand.

3. **Notebook persistence**: localStorage is simple but limited (~5MB). If users generate many large snapshots, may need IndexedDB. Start with localStorage, migrate if needed.

4. **Column display names**: Manual curation of 365 display names is labor-intensive. Start with automated truncation + manual overrides for the ~50 most important columns (demographics, OCEAN, derived scores).
