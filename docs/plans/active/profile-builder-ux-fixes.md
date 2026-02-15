# Plan: Profile Builder UX Fixes

Status: Ready for build
Last updated: 2026-02-15

## Objective

Fix 7 profile-builder UX issues from visual review:

1. Dropdown interaction scrolls page to top
2. Spider chart labels are clipped
3. Presets do not behave correctly in compare mode
4. Wrong default starting fields
5. Long field names truncate in selector UI
6. Compare mode form layout is visually misaligned
7. Filter slots are fixed at 3 instead of dynamic

## Reality Check (validated against current code)

Reviewed on 2026-02-15:
- `src/routes/profile.tsx` (current fixed 3-slot model, hardcoded `c0/c1/c2`, stacked compare layout)
- `src/components/column-combobox.tsx` (trigger uses `h-9`; option labels use `truncate`)
- `src/components/charts/cohort-fingerprint.tsx` (container `p-2`; svg lacks overflow override)
- `src/components/ui/dialog.tsx` does not exist yet (must be added)
- `@radix-ui/react-dialog` is already installed in `package.json`

---

## Files to Modify

- `src/routes/profile.tsx` — all 7 fixes (state model, URL state, layout, preset routing)
- `src/components/column-combobox.tsx` — full label visibility + trigger height behavior
- `src/components/charts/cohort-fingerprint.tsx` — overflow/padding for axis labels
- `src/components/ui/dialog.tsx` — **new** Radix dialog wrapper

## Existing Code to Reuse

- `buildCondition()` in `src/lib/duckdb/profile-queries.ts` already supports any `FilterPair[]` length
- `getColumnDisplayName()` in `src/lib/format-labels.ts`
- Styling/token pattern in `src/components/ui/select.tsx`

---

## Implementation Details

### 1) Prevent scroll-to-top during URL sync
**File:** `src/routes/profile.tsx` (URL sync effect)

- Update `navigate({ ... })` call to include `resetScroll: false`

### 2) Fix spider chart label clipping
**File:** `src/components/charts/cohort-fingerprint.tsx`

- Add `style={{ overflow: "visible" }}` on `<svg>`
- Change chart container class from `p-2` to `px-10 py-2`

### 3) Use preferred default fields
**File:** `src/routes/profile.tsx` (schema hydration effect)

- Add `const PREFERRED_DEFAULTS = ["straightness", "age", "politics"]`
- Build defaults by preferring these columns when present, then backfill from existing demographic candidates

### 4) Convert from fixed 3 slots to dynamic slots (max 8)
**File:** `src/routes/profile.tsx`

**Constants / rules**
- Add `const MAX_FIELDS = 8`
- Keep minimum 1 slot visible per group

**State migration**
- Convert tuple states to arrays:
  - `selectedColumns`, `columnsA`, `columnsB`: `[string, string, string]` -> `string[]`
- Keep value maps (`selectedValues`, `valuesA`, `valuesB`) and derive active filters from current columns

**URL state migration**
- Parse and serialize indices `0..7` for:
  - single: `c{i}`, `v{i}`
  - compare A: `ac{i}`, `av{i}`
  - compare B: `bc{i}`, `bv{i}`
- Preserve backward compatibility with old 3-slot URLs

**Hydration + rendering updates**
- Replace hardcoded index logic with loops/helpers
- Update `renderFilterSlots` to work with `string[]`
- Add remove button (`×`) per slot when more than 1 slot remains
- Add `+ Add field` button when slot count is below `MAX_FIELDS`
- Update `applySuggestedCohort()` to `slice(0, MAX_FIELDS)`

### 5) Show full human-readable names in combobox
**File:** `src/components/column-combobox.tsx`

- Trigger button: `h-9` -> `min-h-9`
- Remove `truncate` from primary option label
- Remove `truncate` from secondary option label

### 6) Make compare mode layout symmetrical
**File:** `src/routes/profile.tsx`

- Replace independent stacked group columns with paired rows
- Build `renderSingleSlot(...)` helper for one slot cell
- Build `renderCompareSlots()` that iterates `Math.max(columnsA.length, columnsB.length)`
- Render each row as `grid grid-cols-2 gap-6` (Group A slot N vs Group B slot N)
- Keep independent `+ Add field` controls for each group below rows

### 7) Fix preset autofill behavior in compare mode
**File:** `src/routes/profile.tsx`

- Add touched state flags: `touchedA`, `touchedB`
  - set true on manual edit in each group
  - set true when preset fills that group
- Add `pendingCohort` state for conflict handling
- Extract helpers:
  - `applyCohortToGroupA(filters)`
  - `applyCohortToGroupB(filters)`
- Compare-mode preset behavior:
  - neither touched -> fill Group A
  - only A touched -> fill Group B
  - only B touched -> fill Group A
  - both touched -> open replace-choice dialog

**New file:** `src/components/ui/dialog.tsx`
- Minimal Radix wrapper: `Dialog`, `DialogOverlay`, `DialogContent`, `DialogTitle`
- Ink & Paper styling (cream background, ink border, no border radius)
- Use for pending preset prompt: “Replace Group A or Group B?” with `Replace A`, `Replace B`, `Cancel`

---

## Build Order

1. Fixes 1, 2, 3, 5 (independent, low risk)
2. Fix 4 dynamic field model (core refactor)
3. Fix 6 compare layout (depends on dynamic arrays)
4. Fix 7 preset compare logic + dialog (depends on 4 + 6)

---

## Verification

1. `pnpm check-types`
2. `pnpm test --run`
3. `pnpm build`
4. `pnpm dev` manual checks:
   - Fresh `/profile` defaults to Sexual Orientation, Age, Political Leaning
   - Opening dropdown does not scroll page
   - Long field names are fully visible in trigger and dropdown
   - Add/remove fields works (1 minimum, 8 maximum)
   - Spider chart labels are fully visible
   - Compare mode rows are visually aligned side-by-side
   - Compare preset routing:
     - untouched -> fills A
     - A touched -> fills B
     - both touched -> dialog appears
   - Refresh restores all URL-driven slots/values correctly (including >3 fields)

## Done Criteria

- All 7 UX issues above are fixed in code
- Existing 3-slot links remain compatible
- Typecheck/tests/build all pass
