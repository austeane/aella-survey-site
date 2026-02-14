# Plan: V4 Plain-Language & Layout Remediation

## Context

After implementing the V3 UX overhaul, a 4-agent visual audit swarm inspected every page using Chrome browser automation. The audit found **70+ issues** across the site: jargon leaking from the analysis pipeline into user-facing copy, layout bugs, CSS cascade problems, and inconsistent terminology. Two quick manual checks by the user independently found issues (legend/axis overlap, internal method details), confirming that a systematic sweep was needed.

**Goal**: Eliminate all jargon, fix layout bugs, and ensure every piece of user-facing text makes sense to someone who has never seen a dataset before. Progressive disclosure is fine — technical detail can exist behind expandables or on the Data Quality page — but the default surface must be plain language.

## Implementation Tracker (2026-02-14)

- [x] Phase 0 complete (`src/styles.css`, `analysis/build_findings.py`, `src/routes/profile.tsx`, `src/routes/about.tsx`)
- [x] Phase 1 complete (`analysis/build_findings.py` rewritten + regenerated `analysis/findings.json`)
- [x] Phase 2 complete (`src/routes/profile.tsx` user-facing cohort terminology replaced with group language)
- [x] Phase 3 complete (`src/routes/explore.tsx`, `src/components/missingness-badge.tsx`)
- [x] Phase 4 complete (`src/routes/columns.tsx`, `src/routes/relationships.tsx`, `src/routes/data-quality.tsx`, `src/components/column-inspector.tsx`, `src/lib/schema/caveats.ts`, `src/components/sample-size-display.tsx`)
- [x] Phase 5 complete (`src/lib/format-labels.ts` default label-only value rendering + opt-in raw value display)
- [x] Phase 6A complete (`src/components/charts/bar-chart.tsx` tooltip metric label)
- [x] Phase 6B intentionally deferred (no code change per plan)
- [x] Phase 6C intentionally eliminated (covered by Phase 1G column correction)

### Validation Log

- [x] `uv run --project analysis python analysis/build_findings.py`
- [x] `pnpm validate-chart-presets`
- [x] `pnpm check-types`
- [x] `pnpm test --run`
- [x] `pnpm build`

## Resolved Design Decisions

These questions were raised during the audit and resolved before execution:

### 1. Raw technical column names: keep faded, strip hashes
Keep the two-tier display (friendly `displayName` primary, raw column name secondary/faded). But strip the `(7char)` hash suffix from the secondary display too — it's a purely internal dedup artifact with no value even to SQL users. The `stripHashSuffix()` utility in Phase 4A handles this.

### 2. Statistical caveats: preserve in plain language
Retain statistical honesty but rewrite jargon. Examples: "in the responder subset" → "among people who answered both questions", "late-added subsample" → "a smaller group who saw this question". The site's credibility depends on not overselling findings.

### 3. Spanking preset: wrong column (critical data integrity fix)
The `spanking-childhood` preset uses the `spanking` column (sexual arousal scale: "I find spanking to be" 0-5) but the question claims to show childhood spanking frequency → adult S/M interest. That correlation is essentially tautological — people who find one S/M activity more arousing also score higher on the general S/M scale.

The **actual** childhood spanking column is `"From the ages of 0-14, how often were you spanked as a form of discipline? (p957nyk)"` with three plain-language values: Never (4,041), Sometimes (7,615), Often (3,840) — covering 15,496 respondents. The preset must be rewritten to use the correct column. This also eliminates the need for Phase 6C (numeric X-axis labels) since the real column already has plain-language labels.

---

## Phase 0: Critical CSS & Layout Bugs

These are functional bugs that affect usability across the entire site. Fix first.

### 0A. Fix global link styling (affects ALL pages)

**Problem**: The global CSS rule `a { color: inherit; text-decoration: none; }` in `src/styles.css:48-51` is unlayered. Tailwind v4 generates utilities inside CSS `@layer`, so unlayered styles win per cascade rules. Result: every `<a>` with Tailwind color/underline classes (e.g., `text-[var(--accent)] underline`) renders as plain ink text with no underline. Users cannot tell links from text.

**File**: `src/styles.css`

**Fix**: Wrap the global anchor reset inside `@layer base {}`:
```css
@layer base {
  a {
    color: inherit;
    text-decoration: none;
  }
}
```

**Verify**: Navigate to `/about` in Chrome, confirm links render in accent color with underlines. Check nav links still render correctly (they use their own classes).

### 0B. Fix X-axis label overlap on "How Fixed Are Kinks?" preset

**Problem**: The `fixity-breadth` preset has long X-axis labels ("With a lot of effort, yes", "With an extreme amount of effort, maybe") that overlap horizontally.

**File**: `analysis/build_findings.py` (source-of-truth; regenerates `analysis/findings.json`) — the SQL query for this preset generates the labels from raw survey values.

**Fix options** (pick one):
1. Rewrite the SQL `CASE` to use shorter labels: "Impossible" → "Impossible", "With an extreme amount of effort, maybe" → "Extreme effort", "With a lot of effort, yes" → "Lots of effort", etc.
2. Add `angle={-30}` to `XAxis` tick props in `src/components/charts/bar-chart.tsx` when labels exceed a threshold.

**Preferred**: Option 1 — shorter labels in the SQL. Simpler, no chart component changes.

### 0C. Fix Profile compare-mode layout overflow

**Problem**: When "Compare Two Groups" is active, the 3 field slots per group create a cramped layout with text overlapping "FIELD 1/2/3" and "VALUE" labels.

**File**: `src/routes/profile.tsx`

**Fix**: In the compare mode filter grid, stack the 3 fields vertically within each group column instead of a 3-column inner grid. Use `flex flex-col gap-3` instead of the current tight grid at narrow widths.

### 0D. Fix About page stat grid stacking

**Problem**: `.stat-cell-value` and `.stat-cell-label` are `<span>` (inline) elements. `margin-top` doesn't apply, so values and labels don't stack vertically.

**File**: `src/styles.css:254-269`

**Fix**: Add `display: block;` to both `.stat-cell-value` and `.stat-cell-label`.

### 0E. Fix MCP SERVER label running into URL on About page

**Problem**: The `<span class="mono-label">MCP SERVER</span>` and `<a>URL</a>` are both inline elements inside a `space-y-2` container, so they render on the same line as "MCP SERVERhttps://...".

**File**: `src/routes/about.tsx:329-339`

**Fix**: Add `block` class to both elements, or wrap in separate `<div>` elements.

---

## Phase 1: Rewrite Findings Source (Home Page Jargon)

All home page captions, questions, and chart labels come from generated findings data. Edit `analysis/build_findings.py` (source-of-truth), then regenerate `analysis/findings.json`. This is the highest-impact change — the home page is the first thing visitors see.

**Files**: `analysis/build_findings.py` (edit), `analysis/findings.json` (generated artifact)

### 1A. Rewrite all 10 preset `question` fields

| Preset ID | Current (jargon) | Rewrite (plain language) |
|---|---|---|
| `pain-gender` | Are men and women different on giving vs receiving pain? | ✅ Fine as-is |
| `spanking-childhood` | Do people spanked more often as kids report different adult S/M interest? | Do people who were spanked more as kids show different sadomasochism interest as adults? (⚠️ Also fix wrong column — see 1G) |
| `partner-count-openness` | Do people with more partners report different openness scores? | ✅ Fine as-is |
| `fixity-breadth` | How does arousal fixity relate to total kink breadth? | Do people whose kinks feel more permanent have a wider variety of interests? |
| `honesty-breadth` | How does self-reported honesty relate to kink breadth? | Do people who say they're more honest report more kinks? |
| `dom-sub-quadrants` | How do dominant and submissive arousal scores vary across gender-orientation quadrants? | How do dominant and submissive interests differ across gender and orientation groups? |
| `politics-breadth` | How does political leaning relate to total fetish-category count? | How does political leaning relate to how many kinks someone has? |
| `orientation-breadth` | How much does orientation shift total kink breadth? | How much does sexual orientation affect the number of kinks someone has? |
| `horny-state-breadth` | Does being horny right now change reported kink breadth? | Does being horny right now change the number of kinks someone reports? |
| `neuroticism-pain-direction` | Does neuroticism change receiving-vs-giving pain direction? | Does anxiety change whether someone prefers receiving or giving pain? |

### 1B. Rewrite all 10 preset `caption` fields

| Preset ID | Current (jargon) | Rewrite (plain language) |
|---|---|---|
| `pain-gender` | Women report higher receiving-pain interest while men report higher giving-pain interest **in the responder subset**. | Women report higher interest in receiving pain, while men report higher interest in giving pain (among people who answered both questions). |
| `spanking-childhood` | The strongest **bivariate pattern** in the current **curated set**: higher childhood spanking **bins** map to higher S/M interest. | One of the strongest patterns in the data: people who report more childhood spanking also report higher sadomasochism interest as adults. (⚠️ Caption needs revision after column fix — see 1G) |
| `partner-count-openness` | Openness rises **monotonically** across partner-count **bins**, but the absolute effect is small. | Openness rises steadily as partner count increases, but the overall difference is small. |
| `fixity-breadth` | People who report that changing arousal is impossible show the broadest kink repertoires. | ✅ Fine as-is |
| `honesty-breadth` | Respondents who report being totally honest show higher average kink breadth than mostly-honest respondents. | People who say they're totally honest report a wider range of kinks than those who say they're mostly honest. |
| `dom-sub-quadrants` | Straight men are the only **quadrant** where dominant arousal exceeds submissive arousal. | Straight men are the only group where dominant interest exceeds submissive interest. |
| `politics-breadth` | Differences exist but are modest; politics is a weak **predictor** compared with gender and personality **axes**. | Differences exist but are modest — politics matters much less than gender or personality. |
| `orientation-breadth` | Orientation differences are real but small relative to **role-direction differences**. | Orientation differences are real but small compared to dominant-vs-submissive differences. |
| `horny-state-breadth` | Current arousal state strongly shifts self-reported kink scores in the **late-added subsample**. | Being horny right now noticeably shifts how many kinks people report (based on a smaller group who saw this question). |
| `neuroticism-pain-direction` | Higher **neuroticism bins** tilt more toward receiving pain than giving pain. | People with higher anxiety scores lean more toward receiving pain than giving pain. |

### 1C. Rewrite `xLabel` / `yLabel` where needed

| Preset ID | Field | Current | Rewrite |
|---|---|---|---|
| `fixity-breadth` | yLabel | Average number of fetish categories | Average number of kink categories |
| `honesty-breadth` | yLabel | Average number of fetish categories | Average number of kink categories |
| `politics-breadth` | yLabel | Average number of fetish categories | Average number of kink categories |
| `orientation-breadth` | yLabel | Average number of fetish categories | Average number of kink categories |
| `horny-state-breadth` | yLabel | Average number of fetish categories | Average number of kink categories |

(All 5 "breadth" charts use "fetish categories" — normalize to "kink categories".)

### 1D. Fix the "straightness" reference in question cards

In `questionCards`, the prompt "What is connected to straightness overall?" should be "What is connected to sexual orientation?"

### 1E. Fix hero text inconsistency

`src/routes/index.tsx`: subtitle says "15,000" but dateline says "15,503". Change subtitle to "What over 15,000 people revealed..." for consistency.

### 1F. Fix "About the Data" section jargon

In `src/routes/index.tsx`:
- "365 columns" → "365 questions"
- "schema diagnostics and missing-answer context" → "which questions have missing answers"

### 1G. Fix `spanking-childhood` preset — WRONG COLUMN (data integrity)

**Problem**: The preset uses `spanking` (sexual arousal scale: "I find spanking to be", 0=Not arousing → 5=Extremely arousing, gated behind sadomasochism category, N=5,120) but claims to show childhood spanking frequency. The resulting correlation is tautological — "people who find an S/M activity more arousing score higher on S/M overall."

**Correct column**: `"From the ages of 0-14, how often were you spanked as a form of discipline? (p957nyk)"` — categorical, 3 values: Never (4,041), Sometimes (7,615), Often (3,840). Covers 15,496 respondents (near-universal, not gated).

**Fix in `analysis/build_findings.py`**:

1. Add column constant:
   ```python
   SPANKING_CHILDHOOD_COLUMN = '"From the ages of 0-14, how often were you spanked as a form of discipline? (p957nyk)"'
   ```

2. Rewrite the `spanking-childhood` preset:
   - `explore_x`: change from `"spanking"` to `"From the ages of 0-14, how often were you spanked as a form of discipline? (p957nyk)"`
   - `x_label`: keep as "Childhood spanking frequency" (now accurate)
   - `sql`: rewrite to query the correct column, with `CASE WHEN` to order Never < Sometimes < Often:
     ```sql
     SELECT
       {SPANKING_CHILDHOOD_COLUMN} AS name,
       round(avg("sadomasochism")::DOUBLE, 2) AS value,
       CASE {SPANKING_CHILDHOOD_COLUMN}
         WHEN 'Never' THEN 1
         WHEN 'Sometimes' THEN 2
         WHEN 'Often' THEN 3
       END AS sort_order
     FROM data
     WHERE {SPANKING_CHILDHOOD_COLUMN} IS NOT NULL
       AND "sadomasochism" IS NOT NULL
     GROUP BY 1, 3
     ORDER BY sort_order
     ```
   - `risk_flags`: remove `"gated_selection_bias"` (this column is not gated)
   - `evidence_tier`: re-evaluate after regeneration (the signal may be weaker or stronger with the correct column)
   - `caption`: rewrite after seeing actual data — will depend on whether the pattern holds with the correct column

3. Regenerate findings: `uv run --project analysis python analysis/build_findings.py`

4. Validate: `pnpm validate-chart-presets`

**Note**: This also eliminates Phase 6C entirely — the correct column already has plain-language labels (Never/Sometimes/Often), so no numeric bins to decode.

---

## Phase 2: Profile Page — "Cohort" → "Group" + Jargon Cleanup

**Problem**: The page title says "Build a Profile" and subtitle says "Pick a group", but results use "cohort" 97 times. Plus several other jargon terms.

**File**: `src/routes/profile.tsx` (97 occurrences of "cohort")

### 2A. Rename all user-facing "cohort" text to "group"

Systematic replacements in user-facing strings only (not variable/type names):
| Current | Replacement |
|---|---|
| "Cohort Size" | "Group Size" |
| "Cohort Share" | "Group Share" |
| "Cohort Rarity" | "How Uncommon" — show as "X% of people are not in this group" |
| "Cohort Median" | "Group Median" |
| "Cohort % (N)" | "Group % (N)" |
| "Cohort A" / "Cohort B" | "Group A" / "Group B" |
| "100% minus cohort share" | Merge into "How Uncommon" card (inverse percentage is the rarity metric) |
| "Select at least one demographic value for each cohort." | "Select at least one value for each group." |
| "One or both cohorts have N < 30" | "One or both groups have fewer than 30 people" |

### 2B. Fix jargon in section titles and labels

| Current | Replacement |
|---|---|
| "Percentile Snapshot" | "How This Group Compares" |
| "Global Percentile" column | "Ranking vs. Everyone" |
| "Most Unusually Common Signals" | "What Makes This Group Different" |
| "over-indexing" | "unusually common" |
| "No over-indexing values met the N >= 30 thresholds" | "No distinctive traits found — need at least 30 people in a category to show results" |
| "Delta (B - A)" | "Difference" |
| "N < 30: Too small..." | "Fewer than 30 people — too few for meaningful results." |
| "N < 100: Treat patterns as unstable." | "Fewer than 100 people — results may not be reliable." |

---

## Phase 3: Explore Page Jargon Cleanup

**File**: `src/routes/explore.tsx`

| Current | Replacement |
|---|---|
| "Connection strength: 0.095 (negligible) \| N used: 15,503" | "How related: very weak (0.10) — based on 15,503 responses" (label first, number secondary) |
| "Show top N categories per axis" | "Maximum categories to show" |
| "Show advanced detail table" | "Show data table" |
| "Generate SQL for this cohort" | "Open in SQL Console" |
| "Open this cohort in Profile" | "Open this group in Profile" |
| "Row %" / "Column %" tooltip | Add explanatory tooltip: "Row %: percentage within each row" etc. |

**File**: `src/components/missingness-badge.tsx`

| Current Label | Replacement |
|---|---|
| "Gated" | "Not shown to everyone" |
| "Late Added" | "Added mid-survey" |
| "Unknown" | Don't show badge when value is UNKNOWN |

---

## Phase 4: Browse Topics + What's Connected + Data Quality

### 4A. Strip hash IDs from displayed question names

**Problem**: Questions show `(vmq8jqw)`, `(35jn7ey)` etc. Affects Browse Topics, What's Connected, Data Quality.

**File**: `src/lib/format-labels.ts` or a new `stripHashSuffix()` utility

**Fix**: Add a function that strips trailing ` (xxxxx)` hash patterns from display names when rendering. Apply in:
- `src/routes/columns.tsx` (column list)
- `src/routes/relationships.tsx` (related questions table)
- `src/routes/data-quality.tsx` (question tables)
- `src/components/column-inspector.tsx` (inspector subtitle)

Pattern to strip: ` (alphanumeric{5-8})` at end of string.

Important: apply this to user-facing question labels wherever they render (including secondary/raw-name lines shown under friendly names in lists/inspectors). Do **not** apply globally to backend identifiers or SQL literals.

### 4B. Browse Topics jargon (`src/routes/columns.tsx`, `src/components/column-inspector.tsx`)

| Current | Replacement |
|---|---|
| "Missingness Context" heading | "Missing Answers" |
| "Missing-answer reason: No special flag" | Hide line when value is UNKNOWN |
| "Gated Missingness" caveat title | "Skip-Logic Questions" |
| "cohort-related missingness" in caveat text | "Some questions were added later, so earlier respondents never saw them" |
| "Related Columns" heading | "Related Questions" |
| "P25" / "P75" / "Stddev" | "25th percentile" / "75th percentile" / "Spread" |

**Also update caveat copy source**: `src/lib/schema/caveats.ts`
- "Gated Missingness" title → "Skip-Logic Questions"
- "cohort-related missingness" phrasing in late-added description → plain-language equivalent

### 4C. What's Connected jargon (`src/routes/relationships.tsx`)

| Current | Replacement |
|---|---|
| Duplicate "Strength" column headers | Rename numeric column to "Score", keep bar as visual only |
| "People (N)" | "People" |
| "negligible" label | "very weak" |
| Three-decimal scores (0.146) | Two decimal (0.15) |

Consider: add a brief one-line explainer at the top of results: "Scores range from 0 (no connection) to 1 (perfect connection)."

### 4D. Data Quality jargon (`src/routes/data-quality.tsx`)

| Current | Replacement |
|---|---|
| "diagnostic metadata" in subtitle | "Coverage, missing answers, and question details" |
| "ROWS" stat card | "Respondents" |
| "Missingness Histogram" | "Missing-Answer Distribution" |
| "BUCKET" column header | "Range" |
| "Null %" column header | "Missing %" |
| "Most Analysis-Friendly Questions" | "Best-Answered Questions" |
| "Most Conditional Questions" | "Most-Skipped Questions" |
| "Question Inspector (Inline)" | "Inspect a Question" |
| Tag names "ocean", "fetish", "derived" | Use same friendly labels as Browse Topics (`LOGICAL_TYPE_LABELS` pattern) |
| "CATEGORICAL" badge | Use `LOGICAL_TYPE_LABELS` mapping ("Multiple choice") |
| "UNKNOWN" missingness badge | Don't show when UNKNOWN |
| Redundant "PEOPLE TOTAL / ANSWERED / USED" when all identical | Show single value when all three match |

**Shared component update**: `src/components/sample-size-display.tsx` should collapse duplicate counts (for example, when total = answered = used, display one value only).

---

## Phase 5: Value Label Display Format

**Problem**: Throughout the site, values render as "1.0 - Male", "-2.0 - Disagree", "3.0 - Totally agree". The numeric code prefix is the raw survey encoding and meaningless to users.

**File**: `src/lib/format-labels.ts`

**Fix**: When a human-readable label IS found, return only the label (not the numeric prefix):
```typescript
// Current: return `${value} - ${label}`;
// New:     return label;
```

**Risk**: Some contexts may actually need the numeric value (e.g., Data Quality page where the raw encoding matters, column inspector "Top Values" where it's a data-introspection tool). Add an optional parameter `includeRawValue?: boolean` that defaults to `false`. The Data Quality page and column inspector top-values section can pass `true`.

**Affected pages**: Profile (filter values, signals table), Explore (filter dropdowns), Browse Topics (column inspector top values — keep raw values here since it's introspection).

---

## Phase 6: Chart Polish

### 6A. Fix tooltip "value" label

**Problem**: Bar chart tooltips show "value : 3.33" — the label "value" is meaningless.

**File**: `src/components/charts/bar-chart.tsx`

**Fix**: Pass a `name` prop to the `<Bar>` component using the `yLabel` prop, so tooltips show the metric name instead of "value".

### 6B. Consider tightening Y-axis ranges

**Problem**: Several "breadth" charts have Y-axis 0–12 but data clusters around 9.5–10.5, making bars look flat.

**Files**: `src/components/charts/bar-chart.tsx`

**Fix**: No default code change in this pass. Recharts is already auto-scaling here; non-zero bar baselines can mislead. Treat as optional follow-up only if design review requests alternative scaling.

### 6C. ~~Add descriptive X-axis labels on childhood spanking chart~~

**Resolved**: Eliminated by Phase 1G. The correct childhood spanking column already has plain-language labels (Never/Sometimes/Often). No work needed here.

---

## Execution Order

1. **Phase 0** (Critical bugs) — 0A first (CSS affects entire site), then 0B-0E
2. **Phase 1** (findings source rewrites in `analysis/build_findings.py`, including 1G spanking column fix) — highest user-facing impact + data integrity
3. **Phase 5** (Value label format) — shared formatter used across multiple pages
4. **Phase 2** (Profile cohort→group) — systematic rename
5. **Phase 3** (Explore jargon)
6. **Phase 4** (Browse Topics / Relationships / Data Quality)
7. **Phase 6** (Chart polish — 6A tooltip fix only; 6B deferred, 6C eliminated by 1G)

Phases 2–4 can be parallelized across agents **after** Phase 5 lands.

---

## Files Modified (Summary)

| File | Phase | Change |
|---|---|---|
| `src/styles.css` | 0A, 0D | Link cascade fix, stat grid display:block |
| `analysis/build_findings.py` | 1A-1G | Rewrite findings source text, SQL label mappings, fix spanking column |
| `analysis/findings.json` | 1A-1G | Regenerated artifact after source changes |
| `src/routes/index.tsx` | 1E, 1F | Hero text, About section copy |
| `src/routes/profile.tsx` | 2A, 2B | cohort→group (97 occurrences), section titles, warning messages |
| `src/routes/explore.tsx` | 3 | Connection strength display, label rewrites |
| `src/components/missingness-badge.tsx` | 3 | Gated→"Not shown to everyone", hide UNKNOWN |
| `src/routes/columns.tsx` | 4A | Strip hash IDs |
| `src/routes/relationships.tsx` | 4C | Column headers, negligible→very weak, decimal precision |
| `src/routes/data-quality.tsx` | 4D | ~15 label/heading rewrites |
| `src/components/column-inspector.tsx` | 4B | Missingness Context→Missing Answers, P25/P75/Stddev, Related Columns→Questions |
| `src/lib/schema/caveats.ts` | 4B | Gated/late-added caveat title and copy rewrites |
| `src/components/sample-size-display.tsx` | 4D | Collapse duplicate totals/answered/used labels |
| `src/lib/format-labels.ts` | 4A, 5 | `stripHashSuffix()`, value label format change |
| `src/routes/about.tsx` | 0E | MCP SERVER label fix |
| `src/components/charts/bar-chart.tsx` | 6A | Tooltip name prop |

---

## Verification

### Automated
1. `uv run --project analysis python analysis/build_findings.py` — regenerate findings artifact after source edits
2. `pnpm validate-chart-presets` — all preset SQL queries valid against regenerated findings
3. `pnpm check-types` — no TypeScript errors
4. `pnpm test --run` — all unit tests pass
5. `pnpm build` — production build succeeds

### Visual (Chrome MCP)
1. `/about` — confirm links show accent color + underline
2. `/` — click all 10 presets, verify no jargon in questions/captions
3. `/` — verify "How Fixed Are Kinks?" X-axis labels don't overlap
4. `/` — verify "Childhood -> Kinks?" preset shows Never/Sometimes/Often on X-axis (correct column)
5. `/profile` — zero occurrences of "cohort" in rendered text
6. `/profile` — compare mode layout doesn't overflow
7. `/explore` — no "N used", "Connection strength" reads as plain language
8. `/columns` — no hash IDs visible, "Missing Answers" heading
9. `/relationships` — "very weak" instead of "negligible", 2 decimal scores
10. `/data-quality` — "Respondents" not "ROWS", "Missing %" not "Null %"
11. All pages — value dropdowns show "Male" not "1.0 - Male"
