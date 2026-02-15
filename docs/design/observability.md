# Observability

How we log, track, and query production behavior. The core idea: Claude is the analytics dashboard — all data is stored in a format Claude can query via DuckDB SQL.

## Architecture

```
Browser → track() batch → POST /api/events → JSONL on Railway volume
                                                    ↓
Claude ← DuckDB SQL ← POST /api/analytics ← read_json_auto('events-*.jsonl')

Server routes → structured JSON → console.log → Railway log search
```

## Server Logging

**File**: `src/lib/server/logger.ts`

Zero-dependency structured JSON logger. Writes to `console.log`/`console.warn`/`console.error` — Railway captures stdout and supports JSON field search.

NOT pino. Pino's worker-thread transport breaks when Nitro bundles server code.

**Usage pattern** (every API route):
```ts
import { logApiRequest, getClientIp, getUserAgent } from "@/lib/server/logger";

logApiRequest({ route: "/api/query", method: "POST", status: 200, durationMs: 42, ip, userAgent });
```

**Railway log search**: filter by `@level:error`, `route:"/api/query"`, `errorCode:"QUERY_TIMEOUT"`, etc.

**Config**: `BKS_LOG_LEVEL` env var (default: `info` in prod, `debug` in dev).

## Client Event Tracking

**File**: `src/lib/client/track.ts`

Lightweight client-side tracker (~180 lines). Captures page views, interactions, errors, and performance signals.

- Session ID via `sessionStorage` (tab-scoped, not cookies)
- Batches events (max 20), flushes every 2 seconds
- Uses `navigator.sendBeacon` on `pagehide`/`visibilitychange` (doesn't block navigation)
- Falls back to `fetch` for immediate sends
- SSR-safe (no-ops on server)
- Base-path aware (uses `import.meta.env.BASE_URL`)

**Events tracked**:
- `page_view` — automatic on every route change (wired in `__root.tsx`)
- `interaction` — user actions: run_crosstab, build_profile, execute_sql, select_template, export_csv, feedback_open/submit, etc.
- `query` — SQL executions with duration
- `error` — DuckDB query/init errors, UI render crashes (error boundary)
- `slow_experience` — DuckDB init >8s, queries >3s

## Event Storage

**File**: `src/lib/server/event-store.ts`

JSONL files on a Railway volume, rotated daily:
```
/data/analytics/
  events-2026-02-15.jsonl
  events-2026-02-16.jsonl
  ...
```

- Serialized write queue prevents interleaving under concurrent requests
- Directory auto-created on first write
- Path: `BKS_ANALYTICS_DIR` env var (`/data/analytics` in prod, `data/analytics` locally)

**Event schema** (v1):
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
  received_at: string; // server ISO timestamp (enriched at ingestion)
  user_agent?: string; // server-enriched from request header
}
```

## Ingestion Endpoint

**File**: `src/routes/api/events.ts`

`POST /api/events` — public, no auth required.

- Accepts batch of up to 20 events per request
- Max payload 64KB
- Validates with Zod (`AnalyticsEventBatchRequestSchema`)
- Rate limited: 120 batches/hour per IP
- Enriches with `received_at` + `user_agent`
- Returns `202 { ok: true, data: { accepted: N }, meta: { remaining: N } }`

## Analytics Query Endpoint

**File**: `src/routes/api/analytics.ts`

`POST /api/analytics` — requires `x-bks-analytics-key` header.

- Creates temp DuckDB view: `SELECT * FROM read_json_auto('events-*.jsonl')`
- Same SQL guards as `/api/query` (read-only, bounded limit)
- Returns standard `{ ok, data: { columns, rows }, meta }` envelope
- Returns empty result (not 500) if no JSONL files exist yet

**Example queries**:
```sql
-- Top pages
SELECT page, COUNT(*) AS views FROM events
WHERE event = 'page_view' GROUP BY page ORDER BY views DESC;

-- Frustration signals
SELECT page, error_code, COUNT(*) AS errors FROM events
WHERE event = 'error' GROUP BY page, error_code ORDER BY errors DESC;

-- Session bounce rate by page
WITH s AS (
  SELECT session_id, page,
    COUNT(*) FILTER (WHERE event = 'interaction') AS interactions
  FROM events GROUP BY session_id, page
)
SELECT page, COUNT(*) AS sessions,
  ROUND(100.0 * COUNT(*) FILTER (WHERE interactions = 0) / COUNT(*), 1) AS bounce_pct
FROM s GROUP BY page ORDER BY bounce_pct DESC;
```

## MCP Integration

**File**: `mcp-server/server.py` — `query_analytics` tool

Proxies SQL to `/api/analytics` so external AI agents can query analytics data through the MCP server.

## Error Boundary

**File**: `src/components/error-boundary.tsx`

React class component wrapping `<Outlet />` in `__root.tsx`. Catches render crashes, shows Ink & Paper styled fallback with retry button, and tracks the error via `track()`.

## Railway Configuration

| Resource | Value |
|---|---|
| Volume mount | `/data/analytics` on bks-explorer |
| `BKS_ANALYTICS_DIR` | `/data/analytics` |
| `BKS_ANALYTICS_KEY` | (secret, set in Railway env vars) |
| `BKS_LOG_LEVEL` | `info` (default in prod) |

## Known Limitations & Future Work

1. **No file retention policy.** JSONL files accumulate indefinitely. At high traffic, the `read_json_auto('events-*.jsonl')` glob scan slows down. Add a startup or cron cleanup for files older than 90 days.

2. **Single-replica write assumption.** The serialized write queue in `event-store.ts` prevents interleaving within one process. If Railway scales to multiple replicas, concurrent `appendFile` calls from different processes can corrupt JSONL lines. Fix: write to per-replica files (e.g. `events-{date}-{replica}.jsonl`) or use a proper append-only store.

3. **No bot filtering at ingestion.** Crawlers and bots generate `page_view` events. The `user_agent` field is captured so you can filter in SQL, but pre-filtering known bots would reduce noise.

4. **Client events are lossy.** If `fetch` fails and the user force-quits before `sendBeacon` fires, events are lost. Acceptable for analytics — not for billing.

5. **Analytics key is simple string comparison.** Not constant-time. Fine for an internal analytics key, but don't use for high-security auth.
