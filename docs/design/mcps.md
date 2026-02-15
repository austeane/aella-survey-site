# MCP Servers Available

## TanStack MCP (`mcp__tanstack__*`)
Access TanStack documentation, project scaffolding, and ecosystem info.

Key tools:
- `tanstack_search_docs` — Algolia search across all TanStack docs. Params: `query`, `library` (start/router/query/table), `framework` (react/vue/solid), `limit`
- `tanstack_doc` — Fetch full doc page. Params: `library`, `path` (e.g. `framework/react/guide/hosting`)
- `listTanStackAddOns` — Available add-ons for project creation
- `createTanStackApplication` — Scaffold new TanStack Start projects

Use `tanstack_search_docs` first to find the right page path, then `tanstack_doc` to fetch full content.

## Railway MCP (`mcp__Railway__*`)
Deploy and manage Railway services.

Key tools:
- `check-railway-status` — Verify CLI auth
- `create-project-and-link` — Create + link Railway project
- `deploy` — Upload and deploy from working directory
- `generate-domain` — Get a public URL
- `get-logs` — View build or deploy logs (`logType: "build"` or `"deploy"`)
- `list-services` — See services in linked project
- `set-variables` — Set env vars
- `link-service` / `link-environment` — Switch service/env context

## PostgreSQL/TimescaleDB MCP (`mcp__plugin_pg_pg-aiguide__*`)
- `search_docs` — Search Tiger Cloud or PostgreSQL docs

## Chrome MCP (`mcp__claude-in-chrome__*`)
Browser automation — navigate, click, read pages, take screenshots, run JS.

## BKS MCP Server (deployed)
Python MCP server at `mcp-server/server.py` for AI agent access to BKS data.

- **URL**: https://bks-mcp-server-production.up.railway.app
- **Endpoint**: `POST /mcp` (streamable-http transport)
- **Railway service**: `bks-mcp-server`
- **Discovery doc**: `GET https://bks-explorer-production.up.railway.app/llms.txt`

Tools:
- `get_schema(timeout_ms?)`
- `get_stats(column, top_n?, timeout_ms?)`
- `cross_tabulate(x_column, y_column, top_n?, include_nulls?, timeout_ms?)`
- `query_data(sql, limit?, timeout_ms?)`
- `query_analytics(sql, limit?, timeout_ms?)` (proxies to Explorer `/api/analytics` with API key)
- `search_columns(query, limit?)`

Behavior parity with plan/API conventions:
- Typed envelopes on every tool call:
  - success: `{ ok: true, data, meta? }`
  - error: `{ ok: false, error: { code, message, details? } }`
- Read-only SQL guardrails for `query_data` and `query_analytics`:
  - only `SELECT`, `WITH`, `DESCRIBE`, `EXPLAIN` statement types
  - mutating keywords blocked (`INSERT`, `UPDATE`, `DELETE`, `DROP`, etc.)
  - single-statement only (no chained statements via `;`)
- Bounded results:
  - default row limit `1000`
  - hard max row limit `10000`
- Timeout handling:
  - configurable `timeout_ms` (default `5000`, capped at `30000`)
  - server attempts DuckDB `statement_timeout`; response metadata reports whether timeout was enforced

Uses DuckDB Python bindings with in-memory DuckDB reading from a bundled parquet file.

Supports two transports:
- `stdio` (default) — for local use via `python server.py`
- `streamable-http` — set `MCP_TRANSPORT=streamable-http` for HTTP deployment; reads `PORT` env var
