# Plan: Observability + Claude-Queryable Analytics

Status: Implemented
Last updated: 2026-02-15

## Objective

Add production-grade observability to BKS Explorer so we can:
1. Debug backend/API issues from structured logs.
2. Capture product usage + frustration signals.
3. Let Claude answer questions directly from analytics data via DuckDB SQL.

## Implementation Snapshot (completed 2026-02-15)

- ✅ Phase 1 — Pino structured logging added across API routes.
- ✅ Phase 2 — `/api/events` ingestion + JSONL event store with daily rotation.
- ✅ Phase 3 — client tracking (`track.ts`) wired into page views + core interaction points.
- ✅ Phase 4 — `/api/analytics` endpoint with API-key auth + read-only bounded SQL.
- ✅ Phase 5 — UI error boundary added and instrumented.
- ✅ Phase 6 (optional) — MCP `query_analytics` proxy tool added.

## Non-Goals (for this implementation)

- No external SaaS analytics vendor.
- No UI dashboard in the app.
- No user identity tracking or persistent cookies.
- No long-term event warehouse migration (JSONL on Railway volume is enough for now).

---

## Reality Check (validated against current code on 2026-02-15)

- API routes exist at:
  - `src/routes/api/query.ts`
  - `src/routes/api/crosstab.ts`
  - `src/routes/api/stats.$column.ts`
  - `src/routes/api/schema.ts`
  - `src/routes/api/feedback.ts`
  - `src/routes/api/health.ts`
- All API routes currently return typed envelopes via `okResponse` / `errorResponse` from `src/lib/server/api-response.ts`.
- There is currently **no logger**, **no event tracking**, and **no error boundary**.
- App is base-path aware (`/survey` in prod), so any client tracking endpoint must use `import.meta.env.BASE_URL` (not hardcoded `/api/...`).
- DuckDB server query utilities live in `src/lib/server/db.ts` and currently assume parquet-backed `data` view.
- Existing rate limiting (`src/lib/server/rate-limit.ts`) is feedback-specific and too strict for beacon traffic.

---

## Architecture (locked)

```text
Browser
  └─ track(...) batch
      └─ POST /api/events
          └─ append JSONL (daily files) on Railway volume

Claude / internal tooling
  └─ POST /api/analytics (API key required)
      └─ DuckDB SQL over read_json_auto('events-*.jsonl')
```

### Key decisions

1. **Storage format**: newline-delimited JSON (JSONL), one event per line.
2. **File rotation**: daily files, e.g. `events-2026-02-15.jsonl`.
3. **Storage path**: `BKS_ANALYTICS_DIR` env var.
   - Railway: `/data/analytics`
   - Local default: `<repo>/data/analytics`
4. **Query access**: new `POST /api/analytics`, protected by `x-bks-analytics-key` header.
5. **Operational logs**: Pino JSON logs to stdout for Railway log search.
6. **Privacy**: no feedback message body, no email, no raw SQL text in analytics events.

---

## Analytics Event Schema (v1)

Use shared Zod contracts (add to `src/lib/api/contracts.ts`):

```ts
interface AnalyticsEventV1 {
  v: 1;
  event: "page_view" | "interaction" | "query" | "error" | "slow_experience";
  page: string;
  action?: string;
  label?: string;
  value?: number;
  error_code?: string;
  session_id: string;
  ts: string;          // client ISO timestamp
  received_at: string; // server ISO timestamp
  user_agent?: string; // server-enriched from request header
}
```

### Input contract (client -> server)

`POST /api/events` body:

```ts
{
  events: Array<{
    event: string;
    page: string;
    action?: string;
    label?: string;
    value?: number;
    error_code?: string;
    session_id: string;
    ts: string;
  }>;
}
```

Constraints:
- max 20 events per request
- max payload ~64KB
- label length cap (e.g. 200)
- unknown fields stripped

---

## Phase 1 — Server-Side Structured Logging (Pino)

### Create
- `src/lib/server/logger.ts`

### Modify
- `package.json` (add `pino`)
- `src/routes/api/query.ts`
- `src/routes/api/crosstab.ts`
- `src/routes/api/stats.$column.ts`
- `src/routes/api/schema.ts`
- `src/routes/api/feedback.ts`
- `src/routes/api/health.ts` (debug-level only)

### Implementation notes
- Export a shared `logger` and helper `logApiRequest({ route, method, status, durationMs, ... })`.
- Each route logs exactly once on success and once on error path.
- Include `errorCode` on failures.
- Keep logs structured and small; avoid full request bodies.

---

## Phase 2 — Event Ingestion + File Store

### Create
- `src/lib/server/event-store.ts`
- `src/routes/api/events.ts`

### Modify
- `src/lib/api/contracts.ts` (analytics schemas)
- `src/lib/server/rate-limit.ts` (add separate event-ingestion limiter)

### `event-store.ts` behavior
- Resolve analytics directory from `BKS_ANALYTICS_DIR` (fallback local path).
- Ensure directory exists (`mkdir(..., { recursive: true })`).
- Determine daily file by UTC date.
- Append JSONL safely with serialized write queue (preserve order under concurrency).
- Export:
  - `appendEvents(events: AnalyticsEventV1[]): Promise<void>`
  - `analyticsGlobPath(): string` for DuckDB queries

### `POST /api/events` behavior
- Parse JSON safely (support beacon/fetch payloads).
- Validate batch with Zod.
- Enforce event rate limit by IP.
- Enrich events with `received_at` + `user_agent`.
- Return `202 { ok: true, data: { accepted: n } }`.

---

## Phase 3 — Client Tracking (MVP + high-value interactions)

### Create
- `src/lib/client/track.ts`

### Modify
- `src/routes/__root.tsx` (automatic page views)
- `src/components/feedback-dialog.tsx`
- `src/routes/explore/crosstab.tsx`
- `src/routes/profile.tsx`
- `src/routes/columns.tsx`
- `src/routes/relationships.tsx`
- `src/routes/sql.tsx`
- `src/routes/notebook.tsx`
- `src/lib/duckdb/provider.tsx`
- `src/lib/duckdb/use-query.ts`

### `track.ts` requirements
- Base-path safe endpoint: `${import.meta.env.BASE_URL}/api/events` normalization.
- SSR-safe no-op.
- Session ID in `sessionStorage` (tab-scoped).
- Batch events in memory; flush on `pagehide` and `visibilitychange`.
- Prefer `navigator.sendBeacon`, fallback to `fetch`.

### Minimum events to wire (first pass)
- `page_view` on every route change.
- SQL console: `execute_sql`, `select_template`, `export_csv`.
- Crosstab: `run_crosstab`, `cell_drilldown`, `change_normalization`.
- Profile: `run_profile` (mode + filter count).
- Columns/Relationships: selection interactions.
- Feedback dialog: `feedback_open`, `feedback_submit`.
- DuckDB issues:
  - query error -> `event="error"`, `error_code="DUCKDB_QUERY_ERROR"`
  - init error -> `error_code="DUCKDB_INIT_ERROR"`
  - slow query/init -> `event="slow_experience"`

---

## Phase 4 — Analytics Query API (Claude-facing)

### Create
- `src/routes/api/analytics.ts`

### Modify
- `src/lib/server/db.ts` (add helper to run query against a custom temp view setup)
- `src/lib/api/contracts.ts` (analytics query request schema)
- `src/routes/llms[.]txt.ts` (document new endpoint)

### Endpoint design

`POST /api/analytics`

Body:
```ts
{ sql: string; limit?: number }
```

Behavior:
1. Authenticate with `x-bks-analytics-key` == `process.env.BKS_ANALYTICS_KEY`.
2. Validate + enforce read-only SQL (`ensureReadOnlySql`) and bounded limit (`applyLimitToQuery`).
3. Register temp view:
   - `CREATE OR REPLACE TEMP VIEW events AS SELECT * FROM read_json_auto('<glob>');`
4. Execute bounded SQL via DuckDB helper.
5. Return standard envelope `{ ok: true, data: { columns, rows }, meta }`.

Edge case:
- If no analytics files exist yet, return empty result (`columns: [], rows: []`) instead of 500.

---

## Phase 5 — UI Error Boundary

### Create
- `src/components/error-boundary.tsx`

### Modify
- `src/routes/__root.tsx` (wrap `<Outlet />`)

### Behavior
- Catch render-time crashes.
- Show styled fallback with retry.
- Track boundary hit as analytics error event.

---

## Phase 6 — MCP Tool Extension (optional)

### Modify
- `mcp-server/server.py`

Add optional `query_analytics` tool that proxies to `/api/analytics`.

---

## Environment Variables

| Variable | Required | Example | Purpose |
|---|---:|---|---|
| `BKS_LOG_LEVEL` | No | `info` | Pino log verbosity |
| `BKS_ANALYTICS_DIR` | Yes (prod) | `/data/analytics` | JSONL storage directory |
| `BKS_ANALYTICS_KEY` | Yes | `<secret>` | Auth for `/api/analytics` |

Railway changes:
1. Add volume mounted to `/data/analytics` on `bks-explorer` service.
2. Set `BKS_ANALYTICS_DIR=/data/analytics`.
3. Set strong secret for `BKS_ANALYTICS_KEY`.

---

## Build Order

1. Phase 1 (logging foundation)
2. Phase 2 (event ingestion + storage)
3. Phase 3 (client tracking wiring)
4. Phase 4 (Claude query API)
5. Phase 5 (error boundary)
6. Optional Phase 6

---

## Verification Plan

### Automated
- `pnpm check-types`
- `pnpm test --run`
- `pnpm build`

### Manual smoke checks
1. **Logging**: hit `/api/query`; verify structured logs include `route`, `status`, `durationMs`.
2. **Ingestion**: POST sample events to `/api/events`; confirm JSONL file append.
3. **Client**: navigate app and run SQL/crosstab/profile; verify beacon requests in browser network tab.
4. **Analytics API auth**:
   - missing/invalid key -> `401`
   - valid key -> query succeeds
5. **Analytics SQL**: `SELECT event, COUNT(*) FROM events GROUP BY 1` returns counts.
6. **Error boundary**: trigger a render crash; fallback renders + error event captured.

---

## Done Criteria

- Structured API logs are visible in Railway with searchable fields.
- Events are being written daily to JSONL on Railway volume.
- High-value client interactions and frustration signals are tracked.
- `/api/analytics` supports bounded read-only DuckDB SQL with API key auth.
- Claude can answer product questions (popular pages, common errors, frequent workflows) from live analytics data.

---

## Example Claude Queries

```sql
-- Top pages (last 7 days)
SELECT page, COUNT(*) AS views
FROM events
WHERE event = 'page_view'
  AND try_cast(ts AS TIMESTAMP) > now() - INTERVAL '7 days'
GROUP BY page
ORDER BY views DESC;

-- Most common profile runs
SELECT action, COUNT(*) AS runs
FROM events
WHERE page LIKE '%/profile%'
GROUP BY action
ORDER BY runs DESC;

-- Error hotspots
SELECT page, error_code, COUNT(*) AS errors
FROM events
WHERE event = 'error'
GROUP BY page, error_code
ORDER BY errors DESC;
```
