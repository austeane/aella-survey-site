# UX Excellence Plan — BKS Explorer

**Status:** Implemented in code on 2026-02-13.

## Implementation Status

- [x] Phase 1: "Other" pivot cell SQL fix
- [x] Phase 2A: Value labels surfaced across Explore/Profile/Dashboard/Pivot Matrix
- [x] Phase 2B: `displayName` added to schema metadata, API contracts, and UI selectors
- [x] Phase 3: Searchable column combobox implemented and integrated
- [x] Phase 4A: URL state completed for Explore, Profile, and Relationships
- [x] Phase 4B: Notebook entries now store and render source URLs
- [x] Phase 5A: "Uniqueness Percentile" renamed to "Cohort Rarity" with explanatory note
- [x] Phase 5B: Dashboard "Updated" date now uses dataset metadata timestamp
- [x] Phase 5C: Cross-page navigation links added (Dashboard, Column Inspector, About examples)
- [x] Phase 5D: DuckDB init phases + loading skeleton component integrated

## Context

A UX review of the production site identified 10 improvement areas. Two were excluded by the user (privacy mode and SQL safe mode — anyone exploring this data knows what they're doing). Small-cell suppression was already removed in a prior change. This plan covers the remaining 8 improvements, grouped into 5 phases ordered by impact: correctness, readability, shareability, polish.

---

## Phase 1: Fix "Other" Pivot Cell Broken SQL

**Problem:** Clicking an "Other" cell in the pivot matrix generates `WHERE col = 'Other'` — which matches nothing because "Other" is a synthetic UI bucket, not a real data value. Users click, get zero results, lose trust.

**Files:**
- `src/components/pivot-matrix.tsx` — extend `PivotCellDetail` to carry bucket metadata
- `src/routes/explore.tsx` — fix SQL generation in `sqlForCell` useMemo (lines 286-311)

**Changes:**
1. Add `xIsOther`, `yIsOther`, `topXValues`, `topYValues` fields to `PivotCellDetail` interface
2. Populate them in the cell click handler (pivot-matrix.tsx lines 168-178) — the `topX`/`topY` arrays already exist at line 84-85
3. In explore.tsx `sqlForCell`, when `xIsOther` is true, generate `NOT IN (topValues...)` + `IS NOT NULL` instead of `= 'Other'`; same for y axis

**Verify:** Select a cross-tab with more categories than topN, click an "Other" cell, confirm SQL produces valid results.

---

## Phase 2: Value Labels + Column Display Names

### 2A: Value Labels Everywhere

**Problem:** 60+ columns have human-readable value labels (e.g., `5 → "Extremely arousing"`) defined in `src/lib/schema/value-labels.ts`, but they only render in Column Inspector. Everywhere else shows raw numeric codes.

**Files:**
- New: `src/lib/format-labels.ts` — extract `formatValueWithLabel()` + `candidateValueKeys()` from column-inspector.tsx:52-65
- `src/components/column-inspector.tsx` — import from shared utility instead of inline
- `src/components/pivot-matrix.tsx` — accept optional `xValueLabels`/`yValueLabels` props, format headers and row labels
- `src/routes/explore.tsx` — format filter checkboxes (line 472), DataTable fallback (line 544), selected cell display
- `src/routes/profile.tsx` — format value selector options (line 580), over-indexing "Value" column (line 808)
- `src/routes/index.tsx` — format dashboard categorical top values (lines 447-465)

### 2B: Column Display Names

**Problem:** Dropdowns show raw column names like `"I am aroused by being dominant in sexual interactions" (6w3xquw)` — long, ugly, unscannable.

**Files:**
- `src/lib/schema/types.ts` — add `displayName?: string` to `ColumnMetadata`
- `src/lib/api/contracts.ts` — add `displayName: z.string().optional()` to schema
- `scripts/profile-schema.mjs` — generate display names:
  - Quoted strings `"<text>" (<id>)` → extract just the text, truncate ~60 chars
  - Simple identifiers (`straightness`) → title-case (`Straightness`)
- `src/lib/format-labels.ts` — add `getColumnDisplayName(column)` returning `displayName ?? name`
- All dropdown sites: explore.tsx (lines 365, 382, 400), profile.tsx (line 553), relationships.tsx (line 90), index.tsx (line 396)

**Verify:** Run `pnpm profile-schema`, confirm `columns.generated.json` has `displayName` fields. Check dropdowns show short names.

---

## Phase 3: Searchable Column Combobox

**Problem:** Plain `<Select>` dropdowns with 365 items and no search. Painful to find a specific column.

**Files:**
- New: `src/components/column-combobox.tsx`
- Replace `<Select>` in: explore.tsx (X/Y/filter selectors), profile.tsx (field selectors), relationships.tsx (target column), index.tsx (column inspector selector)

**Design:**
- Trigger button styled like existing `<SelectTrigger>` (Ink & Paper: no border-radius, bordered)
- Opens a dropdown with `<Input>` search + `<ScrollArea>` button list (same pattern as sql.tsx:268-289)
- Each item shows `displayName` primary, `column.name` secondary in faded mono text
- Click selects and closes; keyboard nav with arrow keys + Enter
- Depends on Phase 2B for display names (can use `column.name` as fallback if 2B not done)

**Verify:** Open Explore, search for "straight" in X column combobox, confirm it filters and selects correctly.

---

## Phase 4: URL State + Notebook URL

### 4A: Complete URL State

**Current coverage:**
- Explore: has `x`, `y` only — **missing** `normalization`, `topN`, `filterColumn`, `filterValues`
- Columns: complete
- SQL: complete
- Profile: **no URL state**
- Relationships: **no URL state**

**Pattern:** TanStack Router `validateSearch` + `useNavigate({ replace: true })` — same as columns.tsx:21-28, 59-68.

**Files & URL params:**
- `src/routes/explore.tsx` — extend `validateSearch` to include `normalization`, `topN`, `filterColumn`, `filterValues` (comma-separated). Init state from params. Sync back on change.
- `src/routes/profile.tsx` — add `validateSearch` with `mode`, filter slot columns (`c0`/`c1`/`c2`) and values (`v0`/`v1`/`v2`), comparison slots (`ac0`-`ac2`/`av0`-`av2`, `bc0`-`bc2`/`bv0`-`bv2`). Init from params, sync back.
- `src/routes/relationships.tsx` — add `validateSearch` with `column`. Init `selectedColumn` from param.

### 4B: Notebook Stores URL

**Files:**
- `src/lib/notebook-store.ts` — add `sourceUrl?: string` to `NotebookEntry`
- `src/routes/explore.tsx`, `profile.tsx`, `sql.tsx` — pass current URL in `addNotebookEntry()` calls
- `src/routes/notebook.tsx` — render sourceUrl as a clickable link per entry

**Verify:** Set up an Explore cross-tab with filters, copy URL, open in new tab, confirm it restores. Save to notebook, confirm notebook entry has clickable link back.

---

## Phase 5: Polish

### 5A: Rename "Uniqueness Percentile" → "Cohort Rarity" (~5 lines)
- `src/routes/profile.tsx` line 759: change `label="Uniqueness Percentile"` → `label="Cohort Rarity"`
- Add explanatory note: `"100% minus cohort share"`
- Rename variable `uniquenessPercentile` → `cohortRarity` + update `ProfileSummary` interface

### 5B: Fix Dashboard Date (~3 lines)
- `src/routes/index.tsx` line 232: replace `new Date().toLocaleDateString()` with `schema.dataset.generatedAt` date
- Move inside the `{schema ? ...}` conditional

### 5C: Cross-Page Navigation (~40 lines)
- **Dashboard** (index.tsx): make "Most Analysis-Friendly Columns" names link to `/explore?x={name}`
- **Column Inspector** (column-inspector.tsx): add "Related Columns" section using `relationships.generated.json` — show top 3, link to `/relationships?column={name}`
- **About** (about.tsx): add 2-3 "Try this" example links (e.g., `/explore?x=straightness&y=politics`)

### 5D: Loading Skeletons (~100 lines)
- `src/lib/duckdb/init.ts` — add phase callback to `createDb()`: idle → downloading-wasm → initializing → loading-parquet → ready
- `src/lib/duckdb/provider.tsx` — expose `phase` in context value
- New: `src/components/loading-skeleton.tsx` — skeleton variants (stat-grid, table, panel) with `animate-pulse`, Ink & Paper styling
- Replace all "Loading schema metadata..." strings across route files with `<LoadingSkeleton>` + phase label

**Verify:** Hard-refresh the app, confirm skeletons appear with phase text instead of plain "Loading..." strings. Confirm phases transition correctly.

---

## Phase Dependencies

```
Phase 1 (Other cell fix) ──── independent, ship first
Phase 2A (value labels)  ──── independent
Phase 2B (display names) ──── independent, requires pnpm profile-schema
Phase 3 (combobox)       ──── benefits from 2B (uses displayName)
Phase 4A (URL state)     ──── independent
Phase 4B (notebook URL)  ──── depends on 4A
Phase 5A-5B              ──── independent, trivial
Phase 5C (cross-links)   ──── benefits from 4A (URL params in links)
Phase 5D (loading)       ──── independent
```

## Verification Plan

After each phase:
1. `pnpm check-types` — types pass
2. `pnpm test --run` — all tests pass
3. `pnpm dev` — manual smoke test of affected pages
4. After all phases: `pnpm build` + deploy to Railway, verify prod

## Verification Results (2026-02-13)

- `pnpm check-types` — pass
- `pnpm test --run` — pass (130 tests)
- `pnpm build` — pass
- Manual `pnpm dev` and Railway deploy verification remain as follow-up runtime checks
