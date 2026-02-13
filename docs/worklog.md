# Worklog

## 2026-02-13

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
