# Worklog

## 2026-02-12

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
