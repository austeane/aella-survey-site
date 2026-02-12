# Big Kink Survey Explorer - Implementation Plan (v1)

Last updated: 2026-02-12

## 1) Product Goal

Build a production-ready web app for exploring the Big Kink Survey sample dataset and expose the same data model to AI agents through HTTP APIs and an MCP server.

Primary users:
- Human users exploring distributions, relationships, and profile comparisons.
- AI agents needing structured, queryable access to schema and summary statistics.

## 2) Ground Truth and Constraints

- Dataset: `data/BKSPublic.parquet` (15,511 rows x 376 columns).
- Cleaning caveats from source docs must be surfaced in UI/API docs:
  - Some variables are binned/combined/computed.
  - Many questions are gated; missing values are often structural, not random.
  - Some questions were added later, so missingness can be cohort/time related.
- No raw free-form SQL should run without safety limits on server or MCP.
- Python tooling must use `uv`.

## 3) Scope

### In Scope (v1)

- TanStack Start app with 4 pages:
  - `/` dashboard
  - `/explore` cross-tab explorer
  - `/profile` profile builder
  - `/sql` SQL console
- DuckDB-WASM for in-browser querying of parquet.
- Server API routes backed by DuckDB (Node).
- Python MCP server exposing safe analytics tools.
- Railway deployment for app service + MCP service.

### Out of Scope (v1)

- User accounts/auth.
- Editable/saved dashboards.
- Real-time collaboration.
- Multi-dataset upload.
- Causal inference features.

## 4) Success Criteria

### User Experience
- Initial app shell visible in < 2s on broadband desktop.
- DuckDB-WASM ready in < 5s on first load for typical laptop.
- Core charts update after filter change in < 1s for common queries.

### API / Agent Reliability
- `GET /api/schema` p95 < 500ms.
- `GET /api/stats/:column` p95 < 1s.
- `POST /api/query` p95 < 2s for bounded queries.
- API and MCP return typed errors (not raw stack traces).

### Correctness
- Shared column metadata used consistently by UI, API, and MCP.
- Structural-missingness caveats are visible in docs and API responses where relevant.

## 5) Architecture

### Web App
- TanStack Start + React + Tailwind v4 + shadcn/ui.
- DuckDB-WASM in browser for interactive client-side analytics.
- Feature modules under `src/features/*`; thin route files in `src/routes/*`.

### Server API
- TanStack Start/Nitro server handlers for `/api/*`.
- DuckDB Node bindings to query `data/BKSPublic.parquet`.
- Read-only query model with query guards and row/time limits.

### MCP Service
- Python MCP server (`mcp-server/server.py`) using DuckDB Python bindings.
- Tools return structured JSON matching API metadata conventions.

### Deployment Model
- Railway Service A: web app runtime (not static-only, because `/api/*` is dynamic).
- Railway Service B: MCP container runtime.

## 6) Canonical Project Layout

```text
kink/
├── data/
│   ├── BKSPublic.parquet
│   ├── BKSPublic_column_notes.txt
│   └── Big Kink Survey (970k cleaned).md
├── public/
│   └── BKSPublic.parquet                 # copied at build or predev script
├── src/
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── explore.tsx
│   │   ├── profile.tsx
│   │   ├── sql.tsx
│   │   └── api/
│   │       ├── schema.ts
│   │       ├── query.ts
│   │       ├── stats.$column.ts
│   │       └── crosstab.ts
│   ├── features/
│   │   ├── dashboard/
│   │   ├── explorer/
│   │   ├── profile/
│   │   └── sql-console/
│   ├── lib/
│   │   ├── duckdb/
│   │   │   ├── init.ts
│   │   │   ├── provider.tsx
│   │   │   └── use-query.ts
│   │   ├── schema/
│   │   │   ├── columns.generated.json
│   │   │   ├── caveats.ts
│   │   │   └── categories.ts
│   │   └── api/
│   │       └── contracts.ts
│   └── components/ui/
├── scripts/
│   ├── profile-schema.ts                 # generate columns.generated.json
│   └── sync-public-data.ts               # copy parquet to public/
├── mcp-server/
│   ├── pyproject.toml
│   ├── server.py
│   └── Dockerfile
├── package.json
└── railway.toml
```

## 7) Milestones (Delivery-Oriented)

### M0 - Scaffold and Data Profiling

Deliverables:
- Project scaffold with TanStack Start, Tailwind v4, shadcn/ui baseline.
- `scripts/sync-public-data.ts` to copy parquet to `public/`.
- `scripts/profile-schema.ts` to generate `columns.generated.json` containing:
  - name
  - inferred logical type (`categorical|numeric|boolean|text|unknown`)
  - null ratio
  - approx cardinality
  - category tags (`demographic|ocean|fetish|derived|other`)

Acceptance criteria:
- `pnpm dev` runs.
- Parquet is loadable from browser and server contexts.
- `columns.generated.json` checked in and reproducible.

### M1 - Shared Data Contract Layer

Deliverables:
- `src/lib/api/contracts.ts` with Zod schemas for all API request/response shapes.
- `src/lib/schema/caveats.ts` with documented caveats (binned/combined/gated/late-added).
- Reusable utilities for formatting null/implicit-zero caveat hints.

Acceptance criteria:
- API handlers and UI both consume same contracts.
- Invalid API payloads return `400` with structured error object.

### M2 - Vertical Slice (UI + API)

Deliverables:
- Dashboard route with 3-5 stable charts using client-side DuckDB-WASM.
- `GET /api/schema` fully implemented from generated metadata.
- One end-to-end flow: pick a variable, fetch summary, render chart.

Acceptance criteria:
- Manual smoke test passes for dashboard and `/api/schema`.
- No chart crashes on high-null columns.

### M3 - Explorer, Profile, and SQL Console

Deliverables:
- `/explore`:
  - x/y variable pickers
  - auto chart mapping:
    - categorical x categorical -> heatmap/table
    - categorical x numeric -> box/violin summary
    - numeric x numeric -> scatter/hexbin fallback
  - demographic filters
- `/profile`:
  - input controls for selected demographic and preference columns
  - "people like you" percentile summaries
- `/sql`:
  - editor + schema sidebar + results grid + CSV export

Acceptance criteria:
- Query cancellation works for long-running client-side queries.
- All 3 pages handle empty/NA-heavy results gracefully.

### M4 - API Hardening

Deliverables:
- `POST /api/query`, `GET /api/stats/:column`, `GET /api/crosstab`.
- Query guardrails:
  - read-only allowlist (`SELECT`, `WITH`, `DESCRIBE`, `EXPLAIN` optional)
  - deny mutating statements
  - max rows (default 1,000; hard cap 10,000)
  - timeout (e.g., 5s)
- Standard response envelope:
  - `{ ok: true, data, meta }`
  - `{ ok: false, error: { code, message, details? } }`

Acceptance criteria:
- Negative tests confirm blocked unsafe SQL.
- API p95 latency targets met locally on representative queries.

### M5 - MCP Server

Deliverables:
- `mcp-server/server.py` tools:
  - `get_schema`
  - `get_stats`
  - `cross_tabulate`
  - `query_data` (bounded, read-only)
  - `search_columns`
- Tool schemas align with API contracts where possible.
- Dockerfile + Railway run command.

Acceptance criteria:
- MCP client can call each tool successfully.
- Errors are typed and actionable.

### M6 - Deploy and Operate

Deliverables:
- Railway config for web + MCP services.
- Health checks and startup probes.
- Basic observability:
  - request logs
  - error logs with correlation ids
- README runbook for local/dev/prod and rollback steps.

Acceptance criteria:
- Fresh deploy from main branch succeeds.
- Smoke tests pass against production URLs.

## 8) API Contract (v1)

### `GET /api/schema`
Returns list of columns with metadata and caveats.

### `POST /api/query`
Request:
- `sql: string`
- `limit?: number`

Behavior:
- Enforce read-only SQL.
- Apply default limit if absent.

### `GET /api/stats/:column`
Returns:
- numeric: count, nulls, mean, stddev, min, p25, median, p75, max
- categorical: count, nulls, top categories with percentages
- caveat flags when column is binned/combined/computed

### `GET /api/crosstab?x=...&y=...&filters=...`
Returns cross-tab matrix plus marginal totals and null handling metadata.

## 9) Testing Strategy

### Unit
- Query guard parser/validator.
- Metadata mapper.
- Chart-type resolver logic.

### Integration
- API route tests using sample queries.
- DuckDB initialization and parquet loading.

### E2E (Playwright)
- Dashboard loads and renders charts.
- Explorer variable swap updates visualization.
- SQL console executes safe query and exports CSV.

### Smoke (Post-deploy)
- `/`
- `/api/schema`
- `/api/stats/age`
- MCP `get_schema`

## 10) Risk Register and Mitigations

- DuckDB-WASM memory pressure on low-end devices.
  - Mitigation: lazy-load heavy views, fallback to server API mode toggle.
- Misinterpretation from structural missingness.
  - Mitigation: explicit caveat labels in tooltips/API metadata.
- SQL abuse or runaway queries.
  - Mitigation: strict read-only checks, timeout, row caps.
- Schema drift between data and metadata.
  - Mitigation: metadata generation script in CI/check step.
- Sensitive-content handling and moderation concerns.
  - Mitigation: clear content warning and neutral wording in UI labels.

## 11) Implementation Sequence (Recommended)

1. M0 scaffold + metadata generation.
2. M1 contracts and caveat model.
3. M2 vertical slice to de-risk integration.
4. M3 feature pages.
5. M4 API hardening.
6. M5 MCP service.
7. M6 deployment + runbook.

## 12) Definition of Done (v1 Release)

- All milestone acceptance criteria satisfied.
- Core routes and API endpoints documented.
- Deploy pipeline green for app + MCP.
- Manual exploratory QA complete with no P0/P1 bugs.

## 13) Open Decisions to Resolve Early

- Should public API expose row-level query results broadly, or only aggregate endpoints?
- Should SQL console be available in production to all users or feature-flagged?
- Should MCP service be internet-exposed or restricted by network/auth token?
