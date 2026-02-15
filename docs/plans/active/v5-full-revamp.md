# V5 Full Revamp: Profile + Relationships

## Context

A real user tested the app and gave three pieces of feedback: (1) duplicate question names on /relationships make it useless, (2) /profile results should be visual like the home page charts, (3) /profile layout and compare mode are confusing. Rather than patch these individually, we're doing a full revamp of both pages — the most ambitious version possible, building the statistically interesting stuff but wrapping it in UX that's fascinating to non-statisticians. Things that don't work out get discarded. No conservatism.

## Architecture Decisions

### Visualization: D3 alongside Recharts
- **Recharts stays** for standard bar/line charts (home page, simple profile charts)
- **D3 added** for: distribution plots, force-directed network graph, horizontal comparison bars, radar fingerprint
- Pattern: "D3 for math, React for rendering" — D3 computes scales/paths/layouts, React renders SVG elements
- Dependencies: `d3-scale`, `d3-array`, `d3-shape`, `d3-force` (~40KB gzipped total)
- Both consume `chart-config.ts` Ink & Paper tokens

### Computation: Almost everything client-side
- 15,503 rows is small — even 176-column UNION ALL runs in <1s in DuckDB-WASM
- Confidence intervals: analytical (Wilson score for proportions, SE-based for medians) — not bootstrap
- Bootstrap CIs are a possible later enhancement but analytical CIs cover 95% of needs
- Build-time precomputation only for: `approxTopValues` in schema, reference effect sizes, relationship clusters

### New file structure
```
src/components/charts/
  chart-config.ts                    # existing — extend with D3 helpers + compare-mode tokens
  bar-chart.tsx                      # existing
  line-chart.tsx                     # existing
  grouped-bar-chart.tsx              # existing
  percentile-chart.tsx               # NEW — bar chart with 50% reference line (Recharts)
  over-index-chart.tsx               # NEW — horizontal paired bars (D3 + React SVG)
  distribution-strip.tsx             # NEW — gradient density strip with cohort overlay (custom SVG)
  dumbbell-chart.tsx                 # NEW — A-vs-B connected dot comparison (D3 + React SVG)
  cohort-fingerprint.tsx             # NEW — radar/radial chart for 7 personality metrics (D3 + React SVG)
  network-graph.tsx                  # NEW — force-directed relationship graph (D3 + Canvas)
  mini-heatmap.tsx                   # NEW — tiny 5x5 crosstab preview (Canvas)

src/lib/statistics/
  confidence.ts                      # NEW — Wilson CI, SE-based CI, reliability score
  effect-context.ts                  # NEW — effect size contextualization against reference benchmarks
  reference-effects.json             # NEW — precomputed landmark effect sizes (build artifact)

src/lib/duckdb/
  profile-queries.ts                 # NEW — extracted SQL generators for profile + comparison
  sql-helpers.ts                     # existing
```

---

## Phase 1: Schema Enrichment + Relationships Disambiguation

**Goal:** Fix the immediate user complaint (can't tell questions apart) and lay data groundwork for everything else.

### 1a. Add `approxTopValues` to schema generation

**File: `scripts/profile-schema.mjs`**

For each categorical column with `approxCardinality <= 120`, compute top 5 values:
```sql
SELECT cast("col" AS VARCHAR) AS value, count(*)::BIGINT AS cnt
FROM data WHERE "col" IS NOT NULL
GROUP BY 1 ORDER BY cnt DESC LIMIT 5
```

Store as `approxTopValues: string[]` on each column in `columns.generated.json`.

**File: `src/lib/schema/types.ts`** — add `approxTopValues?: string[]` to `ColumnMetadata`

**File: `src/lib/api/contracts.ts`** — add to Zod schema so API preserves it

### 1b. Relationships table disambiguation

**File: `src/routes/relationships.tsx`**

Change the "Related Question" cell from just the display name to a two-line layout:
- Line 1: display name (existing link to crosstab)
- Line 2: top 3 answer values from `approxTopValues`, formatted in JetBrains Mono at 0.72rem, `var(--ink-faded)`

Example rendering:
```
Of these options, which one is the most erotic?
Verbal degradation · Public humiliation · Cuckoldry
```

Show subtitles for ALL rows (not just duplicates) — it adds relevance even when names are unique.

### 1c. Question identity card component

**New file: `src/components/question-identity-card.tsx`**

Reusable component showing full question metadata: display name, column technical name, type, response count, top answer options, tags. Used on relationships page when a question is selected (replaces the bare combobox label).

**Verification:** Run `pnpm profile-schema`, confirm `approxTopValues` appears in `columns.generated.json`. Load /relationships, verify duplicate "Of these options..." questions are now distinguishable.

---

## Phase 2: Profile Page — Chart-First Single Mode

**Goal:** Replace tables with charts as the primary view. Narrative flow instead of data dump.

### 2a. Percentile chart (Section 03)

**New file: `src/components/charts/percentile-chart.tsx`**

Horizontal diverging dot plot (lollipop style) for the personality metrics. Each metric gets a row:
- Dot at the cohort's global percentile (0-100 scale)
- Thin stem extending from the 50th percentile reference line to the dot
- Dots right of 50: `--accent` (red). Dots left: `--ink-light`
- Reference line at 50 in `--rule`

Expand metrics from 5 to 7: add `agreeablenessvariable` and `consciensiousnessvariable` (both 0% null, available for all respondents).

Update `runSingleCohort` to also return `cohortMean`, `cohortSD`, and `cohortN` per metric (needed for CI computation in Phase 3).

**Data source:** `summary.percentileCards` — already computed, just needs the extra fields.

### 2b. Over-index chart (Section 04)

**New file: `src/components/charts/over-index-chart.tsx`**

Horizontal HTML "table-with-bars" layout (not Recharts — long labels wreck SVG axes):
- Each row: label (left), two inline bars (group% in accent, global% in ink-faded), ratio label (right)
- Sorted by ratio descending
- Labels: `"Column: Value"` format, truncated at 45 chars with tooltip for full text
- Built with D3 `scaleLinear` for bar widths, rendered as HTML `<div>` elements with inline widths

Show top 12 over-indexed items (up from 8). Also show bottom 5 under-indexed items (ratio < 1.0) in a separate "Less common in your group" subsection.

**Data source:** `summary.overIndexing` — modify query to return both directions (add `ORDER BY ratio ASC LIMIT 5` union).

### 2c. Profile page layout restructure

**File: `src/routes/profile.tsx`**

Restructure results into narrative sections:
```
01. Choose your group           [existing, keep]
02. Your group at a glance      [stat cards — existing, clean up into single identity panel]
03. Personality snapshot         [NEW: percentile chart from 2a]
04. What stands out              [NEW: over-index chart from 2b]
05. Explore deeper               [NEW: links to crosstab/relationships for top traits]
```

Each chart section has a "Show data table" toggle (using `<details><summary>`) that reveals the existing DataTable beneath.

### 2d. Expand candidate columns

**File: `src/routes/profile.tsx` line 512-520**

Change filter from `demographic || ocean` to `demographic || ocean || fetish`. Remove `.slice(0, 30)` cap. Sort by `nullRatio` ascending (most-answered first), take first 100.

This is where the "wow, I didn't know my group was into THAT" discoveries come from. The existing `cohort_count >= 30` filter naturally prunes noise.

For gated columns (`nullMeaning === "GATED"`), add an `isGated: boolean` flag to over-indexing results. Display a subtle marker (small "g" badge) with tooltip: "Comparison is among people who answered this question."

**Verification:** `pnpm dev`, navigate to /profile, select a cohort, verify charts render above tables. Verify expanded column set produces more interesting over-indexing results. Check that long labels don't overflow.

---

## Phase 3: Confidence Intervals + Visual Small-N Degradation

**Goal:** Instead of warning banners, the visualizations themselves communicate reliability. Uncertainty becomes visual "resolution" — blurry when uncertain, sharp when confident.

### 3a. Statistical utilities

**New file: `src/lib/statistics/confidence.ts`**

```typescript
/** Wilson score 95% CI for a proportion */
function wilsonCI(successes: number, n: number): { lower: number; upper: number }

/** Standard error-based CI for a median (approximation) */
function medianCI(sd: number, n: number): { lower: number; upper: number }

/** Reliability score: sigmoid mapping N to 0-1 */
function reliabilityScore(n: number): number
// N=30 → 0.35, N=50 → 0.50, N=100 → 0.82, N=200 → 0.99

/** Visual style derived from reliability */
function getConfidenceStyle(n: number): {
  opacity: number;       // 0.3 to 1.0
  dashArray: string;     // '' | '6 3' | '4 4' | '2 4'
  ciMultiplier: number;  // 1.0 to 8.0 (widens CI bands)
  label: string;         // 'high confidence' | 'good' | 'approximate' | 'exploratory' | 'too few'
}
```

### 3b. Integrate confidence into charts

Every chart component accepts a `reliability` or `cohortN` prop:
- **Percentile chart:** CI bands as semi-transparent rectangles around each dot. Width scales with `1/sqrt(N)`. At N < 50, dots become semi-transparent.
- **Over-index chart:** Bars fade in opacity. CI error markers on bar ends. At N < 30, entire section shows a "too few for reliable analysis" overlay instead of faded-out bars.
- **Stat cards:** Replace binary warning banner with a continuous "confidence indicator" — a small graduated bar showing N-based reliability.

### 3c. Remove binary warning banners

Replace the existing `getWarning()` function (which shows banners at N < 30 and N < 100) with the continuous degradation system. The data still works at small N — it just looks increasingly tentative.

**Verification:** Test with a very rare cohort (N ~40). Charts should render but visibly degraded — faded bars, wide CI bands, "approximate" label. Test with N > 500 cohort — full opacity, narrow CIs, "high confidence."

---

## Phase 4: True A-vs-B Comparison Engine

**Goal:** Compare mode becomes "what's actually different between these two groups" — not two separate "vs global" views.

### 4a. Direct comparison query

**New file: `src/lib/duckdb/profile-queries.ts`**

Extract and extend SQL generation from `profile.tsx`. New function:

```typescript
function buildDirectComparisonQuery(
  conditionA: string, conditionB: string, candidateColumns: string[]
): string
```

Single query that computes for each column+value: `pctA`, `pctB`, `absDelta`, `countA`, `countB`. Ranks by `absDelta` (percentage-point difference — more interpretable than ratio for A-vs-B). Returns top 20.

For numeric metrics (personality/kink scores): compute `medianA`, `medianB`, `meanA`, `meanB`, `sdA`, `sdB`, `nA`, `nB`. Cohen's d computed client-side from these.

### 4b. Compare mode UI restructure

**File: `src/routes/profile.tsx`**

New compare results flow:
```
C1. Dual identity cards           [side-by-side cohort summaries]
C2. Fingerprint comparison        [overlaid percentile chart — two dots per row, A vs B]
C3. What's actually different     [NEW: dumbbell chart of ranked A-vs-B differences]
C4. What they share               [traits where both groups over-index similarly]
C5. Individual profiles           [collapsible: each group's over-indexing vs global]
```

### 4c. Dumbbell chart component

**New file: `src/components/charts/dumbbell-chart.tsx`**

Each row shows a trait with two dots connected by a horizontal line:
- Left dot: Group A value (accent red, filled)
- Right dot: Group B value (ink, open circle)
- Line length = magnitude of difference (visual = insight)
- Sorted by line length descending (biggest differences first)
- Dashed line = low confidence (either N < 100)

The connecting line IS the story — long lines mean "these groups genuinely differ here." Short lines mean "same thing."

### 4d. Effect size contextualization

**New file: `src/lib/statistics/effect-context.ts`**
**New build artifact: `src/lib/statistics/reference-effects.json`**

Precompute ~10 landmark effect sizes from the dataset:
- Gender gap on pain preference (d=0.62) — "one of the biggest in the dataset"
- Gender gap on dominant arousal (d=0.54)
- Childhood spanking and S/M (r=0.33)
- Neuroticism and receiving pain (r=0.16)
- Politics and kink breadth (d=0.14) — "barely noticeable"

When showing an A-vs-B difference, contextualize:
> "The biggest difference between these groups is in kink breadth (26 percentile-point gap). For reference, the gender gap on pain — one of the largest effects in this dataset — is about 24 percentile points."

New build script: `scripts/precompute-reference-effects.mjs`

**Verification:** Compare two meaningfully different groups (e.g., "straight males 25-28" vs "bisexual females 25-28"). Dumbbell chart should show ranked differences. Effect size sentence should contextualize the top difference. Test with similar groups — differences should be small, lines short.

---

## Phase 5: Distribution Visualizations

**Goal:** Show WHERE people actually cluster, not just "your median is X." Full distributions make the data feel alive.

### 5a. Gradient density strip component

**New file: `src/components/charts/distribution-strip.tsx`**

Custom SVG component (not Recharts — can't do this natively). For each personality metric:
- Horizontal strip where each segment's darkness encodes how many people fall at that value
- Dark where people cluster, light where few do
- Cohort median marked with an inverted triangle
- CI bracket below the marker
- Global median marked with a thin dashed line

DuckDB SQL for histogram data:
```sql
SELECT width_bucket(metric, min_val, max_val, 40) AS bin,
  COUNT(*)::DOUBLE AS global_count,
  COUNT(*) FILTER (WHERE condition)::DOUBLE AS cohort_count
FROM data WHERE metric IS NOT NULL
GROUP BY 1 ORDER BY 1
```

### 5b. Distribution panorama section

Insert as Section 03b on the profile page (between personality snapshot and over-indexing):
- All 7 metrics shown in a vertical stack, each ~60px tall
- Behind a "Show distributions" toggle (expanded by default for N > 200, collapsed for smaller groups)
- In compare mode: two overlaid distributions per metric (A in accent, B in ink) with a "difference bracket" showing the gap between medians

### 5c. KDE overlay (optional enhancement)

Gaussian kernel density estimation computed in JS (~15 lines):
```typescript
function kde(data: number[], bandwidth: number, points: number[]): number[]
```

Renders as a smooth curve over the histogram strip — global distribution as dashed ink-light line, cohort as solid accent line. This is the "data journalism" touch that makes the distributions feel polished.

**Verification:** Check that distributions for well-known patterns match expectations (e.g., `totalfetishcategory` should be right-skewed, OCEAN variables should be roughly normal). Verify small cohorts show appropriately uncertain/wide distributions.

---

## Phase 6: Cohort Fingerprint

**Goal:** A compact visual signature that answers "what kind of group is this?" at a glance. The emotional centerpiece.

### 6a. Radar chart component

**New file: `src/components/charts/cohort-fingerprint.tsx`**

D3-computed, React-rendered SVG radar chart:
- 7 axes: kink breadth, openness, extroversion, neuroticism, agreeableness, conscientiousness, powerlessness
- All axes on 0-100 percentile scale (uniform)
- Concentric pentagon rings at 25%, 50%, 75%
- Filled polygon: cohort profile (accent at 20% opacity fill, solid accent stroke)
- 50th percentile ring highlighted in `--rule` (the "average" baseline)
- Axis labels in JetBrains Mono 9px

Why radar works here despite generally being problematic:
- Exactly 7 axes (sweet spot for radar — not 3, not 15)
- All axes are 0-100 percentile (uniform scale, no distortion)
- The SHAPE is the insight — spiky vs round profile is immediately visible
- Editorial aesthetic supports the geometric form

In compare mode: two overlaid polygons (A in accent, B in ink at 15% opacity).

### 6b. Place in profile page

Render at ~200x200px in the stat card area (Section 02), providing an at-a-glance "shape" beside the numeric identity (N, share, rarity). The fingerprint becomes the visual anchor that users remember.

**Verification:** Test with known extreme cohorts. A "high neuroticism, low extroversion" group should produce a visibly asymmetric polygon. The "average of everything" cohort should be roughly circular.

---

## Phase 7: Relationships Network Graph

**Goal:** Replace the flat table with a force-directed network that reveals the structure of how questions relate. The most ambitious single component.

### 7a. Enhance relationship precomputation

**File: `scripts/precompute-relationships.mjs`**

Add to the precomputed JSON:
- **Correlation direction** (`positive` | `negative`) — currently thrown away by `Math.abs()`
- **Cluster assignments** — run label propagation on the relationship graph (159 nodes, simple algorithm):
  1. Each node starts with its own label
  2. Iteratively adopt most common weighted label among neighbors
  3. Converge after ~10 iterations
  4. Name clusters by dominant tag + highest-degree member
- **Top co-occurrence pattern sentence** per relationship (template-based)

Enhanced data shape:
```typescript
interface EnhancedRelationshipData {
  generatedAt: string;
  columnCount: number;
  pairCount: number;
  clusters: Array<{ id: string; label: string; members: string[]; bridgesTo: string[] }>;
  relationships: Record<string, Array<{
    column: string;
    metric: "cramers_v" | "correlation";
    value: number;
    direction?: "positive" | "negative";
    n: number;
    topPattern?: string;
  }>>;
}
```

### 7b. Network graph component

**New file: `src/components/charts/network-graph.tsx`**

HTML5 Canvas renderer (not SVG — 2,113 edges would be slow in SVG) with d3-force:
- Nodes: 159 columns. Size scales with degree. Color encodes tag (fetish=accent, demographic=ink, ocean=highlight, derived=ink-light, other=rule)
- Edges: thickness encodes strength. Solid for association, dashed for correlation
- Force simulation: `forceLink` (distance inversely proportional to strength), `forceManyBody`, `forceCenter`, `forceCollide`
- Interaction: hover highlights immediate neighborhood (connected nodes/edges glow, rest fades to 15% opacity). Click selects node → transitions to detail view
- Labels: JetBrains Mono 9px, shown on hover + for top ~15 highest-degree nodes. For "Of these options..." duplicates, labels include first 2 answer values

### 7c. Three-layer page architecture

**File: `src/routes/relationships.tsx`** — complete rewrite

**Layer 1: Network Galaxy (default landing)**
- Full-width force graph (~1200x600px)
- Below: stat cells (159 questions, 2,113 connections, N clusters)
- Alternative entry: ColumnCombobox stays as search-by-name option

**Layer 2: Selected Question Detail (after clicking node or selecting from combobox)**
- Galaxy shrinks to compact mini-map (300x200px, top-right corner)
- Question identity card (from Phase 1c)
- Relationship cards in responsive grid (replaces flat table)

**Layer 3: Inline expansion (clicking a relationship card)**
- Card expands to show full PivotMatrix (reusing existing component from crosstab)
- "Open in Explore" button navigates to full crosstab page

### 7d. Relationship cards with mini-heatmaps

**New file: `src/components/charts/mini-heatmap.tsx`**

Each relationship card shows:
- Related question name + answer value subtitle (from Phase 1)
- Strength bar + human-readable label ("Moderate — a clear pattern")
- **Mini 5x5 heatmap** — DuckDB-WASM query runs on viewport entry (IntersectionObserver):
  ```sql
  SELECT cast(x AS VARCHAR) AS x, cast(y AS VARCHAR) AS y, count(*)::BIGINT AS cnt
  FROM data WHERE x IS NOT NULL AND y IS NOT NULL
  GROUP BY 1, 2
  ```
  Top 4 values + "Other" per axis. Cell intensity = row-normalized percentage mapped to accent opacity.
- **Top pattern sentence**: "People who chose X were 3.2x more likely to also choose Y"
- Link to full crosstab

### 7e. Cluster sidebar

When a question is selected, show which thematic cluster it belongs to:
- Cluster name and members
- Which other clusters it bridges to
- Click a cluster member to switch selection

**Verification:** Load /relationships. Network graph should render with visible clustering (power-exchange questions near each other, personality questions in their own cluster). Click a node — detail view should show relationship cards with mini-heatmaps loading lazily. Verify duplicate question names are fully disambiguated.

---

## Phase 8: Polish + Surprise Discoveries

### 8a. Surprise discoveries section on /profile

After the over-indexing section, show 3-5 "surprising" findings specific to this cohort, presented as narrative cards:
- Algorithm: rank all fingerprint metrics and over-indexing results by "surprise factor" (|percentile - 50| for metrics, max(ratio, 1/ratio) for traits)
- Template sentences: "Your group scores in the 78th percentile on powerlessness — higher than 78% of everyone in the dataset"
- Each card links to the relevant crosstab or relationship page for exploration

### 8b. Deep-linking

- Each over-indexed trait links to `/explore/crosstab?x=<column>&y=<filterColumn>`
- Each fingerprint metric links to `/relationships?column=<metric>`
- "Explore deeper" section at bottom of profile with curated next-step links

### 8c. Progressive loading

Profile results render in stages:
1. Stat cards + fingerprint radar (fast — 7 scalar queries)
2. Percentile chart (fast — same query)
3. Over-indexing chart (medium — UNION ALL across 100 columns, ~500ms)
4. Distribution strips (medium — 7 histogram queries)

Skeleton loaders (Ink & Paper style: thin ink-rule lines pulsing at 50% opacity) show for sections still computing.

### 8d. Responsive design

- Charts collapse to single-column below 768px
- Network graph becomes a simplified list view below 640px
- Relationship cards: 3 columns → 2 → 1 based on viewport
- Radar fingerprint scales down to 140x140px on mobile

---

## Key Files Modified (Full List)

| File | Change |
|------|--------|
| `scripts/profile-schema.mjs` | Add `approxTopValues` computation |
| `scripts/precompute-relationships.mjs` | Add clusters, correlation direction, top patterns |
| `scripts/precompute-reference-effects.mjs` | **NEW** — compute landmark effect sizes |
| `src/lib/schema/types.ts` | Add `approxTopValues` to `ColumnMetadata` |
| `src/lib/api/contracts.ts` | Add `approxTopValues` to Zod schema |
| `src/routes/profile.tsx` | Major restructure: chart-first sections, expanded columns, comparison engine, fingerprint |
| `src/routes/relationships.tsx` | Complete rewrite: three-layer network architecture |
| `src/components/charts/chart-config.ts` | Add D3 styling helpers, compare-mode color tokens |
| `src/lib/duckdb/profile-queries.ts` | **NEW** — extracted SQL generators |
| `src/lib/statistics/confidence.ts` | **NEW** — Wilson CI, reliability score, confidence styles |
| `src/lib/statistics/effect-context.ts` | **NEW** — effect size contextualization |
| `src/components/charts/percentile-chart.tsx` | **NEW** |
| `src/components/charts/over-index-chart.tsx` | **NEW** |
| `src/components/charts/distribution-strip.tsx` | **NEW** |
| `src/components/charts/dumbbell-chart.tsx` | **NEW** |
| `src/components/charts/cohort-fingerprint.tsx` | **NEW** |
| `src/components/charts/network-graph.tsx` | **NEW** |
| `src/components/charts/mini-heatmap.tsx` | **NEW** |
| `src/components/question-identity-card.tsx` | **NEW** |

## Dependencies

```
pnpm add d3-scale d3-array d3-shape d3-force
pnpm add -D @types/d3-scale @types/d3-array @types/d3-shape @types/d3-force
```

## Verification Strategy

After each phase:
1. `pnpm check-types` — no type errors
2. `pnpm test --run` — existing tests pass
3. `pnpm dev` — visual verification in browser (use Chrome MCP to screenshot)
4. Test with known cohorts: "straight males 25-28" (large N, good confidence), a very rare combo (N ~40, should show degradation), and compare mode with meaningfully different groups

End-to-end: the /profile page should tell a story that a non-statistician finds genuinely interesting, with charts that make them want to try different cohorts. The /relationships page should feel like exploring a map of how human sexuality is structured.
