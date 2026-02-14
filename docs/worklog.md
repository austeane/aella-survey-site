# Worklog

## 2026-02-14

### Explore hub + nav dropdown implementation (mobile-first)

**Plan document**: `docs/plans/completed/2026-02-14-explore-hub-nav-dropdown.md`

- Implemented route split:
  - `/explore` -> new Explore hub page (`src/routes/explore/index.tsx`)
  - `/explore/crosstab` -> existing compare-questions experience (`src/routes/explore/crosstab.tsx`)
  - removed legacy `src/routes/explore.tsx`
- Implemented new nav model in `src/routes/__root.tsx`:
  - Desktop top-level reduced to 5 links (`Home`, `Explore`, `SQL Console`, `Notebook`, `About`)
  - Explore desktop dropdown with 5 grouped destinations
  - Mobile Explore expandable group with ARIA (`aria-expanded`, `aria-controls`), Escape support, and close-on-navigation behavior
- Added Home header CTA (`Start Exploring`) linking to `/explore` in `src/routes/index.tsx`.
- Migrated crosstab deep links to `/explore/crosstab` in:
  - `src/routes/index.tsx`
  - `src/routes/about.tsx` (Try This links)
  - `src/routes/data-quality.tsx`
  - `src/routes/relationships.tsx`
  - `src/components/column-inspector.tsx`
- Updated navigation and crosstab styles in `src/styles.css` for:
  - featured Explore treatment
  - desktop dropdown panel/items
  - mobile group/sub-item interactions
  - focus-visible states and mobile touch target sizing
- Updated route tree generation (`src/routeTree.gen.ts`) for new route structure.
- Updated E2E specs for new route/nav behavior:
  - `e2e/navigation.spec.ts`
  - `e2e/explore.spec.ts`
  - `e2e/dashboard.spec.ts`
  - `e2e/profile-rel-sql-notebook.spec.ts` (relationships deep-link expectation + current profile copy labels)

**Docs sync (CLAUDE.md + META-PLAN session hygiene):**
- Archived plan from active to completed:
  - `docs/plans/completed/2026-02-14-explore-hub-nav-dropdown.md`
- Updated route surface docs:
  - `docs/design/architecture.md`
  - `docs/design/deployment.md`
- Updated route pointer in `CLAUDE.md` to reflect Explore hub + crosstab file split.

**Verification:**
- `pnpm check-types` -> pass
- `pnpm test --run` -> pass
- `pnpm test:e2e -- e2e/navigation.spec.ts e2e/explore.spec.ts e2e/dashboard.spec.ts` -> pass (48 tests)
- `pnpm test:e2e -- e2e/profile-rel-sql-notebook.spec.ts` -> intermittent failures in pre-existing SQL/Notebook flows (`query_limit` input stabilization, occasional `page.goto("/sql")` abort), while updated relationships deep-link expectation to `/explore/crosstab` passes.

### V3 UX overhaul execution + documentation sync

**Plan document**: `docs/plans/active/v3-ux-overhaul.md`

- Completed v3 implementation phases in app code and findings pipeline:
  - Question-first home route on `/` with featured chart explorer, question cards, build-your-own chart controls, and trust block.
  - Existing dashboard moved to `/data-quality` to preserve expert diagnostics behind progressive disclosure.
  - Plain-language navigation/copy pass across key routes (`/columns`, `/profile`, `/relationships`, `/about`, root nav).
  - Explore route reordered to chart-first flow with "Edit this chart" control section and new tooltip primitives.
- Completed findings curation integration from deep-analysis wave outputs:
  - `analysis/build_findings.py` now emits wave-2 metadata per preset (`evidenceTier`, `effectSizeNote`, `riskFlags`, `riskNotes`, `recommendedForHome`, `curationNotes`).
  - Canonical artifacts regenerated:
    - `analysis/findings.json`
    - `docs/schema/interesting-findings.md`
  - `analysis/tests/test_findings.py` updated to validate wave-2 metadata shape.
- Wired app defaults to findings artifacts:
  - `src/lib/chart-presets.ts` now exports canonical `FEATURED_PRESETS`, `QUESTION_CARDS`, and `DEFAULTS_BY_PAGE` from `analysis/findings.json`.
  - Explore/Profile/Relationships/Columns/Home now consume curated defaults instead of hardcoded seeds.
- Added preset validation tooling:
  - `scripts/validate-chart-presets.mjs`
  - `package.json` script: `pnpm validate-chart-presets`

**Verification rerun (2026-02-14):**
- `uv run --project analysis python analysis/build_findings.py` pass
- `uv run --project analysis pytest analysis/tests -q` pass (19 tests)
- `pnpm validate-chart-presets` pass (10/10 presets)
- `pnpm check-types` pass
- `pnpm build` pass
- `pnpm test --run` pass (130 tests, unit scope)
- Test-runner split follow-up complete: Vitest now scoped in `vite.config.ts` to `src/**/*.test.{ts,tsx}` and Playwright remains separate via `pnpm test:e2e`

**Docs sync (session hygiene):**
- Updated `docs/plans/active/v3-ux-overhaul.md` from draft plan to implemented status with completed-phase summary and current verification state.
- Updated `CLAUDE.md` pointers to include v3 plan + findings docs and current routes/commands.

## 2026-02-13

### UX excellence plan implemented (all phases)

**Plan document**: `docs/plans/active/ux-excellence.md`

- Implemented pivot "Other" bucket SQL drill-down fix by carrying bucket metadata through `PivotCellDetail` and generating `IS NOT NULL` + `NOT IN (...)` predicates in Explore.
- Added shared label/display-name utility module: `src/lib/format-labels.ts`.
  - Centralized `formatValueWithLabel`, `candidateValueKeys`, and `getColumnDisplayName`.
- Added `displayName` to metadata pipeline and contracts:
  - `scripts/profile-schema.mjs` now generates `displayName`.
  - `src/lib/schema/types.ts` and `src/lib/api/contracts.ts` updated.
  - Regenerated `src/lib/schema/columns.generated.json`.
- Built searchable combobox component (`src/components/column-combobox.tsx`) and replaced large column `<Select>` controls in:
  - `src/routes/explore.tsx`
  - `src/routes/profile.tsx`
  - `src/routes/relationships.tsx`
  - `src/routes/index.tsx`
- Completed URL state coverage:
  - Explore: `x`, `y`, `normalization`, `topN`, `filterColumn`, `filterValues`
  - Profile: `mode`, `c0-c2`/`v0-v2`, `ac0-ac2`/`av0-av2`, `bc0-bc2`/`bv0-bv2`
  - Relationships: `column`
- Added notebook source URL support:
  - `src/lib/notebook-store.ts` now stores optional `sourceUrl`
  - Explore/Profile/SQL now write `sourceUrl`
  - Notebook route renders `Open source` link
- Polish items shipped:
  - "Uniqueness Percentile" renamed to "Cohort Rarity" with note ("100% minus cohort share")
  - Dashboard "Updated" dateline now uses `schema.dataset.generatedAt`
  - Added cross-page links:
    - Dashboard analysis-friendly columns -> Explore
    - Column Inspector related columns -> Relationships
    - About page "Try This" deep links
- Added phase-aware loading UX:
  - `src/lib/duckdb/init.ts` now emits `idle -> downloading-wasm -> initializing -> loading-parquet -> ready`
  - `src/lib/duckdb/provider.tsx` exposes `phase`
  - New `src/components/loading-skeleton.tsx`
  - Replaced route-level "Loading schema metadata..." text in Explore/Profile/Dashboard with phase-aware skeletons
- Validation:
  - `pnpm check-types` pass
  - `pnpm test --run` pass (130 tests)
  - `pnpm build` pass

### AI agent documentation surface implemented

**Plan document**: `docs/plans/completed/2026-02-13-ai-agents-docs.md`

- Added `src/routes/llms[.]txt.ts` as a server route that returns dynamic `text/plain` AI docs at `/llms.txt`.
- `/llms.txt` now pulls dataset counts from `getSchemaMetadata()` and visible columns from `listColumns()`, so row/column details stay synced with schema metadata changes.
- Added explicit MCP section (URL, transport, 5 tools, Claude/Cursor config snippets), REST section (5 endpoints), and optional links (UI/about/Zenodo).
- Added `Cache-Control` header with a 3600 second TTL for `/llms.txt`.
- Updated `/about` with Section 06 ("For AI Agents"): MCP URL callout, tool list, config snippets, REST fallback endpoints, and `/llms.txt` link.
- Updated docs to keep the new surface discoverable for agents:
  - `docs/design/architecture.md`
  - `docs/design/deployment.md`
  - `docs/design/mcps.md`
  - `CLAUDE.md`
- Archived plan to completed: `docs/plans/completed/2026-02-13-ai-agents-docs.md`

---

## 2026-02-12

### V2 Next-Steps Plan Created

**Plan document**: `docs/plans/active/v2-next-steps.md`

Comprehensive 4-phase execution plan synthesizing GPT 5.2 Pro product recommendations with a full codebase audit. Covers:
- **Phase 1**: Ink & Paper design system application (CSS tokens, font loading, restyle all 4 routes + root, extract shared components)
- **Phase 2**: Core UX upgrades (Column Atlas, Column Inspector, Missingness Lens, Explore pivot matrix with Cramer's V, dashboard recipes)
- **Phase 3**: Advanced features (Profile cohort guardrails + over-indexing + comparison, Relationship Finder, SQL Console upgrades)
- **Phase 4**: Polish (Exploration Notebook, small-cell hygiene, MCP Service B deploy, URL state)

Also includes schema enhancement plan (add `nullMeaning`, `displayName` fields), files index, dependency graph, and reusable infrastructure catalog.

---

### Session 2 - Parallel agent buildout

**DuckDB-WASM client-side queries**: Adding browser-side DuckDB-WASM so UI pages can query parquet directly without server round-trips. In progress.

**MCP Service B deployment**: Deploying the Python MCP server (`mcp-server/`) as a separate Railway service (Service B) for AI agent access. In progress.

**Comprehensive tests**: Adding unit and integration tests for SQL guardrails, API contracts, schema utilities, and data helpers. In progress.

**Pre-commit hooks**: Setting up husky + lint-staged to enforce lint, type-check, and test gates before every commit.

**Open decisions resolved** (PLAN.md section 13):
- Public API: broadly available with read-only guardrails
- SQL console: production, no feature flag
- MCP service: internet-exposed, no auth restriction

**Data exploration summary**: Deep exploration of the BKS dataset (15.5k rows, 365 columns) to document distributions, notable patterns, and data quality characteristics.

---

### 22:13 UTC - Deployment verification and limitation discovered
- **Status**: Railway deployment `ee1487d9-ced4-40f3-822f-0fcf0266f37f` reached `SUCCESS`.
- **Observed limitation**:
  - Production routes that execute SQL (`/api/query`, `/api/stats/:column`, `/api/crosstab`) return `400 QUERY_EXECUTION_FAILED`.
  - Non-query routes (`/`, `/explore`, `/profile`, `/sql`, `/api/health`, `/api/schema`) return `200`.
- **Likely cause**:
  - Server runtime currently depends on invoking the `duckdb` CLI binary via child process.
  - Railway runtime environment likely does not include the `duckdb` CLI executable in `PATH`.
- **Workaround plan in progress**:
  - Add runtime fallback in server DB layer to use `@duckdb/node-api` when CLI execution fails with executable-not-found.
  - Keep CLI path as first choice for local/dev compatibility.
  - Redeploy and re-run production smoke checks.
- **Next step**: implement fallback in `src/lib/server/db.ts` and redeploy.

### 22:15 UTC - Runtime fallback implemented and validated locally
- **Change**: `src/lib/server/db.ts` now attempts `duckdb` CLI first, then falls back to `@duckdb/node-api` if the CLI executable is missing (`ENOENT`).
- **Reason**: Railway runtime does not guarantee presence of `duckdb` CLI binary.
- **Validation**:
  - `pnpm check-types` pass.
  - `pnpm build` pass.
  - Simulated no-CLI environment (`PATH` without duckdb) and confirmed `/api/query` still returns `200` via Node API fallback.
- **Current status**: ready to redeploy to Railway and re-run production smoke checks.

### 22:16 UTC - Redeploy started
- **Deployment id**: `5211c45e-1325-44ff-8963-a1f95259cb4e`
- **Objective**: verify that SQL API routes recover on Railway with runtime fallback.
- **Next checks**: `/api/query`, `/api/stats/straightness`, `/api/crosstab?...` on production URL after deploy success.
- **Status update**: deployment currently `BUILDING`.
- **Status update**: deployment progressed to `DEPLOYING`.
- **Status update**: deployment reached `SUCCESS`.

### 22:18 UTC - Post-deploy regression identified and fixed
- **Observed after first fallback deploy**:
  - `/api/query` returned `500 QUERY_FAILED`.
  - `/api/stats/:column` returned `200` but with zero count fields.
- **Root cause**:
  - `@duckdb/node-api` path returns `bigint` values for aggregates.
  - `bigint` values were not normalized before JSON serialization/number parsing.
- **Workaround/fix**:
  - Added `bigint` normalization in `src/lib/server/db.ts` (`safe integer -> number`, otherwise `string`).
- **Validation in no-CLI simulation**:
  - `/api/query` -> `200` with expected rows.
  - `/api/stats/straightness` -> `200` with non-zero counts.
  - `/api/crosstab?...` -> `200` with expected counts.
- **Status**: fix validated locally; deploying updated build to Railway next.

### 22:19 UTC - Second redeploy started
- **Deployment id**: `d30133e6-8b77-4135-84f7-12451ba0f0b0`
- **Purpose**: ship bigint-normalization fix for Node API fallback path.
- **Status update**: second redeploy currently `BUILDING`.
- **Status update**: second redeploy progressed to `DEPLOYING`.
- **Status update**: second redeploy reached `SUCCESS`.

### 22:19 UTC - Production smoke checks after second redeploy
- **Production URL**: `https://bks-explorer-production.up.railway.app`
- **Smoke results**:
  - `GET /api/health` -> `200`
  - `GET /api/schema` -> `200`
  - `GET /api/stats/straightness` -> `200` with expected non-zero counts
  - `GET /api/crosstab?x=straightness&y=politics&limit=3` -> `200`
  - `POST /api/query` -> `200`
- **Current status**: deployment healthy and query endpoints operational in production.
- **Known limitation (tracked)**:
  - Runtime uses dual-path query execution (CLI first, Node API fallback). This is intentional until hosting guarantees include DuckDB CLI binary.

### Session 3 - V2 feature buildout (Phases 3-4)

**Phase 1-2 executed** by prior agent session: Ink & Paper design system, Column Atlas, Column Inspector, Missingness Lens, Explore pivot matrix with Cramer's V, dashboard recipes.

**Phase 3-4 parallel agent buildout** (this session):

1. **Profile side-by-side comparison** (Task 3.3): Added single/compare mode toggle to profile page. Compare mode runs two independent cohorts through the same analysis pipeline and displays side-by-side stat cards, delta comparison table, and dual over-indexing panels. Small-N warnings per cohort.

2. **Relationship Finder** (Task 3.4): Created precompute script (`scripts/precompute-relationships.mjs`) that computes pairwise Cramer's V (categorical) and Pearson correlation (numeric) for 159 eligible columns. Generated `src/lib/schema/relationships.generated.json` (3,065 entries). New `/relationships` page shows top related columns for any selected column with strength labels, metric badges, and clickable links to the cross-tab explorer.

3. **Exploration Notebook** (Task 4.1): Created `src/lib/notebook-store.ts` (localStorage CRUD) and `/notebook` page. Entries store query definition + results snapshot. Inline title/notes editing, delete with confirmation, JSON export.

4. **Integration work**:
   - Added Relationships and Notebook to nav links in `__root.tsx`
   - Added "Add to Notebook" buttons to Explore, Profile, and SQL pages
   - URL state sync for Columns page (column selection, search, tags, sort persist in URL)

5. **Deployment**: Triggered deploy `19b0ee28` to bks-explorer service.

**Verification**: All 121 tests pass, type-check clean, lint clean, build successful.

6. **About / Intro page** (`/about`): Created editorial intro page describing the Big Kink Survey, dataset methodology, anonymization caveats, feature guide with links to all pages, interpretation notes, and credits section linking to [Aella's blog post](https://aella.substack.com/p/heres-my-big-kink-survey-dataset) and Zenodo DOI. Added to nav.

7. **Docs updated** per session hygiene:
   - `CLAUDE.md` — updated project description, stack (DuckDB-WASM, design system), key files list (9 UI pages, notebook store, relationships JSON)
   - `PLAN.md` — marked v1 as COMPLETE, pointed to v2 plan
   - `docs/design/architecture.md` — full route coverage (9 pages), shared components inventory, key libraries list
   - `docs/design/deployment.md` — updated app surface with all 9 routes
   - `docs/plans/active/v2-next-steps.md` — marked Session 3 completions, updated deferred items
   - `docs/worklog.md` — this entry

**Final deployment**: deploy `81cdd894` to bks-explorer service (includes About page + all Session 3 work).

### 2026-02-14 UTC - V3 UX remediation execution and regression validation

- Executed `docs/plans/active/v3-ux-remediation.md` implementation work across Home, Explore, mobile nav, Relationships, Profile, Columns, and schema/value-label presentation.
- Added/updated active remediation documentation:
  - `docs/plans/active/v3-ux-remediation.md`
- Regenerated findings artifacts after plain-language preset/title updates:
  - `analysis/findings.json`
  - `docs/schema/interesting-findings.md`

- E2E suite updates completed to match the current UX and labels:
  - `e2e/dashboard.spec.ts` rewritten for current Home experience.
  - `e2e/explore.spec.ts` updated for current humanized labels and normalization controls.
  - `e2e/navigation.spec.ts` updated for current nav labels and mobile behavior.
  - `e2e/columns.spec.ts` rewritten for current Browse Topics/Question Inspector flows.
  - `e2e/profile-rel-sql-notebook.spec.ts` updated for current Profile/Relationships copy and robust SQL limit assertion.

- Validation commands and outcomes:
  - `pnpm check-types` -> pass
  - `pnpm test --run` -> pass (130 tests)
  - `pnpm build` -> pass
  - `pnpm test:e2e` -> pass (75 tests)

- Notes:
  - Vitest still reports the existing process shutdown warning (`close timed out after 10000ms`) after successful completion.
  - Build still emits existing chunk-size warnings; no functional regressions observed.
