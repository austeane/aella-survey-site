# Plan: V3 UX Overhaul (Question-First Home + Plain-Language Navigation)

Status: Implemented  
Last updated: 2026-02-14

## Objective

Shift the app from a data-quality-first dashboard to a lay-person-first experience:

1. Lead with curated, visual findings on `/`.
2. Keep deep analysis available, but behind progressive disclosure.
3. Replace jargon-heavy labels/copy with plain language across key routes.

## 0. Implementation Status (2026-02-14 Execution Pass)

This execution pass implemented the planned UX overhaul end-to-end and connected the home experience to curated findings artifacts.

### Completed in this pass

- Phase 0 foundation built in `analysis/` with uv-managed scripts/tests:
  - `analysis/explore.py`, `analysis/build_findings.py`, `analysis/tests/test_findings.py`, `analysis/README.md`, `analysis/pyproject.toml`.
  - Artifacts generated: `analysis/findings.json` and `docs/schema/interesting-findings.md`.
- Wave-2 curation from `analysis/META-FINDINGS.md` and `analysis/swarm/` integrated into featured findings:
  - Added per-finding wave-2 metadata (`evidenceTier`, `effectSizeNote`, `riskFlags`, `riskNotes`, `recommendedForHome`, `curationNotes`) in `analysis/findings.json`.
  - Replaced weak seed presets with stronger/clearer alternatives (`fixity-breadth`, `honesty-breadth`, `dom-sub-quadrants`, `horny-state-breadth`, `neuroticism-pain-direction`).
- Phase 1 preset hardening and tooling:
  - `src/lib/chart-presets.ts` now consumes canonical findings output.
  - Added `scripts/validate-chart-presets.mjs` and `pnpm validate-chart-presets`.
- Phase 2 + 3 route overhaul:
  - New question-first home on `/`: `src/routes/index.tsx`.
  - Prior dashboard preserved at `/data-quality`: `src/routes/data-quality.tsx`.
  - Home includes featured chart explorer, build-your-own controls, question cards, and trust/context block with URL state (`?chart=`) support.
- Phase 4 navigation and copy rewrite:
  - Plain-language nav labels in `src/routes/__root.tsx`.
  - Route copy updates in `src/routes/columns.tsx`, `src/routes/profile.tsx`, `src/routes/relationships.tsx`, `src/routes/about.tsx`.
  - About deep links corrected to real columns.
  - `DEFAULTS_BY_PAGE` wiring applied in Home/Explore/Profile/Relationships/Columns.
- Phase 5 explore flow/tooltips:
  - Explore reordered to visual-first flow in `src/routes/explore.tsx`.
  - Tooltip primitive added in `src/components/ui/tooltip.tsx` and applied to high-friction controls.

### Current risk / follow-up

- No open functional regressions from v3 implementation verification.
- Test runner split is now explicit: Vitest runs unit suites and Playwright is available via `pnpm test:e2e`.

## Seed Content (Historical Baseline Before Phase 0 Curation)

These are the starting content candidates. Phase 0 confirms values, wording, and ordering, then writes the canonical versions to `analysis/findings.json` and `docs/schema/interesting-findings.md`.

### Featured Findings (target: 10 presets)

1. `pain-gender` - Who likes giving vs receiving pain?
2. `politics-kinks` - Do conservatives or liberals have more kinks?
3. `spanking-childhood` - Does childhood spanking predict adult spanking interest?
4. `introversion-masochism` - Introversion and sadomasochism.
5. `gender-tolerance` - Gender-intolerant childhoods and gender play.
6. `orientation-dominance` - Orientation/sex and power dynamics.
7. `partner-count-openness` - Partner count and personality openness.
8. `neuroticism-obedience` - Neuroticism and obedience/submission interest.
9. `agreeableness-bondage` - Agreeableness and bondage interest.
10. `nonconsent-gender` - Nonconsent fantasy by sex.

### Home Question-Card Seeds (6-8 prompts)

1. Are men or women more into bondage and pain?
2. Does personality predict what you're into?
3. How does childhood shape adult desires?
4. What do conservatives vs liberals fantasize about?
5. Are introverts into different kinks than extroverts?
6. Do people with more partners have different personality profiles?
7. Which groups are more into power dynamics?
8. What kinds of fantasies are most connected?

### Plain-Language Term Mapping (v1)

| Technical term | User-facing replacement |
|---|---|
| Null ratio | Data coverage / % answered |
| Cardinality | Number of answer choices |
| Missingness | Missing answers |
| Cramer's V | Connection strength |
| Pearson correlation | Connection strength |
| Normalization | How to count |
| Pivot table / cross-tabulate | Compare two questions |
| Gated column | Conditional question |
| Caveat | Data note |
| Non-null | Answered |
| Sample size (N) | People who answered (N) |
| Over-indexing | Unusually common in this group |
| Lift | Times more likely |

## Reality Check (Historical Baseline Before Execution)

This plan was updated against current repo state, not a greenfield assumption.

Reviewed context:
- `src/routes/index.tsx`
- `src/routes/explore.tsx`
- `src/routes/__root.tsx`
- `src/routes/about.tsx`
- `src/routes/columns.tsx`
- `src/routes/profile.tsx`
- `src/routes/relationships.tsx`
- `src/components/charts/*`
- `src/lib/chart-presets.ts`
- `docs/plans/active/v2-next-steps.md`
- `docs/plans/active/ux-excellence.md`
- `docs/worklog.md`

### Findings (ordered by severity)

1. Critical: preset SQL reliability is not production-ready.  
   A validation run against `data/BKSPublic.parquet` showed 4/10 presets fail:
   - `politics-kinks` (type mismatch: `VARCHAR` vs integer comparisons)
   - `gender-tolerance` (type mismatch: `VARCHAR` vs integer comparisons)
   - `partner-count-openness` (type mismatch: `VARCHAR` vs integer comparisons)
   - `spanking-childhood` (`ORDER BY "spanking"` not grouped)

2. High: `/` is still "Dataset Dashboard", not an approachable landing experience.  
   The current home route is data quality and schema-heavy, which matches expert workflows but not first-time casual users.

3. High: navigation and page copy still expose internal/statistical jargon.  
   Examples: "Relationship Finder", "Cross-Tab Explorer", explicit metric names in user-facing descriptions.

4. Medium: charting infrastructure already exists and should be reused, not rebuilt.  
   Existing assets: `recharts` dependency, `src/components/charts/*`, and `src/lib/chart-presets.ts`.

5. Medium: at least one About deep link uses non-existent column names (`gender`, `relationshipstyle`) and silently falls back in Explore.

## Scope

In scope:
- Foundational data exploration workspace for future agent reuse.
- New question-first home page on `/`.
- Existing dashboard moved to `/data-quality`.
- Chart preset hardening and validation tooling.
- Navigation and copy rewrite for plain language.
- Explore page flow improvement (visual-first).
- Reusable tooltip support for controls.

Out of scope for this pass:
- New backend services.
- New data ingestion pipelines.
- Recomputing global relationship matrices.
- Full design-system rewrite (already done in v2).

## Implementation Plan

## Phase 0 - Foundational Data Workspace (P0)

Goal: create a reproducible, agent-friendly data exploration foundation before UI work.

Why first:
- Future Codex agents need trusted, runnable examples for how to query and validate this parquet.
- A scripted baseline reduces repeated ad-hoc SQL mistakes (type assumptions, label handling, null semantics).

Files:
- `analysis/pyproject.toml` (new, uv-managed)
- `analysis/README.md` (new)
- `analysis/explore.py` (new, reproducible EDA/query runner)
- `analysis/build_findings.py` (new, emits curated findings artifacts)
- `analysis/tests/test_findings.py` (new, pytest validations)
- Optional: `analysis/notebooks/explore.ipynb` (only if we need visual ad-hoc work)

Recommended approach:
1. Prefer `.py` scripts + tests as source of truth (diff-friendly, CI-friendly).
2. Keep notebook optional and derivative, not required for core validation.

Tasks:
1. Initialize uv analysis workspace:
   - Dependencies: `duckdb`, `pandas`, `pytest` (optional: `matplotlib`, `seaborn`, `jupyter`)
   - Document commands in `analysis/README.md`
2. Add `analysis/explore.py`:
   - Loads `data/BKSPublic.parquet`
   - Prints schema/type profile for high-traffic columns (preset columns + nav demo columns)
   - Provides reusable query helpers (safe identifier quoting, null filtering patterns)
3. Add `analysis/build_findings.py`:
   - Runs curated finding queries
   - Writes machine-readable artifact: `analysis/findings.json`
   - Writes human-readable artifact: `docs/schema/interesting-findings.md`
   - Writes question-card copy candidates and page-default presets
   - Re-ranks seed examples by signal + clarity and can replace weak seeds
   - Records query SQL, row counts, and generated timestamp for traceability
4. Add test coverage in `analysis/tests/test_findings.py`:
   - Each curated query executes without error
   - Returns non-empty rows
   - Output schema matches expected keys per chart type
   - Guardrails for known categorical-label columns (`politics`, `sexcount`, `childhood_gender_tolerance`)
   - Ensures all 10 featured preset IDs have findings output entries
5. Add a single entry command:
   - `uv run python analysis/build_findings.py`
   - `uv run pytest analysis/tests -q`

Required output shape for `analysis/findings.json`:
- `featuredPresets`: array with `id`, `title`, `question`, `caption`, `sql`, `rowCount`, `exploreX`, `exploreY`, `chartType`, `status`
- `questionCards`: array with `prompt`, `presetId` or `deepLink`
- `defaultsByPage`: object with `home`, `explore`, `relationships`, `profile`, `columns`
- `termMappings`: array of `{ technical, plainLanguage }`

Acceptance:
- `analysis/` can be bootstrapped from README without tribal knowledge.
- Curated findings are reproducible via one command.
- Tests fail if a future preset/query regresses or relies on invalid type assumptions.
- Phase 0 artifacts preserve concrete content decisions (not just query mechanics).
- Final examples are data-validated, not just manually chosen seed copy.

## Phase 1 - Stabilize Chart Presets (P0)

Goal: make curated charts reliable before UI rollout.

Files:
- `src/lib/chart-presets.ts`
- `scripts/validate-chart-presets.mjs` (new)
- `package.json` (add script entry)

Tasks:
1. Fix preset SQL to match actual parquet value types:
   - `politics`, `childhood_gender_tolerance`, `sexcount` are categorical labels, not numeric codes.
   - `spanking-childhood` must sort using grouped value expression, not raw column reference.
2. Normalize output contracts by chart type:
   - Bar/line: `name`, `value`, optional `sort_order`
   - Grouped bar: `group_key` + series columns
3. Add `pnpm validate-chart-presets` script that:
   - Executes all preset SQL against `data/BKSPublic.parquet`
   - Fails non-zero on query error or zero-row preset
   - Prints preset id, row count, and output columns

Acceptance:
- Validation script passes 10/10 presets.
- No preset SQL depends on implicit numeric casting for categorical label columns.
- Presets are aligned with `analysis/findings.json` outputs where applicable.

## Phase 2 - Build New Home Experience on `/` (P0)

Goal: make landing page visual and question-driven.

Files:
- `src/routes/index.tsx` (rewrite)
- `src/components/charts/*` (reuse existing components; patch as needed)
- `src/lib/chart-presets.ts` (consumed directly)

Required sections:
1. Hero:
   - "The Big Kink Survey"
   - 1-sentence plain-language framing
2. Featured Chart Explorer:
   - Pill/tabs for preset selection
   - Active chart render
   - Caption and plain-language takeaway
   - "Explore this further" deep link to `/explore?x=...&y=...`
3. Build Your Own (v1):
   - Framing copy: "Show me [X question] broken down by [Y question]"
   - Two column selectors + chart type selector
   - Query and render a simple chart without leaving home
4. Question cards:
   - Use Phase 0 `questionCards` content (starting from seed prompts above)
   - 6-8 natural-language prompts linking to preset/deep links
5. About-the-data summary:
   - short trust/context block

Interaction requirements:
- URL state: `?chart=<preset-id>`
- Unknown `chart` param falls back to first preset
- Keyboard-accessible preset controls
- Loading skeleton while DuckDB is initializing/querying

Acceptance:
- Home renders one featured chart by default.
- Switching presets updates both chart and URL.
- Deep-link from home to Explore pre-populates X/Y.

## Phase 3 - Move Current Dashboard to `/data-quality` (P0)

Goal: preserve expert diagnostics without using it as the landing route.

Files:
- `src/routes/data-quality.tsx` (new, migrated from current home dashboard)
- `src/routes/index.tsx` (now lay-person home)

Tasks:
1. Copy current dashboard implementation into `data-quality` route.
2. Keep current data-quality widgets intact (missingness, caveats, inline inspector, etc.).
3. Ensure route-level links still work after migration.

Acceptance:
- Existing dashboard functionality remains available on `/data-quality`.
- `/` no longer shows "Dataset Dashboard".

## Phase 4 - Navigation + Copy Overhaul (P1)

Goal: reduce cognitive load from naming and jargon.

Files:
- `src/routes/__root.tsx`
- `src/routes/explore.tsx`
- `src/routes/columns.tsx`
- `src/routes/profile.tsx`
- `src/routes/relationships.tsx`
- `src/routes/about.tsx`

Nav target labels:
- Home
- Explore
- Browse Topics (current `/columns`)
- Build a Profile (current `/profile`)
- What's Connected? (current `/relationships`)
- SQL Console
- Notebook
- Data Quality
- About (footer or lower-priority nav position)

Per-page "interesting starting point" defaults:
- Home: default to top-ranked Phase 0 featured preset (`pain-gender` initial seed).
- Explore: if no URL state, load a curated starter pair from Phase 0 defaults.
- Relationships: default target column `straightness` (initial seed).
- Profile: show suggested cohort chips (initial seeds):
  - Straight males 25-28
  - Liberal females
  - Conservative non-straight
- Browse Topics (`/columns`): default sort to an "interestingness" heuristic from Phase 0 outputs.

Copy changes:
- Replace dense metric phrasing with plain language equivalents.
- Apply the Phase 0 `termMappings` table consistently across routes.
- Keep exact metrics visible where needed, but not as first-line explanatory text.
- Fix invalid About deep links so examples always map to real columns.

Acceptance:
- Primary nav labels align with plain-language targets.
- About "Try This" links open intended queries, not fallback defaults.

## Phase 5 - Explore Flow + Tooltip Layer (P1)

Goal: make `/explore` feel visual-first while retaining power features.

Files:
- `src/routes/explore.tsx`
- `src/components/ui/tooltip.tsx` (new)
- Any control-heavy route needing first-wave tooltips

Tasks:
1. Reorder Explore page:
   - Chart/Pivot visualization first
   - Results detail second
   - Controls after an "Edit this chart" anchor
2. Add lightweight tooltip primitives and apply to high-friction controls:
   - X/Y selectors
   - normalization
   - filter controls
   - topN/limit

Acceptance:
- User can interpret result before touching controls.
- Controls have concise helper text without UI clutter.

## Verification Results (2026-02-14 Re-run)

Automated:
1. `uv run --project analysis python analysis/build_findings.py` - pass
2. `uv run --project analysis pytest analysis/tests -q` - pass (19 tests)
3. `pnpm validate-chart-presets` - pass (10/10 presets)
4. `pnpm check-types` - pass
5. `pnpm test --run` - pass (unit suite scoped to `src/**/*.test.{ts,tsx}`)
6. `pnpm build` - pass

Manual:
1. Home chart switching and URL sync - implemented and exercised during development.
2. Home -> Explore deep links - implemented and exercised during development.
3. `/data-quality` parity with prior dashboard behavior - route migrated and retained.
4. Mobile pass for home and explore chart sections - not re-run in this doc-update pass.
5. About "Try This" links target real columns - fixed and manually spot-checked during implementation.

## Delivery Order (Executed)

1. Phase 0 (foundational data workspace)  
2. Phase 1 (preset stability)  
3. Phase 3 (preserve dashboard on `/data-quality`)  
4. Phase 2 (new home on `/`)  
5. Phase 4 (nav + copy)  
6. Phase 5 (explore flow + tooltips)

This order avoids launching a visual-first home on top of unstable preset SQL.
