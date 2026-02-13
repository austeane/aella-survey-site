# Plan: Column Quality — Hide, Label, Tag, Document

## Goal

Improve column quality by:
- hiding opaque/ambiguous columns from Atlas and `/api/schema`,
- adding value labels for encoded categorical numeric columns,
- correcting obvious metadata tag errors,
- documenting the rules so this stays maintainable.

## Validation Summary (2026-02-13)

Claims in the previous draft were checked against code and data.

Verified:
- `listColumns()` and `listColumnsWithCaveats()` currently return all generated columns (no filtering yet).
- `ColumnMetadata` and `ColumnMetadataSchema` do not support `valueLabels`.
- Column Inspector currently renders raw top values only.
- `whowears`, `ascore`, `normalsex`, `knowwhatarousesyou` all exist and are plausible hide candidates.

Corrected:
- Dataset column naming is mixed. Some targets are question-text names, not short slugs.
  - Use `"I find blowjobs:" (yuc275j)`, not `blowjobs`.
  - Use `"I find dirtytalking erotic" (947wne3)`, not `dirtytalk`.
  - Replace `begging1`/`begging2` with:
    - `"I find scenarios where I eagerly beg others to be:" (jvrbyep)`
    - `"I find scenarios where others eagerly beg me to be:" (stmm5eg)`
- OCEAN columns are `*variable` fields with range `-6..6`; they are not agreement-scale categorical columns.
- Main fetish/arousal columns in this parquet are `0..5` (compressed), not `[0,1,2,3,5,8]`.
- `marriage100blood` is mis-tagged as demographic because `demographicHints` contains `"age"` and `"marriage100blood"` contains `"age"`; this is not a `"male"` match.
- `knowwhatarousesyou` is a numeric companion to `"You ______ what arouses you (7mz0awx)"` but not a clean 1:1 duplicate.

---

## Step 1: Add hidden column support

**New file: `src/lib/schema/column-flags.ts`**

Export:
- `HIDDEN_COLUMNS: Set<string>`
- `isHiddenColumn(name: string): boolean`

Initial hidden set:
- `whowears` — opaque weighted composite (50-1600)
- `ascore` — opaque composite score (0-236)
- `normalsex` — negated vanilla scale encoding
- `knowwhatarousesyou` — ambiguous numeric companion to text question

**Modify: `src/lib/schema/metadata.ts`**
- Add `listAllColumns()` returning raw generated columns.
- Make `listColumns()` return non-hidden columns.
- Make `listColumnsWithCaveats()` return non-hidden columns with caveats/value labels.
- Keep `getColumnMetadata()` backed by all columns (hidden columns still resolvable for direct API consumers).

**Modify: `src/routes/columns.tsx`**
- Replace hardcoded subtitle text `all 365 columns` with copy that does not assume fixed visible count.

## Step 2: Add value label mappings

**New file: `src/lib/schema/value-labels.ts`**

Export:
- `getValueLabels(columnName: string): Record<string, string> | null`

Use these base scale maps:

```ts
const AROUSAL_SCALE_0_TO_5 = {
  "0": "Not arousing",
  "1": "Slightly arousing",
  "2": "Somewhat arousing",
  "3": "Moderately arousing",
  "4": "Very arousing",
  "5": "Extremely arousing",
};

const VANILLA_AROUSAL_NEGATED = {
  "0": "Not arousing",
  "-1": "Slightly arousing",
  "-2": "Somewhat arousing",
  "-3": "Moderately arousing",
  "-5": "Very arousing",
  "-8": "Extremely arousing",
};

const AGREEMENT_SCALE = {
  "3": "Totally agree",
  "2": "Agree",
  "1": "Somewhat agree",
  "0": "Neutral",
  "-1": "Somewhat disagree",
  "-2": "Disagree",
  "-3": "Totally disagree",
};
```

### 2A) Explicit vanilla-scale columns (exact names)

Apply `VANILLA_AROUSAL_NEGATED` to:
- `normalsex`
- `cunnilingus`
- `"I find blowjobs:" (yuc275j)`
- `"I find cunnilingus:" (jn2b355)`
- `"I find dirtytalking erotic" (947wne3)`

### 2B) Explicit arousal-scale columns

Apply `AROUSAL_SCALE_0_TO_5` to the current arousal/fetish intensity columns (existing short slugs plus question-text variants). Minimum required set for this plan:
- `worshipped`, `worshipping`, `teasing`, `frustration`, `secretions`, `clothing`, `eagerness`, `gentleness`, `humiliation`, `incest`, `mentalalteration`, `multiplepartners`, `mythical`, `nonconsent`, `objects`, `powerdynamic`, `pregnancy`, `roles`, `sadomasochism`, `sensory`, `toys`, `transform`, `vore`, `brutality`, `creepy`, `dirty`, `abnormalbody`, `bestiality`, `appearance`, `lightbondage`, `mediumbondage`, `extremebondage`, `genderplay`, `exhibitionself`, `exhibitionother`, `voyeurself`, `voyeurother`, `masterslave`, `fulltimepower`, `cgl`, `futa`, `mindbreak`, `obedience`, `spanking`, `givepain`, `receivepain`, `progression`, `regression`, `gratification`, `penetration`, `penetration2`, `oralsexanimal`, `oralsexanimal2`
- `"I find scenarios where I eagerly beg others to be:" (jvrbyep)`
- `"I find scenarios where others eagerly beg me to be:" (stmm5eg)`

### 2C) Custom label maps

- `animated`: `-2..2` live-action <-> animated
- `written`: `-2..2` visual <-> written
- `violentporn`: `0..4`
- `inducefetish`: `0..3`
- `allrollidentity`: include keys `-2, -1, 1, 2` (note: current sample only shows `-1, 1, 2`)
- `highenergy`: include keys `-3..3` (note: current sample only shows `-3..2`)
- `supernatural`: agreement-style `-3..3`

**Modify:**
- `src/lib/schema/types.ts` — add `valueLabels?: Record<string, string>`
- `src/lib/api/contracts.ts` — add optional `valueLabels` to `ColumnMetadataSchema`
- `src/lib/schema/metadata.ts` — attach `valueLabels` in `listColumnsWithCaveats()`
- `src/components/column-inspector.tsx` — render `value + label` in Top Values when a label exists

## Step 3: Add caveats for opaque and negated encodings

**Modify: `src/lib/schema/caveats.ts`**

Add caveat keys:
- `opaque_composite`
- `negated_scale`

Pattern assignment:
- `opaque_composite` -> `whowears`, `ascore`
- `negated_scale` -> `normalsex`, `cunnilingus`, `"I find blowjobs:" (yuc275j)`, `"I find cunnilingus:" (jn2b355)`, `"I find dirtytalking erotic" (947wne3)`

**Modify: `src/lib/api/contracts.ts`**
- Extend `CaveatKeySchema` with new keys.

## Step 4: Fix schema tag inference

**Modify: `scripts/profile-schema.mjs`**

Add missing fetish hints/overrides for columns currently tagged `other` but representing fetish intensity (including `worshipped`, `worshipping`, `teasing`, `frustration`, `clothing`, `secretions`, `eagerness`, `gentleness`, `incest`, `multiplepartners`, `mythical`, `nonconsent`, `objects`, `pregnancy`, `roles`, `sensory`, `toys`, `vore`, `brutality`, `creepy`, `dirty`, `bestiality`, `appearance`, `cgl`, `futa`, `spanking`, plus `jvrbyep`/`stmm5eg` beg-scenario columns).

Fix demographic false positive:
- Exclude `marriage100blood` from demographic matching (it currently matches `"age"` inside `"marriage"`).

## Step 5: Regenerate metadata

Run:
1. `pnpm profile-schema`

## Step 6: Documentation

**New file: `docs/schema/column-quality.md`**

Document:
- hidden columns and rationale,
- value-label scale definitions and assignment strategy,
- caveat meanings (`opaque_composite`, `negated_scale`),
- known observed anomalies:
  - `highenergy` currently lacks `+3` values in sample output,
  - `allrollidentity` currently lacks `-2` and `0` in sample output,
- maintenance workflow when new columns are added.

---

## Files Modified (summary)

| File | Change |
|------|--------|
| `src/lib/schema/column-flags.ts` | **NEW** — hidden column list |
| `src/lib/schema/value-labels.ts` | **NEW** — scale + custom label mappings |
| `src/lib/schema/types.ts` | Add optional `valueLabels` |
| `src/lib/schema/metadata.ts` | Add `listAllColumns()`, filter hidden in public lists, attach `valueLabels` |
| `src/lib/schema/caveats.ts` | Add `opaque_composite`, `negated_scale`, and patterns |
| `src/lib/api/contracts.ts` | Add `valueLabels`, extend caveat enum |
| `src/components/column-inspector.tsx` | Render value labels in Top Values |
| `src/routes/columns.tsx` | Remove hardcoded “365 columns” copy |
| `scripts/profile-schema.mjs` | Tag fixes (fetish hints/overrides + demographic exclusion) |
| `docs/schema/column-quality.md` | **NEW** — column quality documentation |

## Verification

1. `pnpm profile-schema` — regenerated metadata has expected tag changes.
2. `pnpm check-types` — all type and schema changes compile.
3. `pnpm test --run` — tests pass.
4. Add/adjust tests:
   - `src/lib/schema/metadata.test.ts`:
     - hidden columns absent from `listColumns()` and `listColumnsWithCaveats()`,
     - hidden columns still accessible via `getColumnMetadata()`,
     - `valueLabels` present for known labeled columns.
   - `src/lib/schema/caveats.test.ts` and `src/lib/schema/caveats.extended.test.ts`:
     - `opaque_composite` and `negated_scale` are assigned correctly.
   - `src/lib/api/contracts.test.ts`:
     - new caveat keys and `valueLabels` parse correctly.
5. Manual UI/API checks:
   - `/columns`: hidden columns do not appear in Atlas list.
   - Column `worshipped`: Top Values show labels (for example, `3 — Moderately arousing`).
   - Column `"I find blowjobs:" (yuc275j)`: labels render with `negated_scale` caveat.
   - Column `written`: custom labels render.
   - `/api/schema`: hidden columns excluded; labeled columns include `valueLabels`.
