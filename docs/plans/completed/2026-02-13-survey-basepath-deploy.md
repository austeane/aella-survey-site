# Deploy BKS Explorer at austinwallace.ca/survey

## Status: Complete

Live at: https://www.austinwallace.ca/survey/

## Overview
Mount BKS Explorer under `/survey` on the austin-site CloudFront gateway. CloudFront forwards `/survey/*` to Railway with the path intact; the app knows its base is `/survey` via TanStack Router `basepath` + Vite `base` + Nitro `baseURL`.

## Changes made

### A. Kink repo (5 files)

1. **`vite.config.ts`** — `base: process.env.VITE_BASE_PATH || '/'` + `nitro({ baseURL: process.env.VITE_BASE_PATH || '/' })`
2. **`src/router.tsx`** — `basepath` derived from `import.meta.env.VITE_BASE_PATH`
3. **`src/lib/client/api.ts`** — prefix fetch paths with `import.meta.env.BASE_URL`
4. **`src/lib/duckdb/init.ts`** — prefix parquet URL with `import.meta.env.BASE_URL`
5. **`src/routes/llms[.]txt.ts`** — update `getAppBaseUrl` to include base path

### B. Railway env vars (bks-explorer service)
- `VITE_BASE_PATH=/survey/` — used at build time by Vite + Nitro
- `NITRO_APP_BASE_URL=/survey/` — runtime override (belt and suspenders)

### C. Austin-site repo (1 file)
- `sst.config.ts` — added `router.route("/survey", BKS_SURVEY_ORIGIN)` (no rewrite needed)

## Key learnings

- TanStack Router `basepath` handles route matching AND `<Link>` href generation automatically — no need to change nav links
- Vite `base` handles asset URL prefixing in HTML (`/survey/assets/...`)
- Nitro `baseURL` is ALSO required — without it, Nitro's static file middleware doesn't know to serve assets under the base path. This was the critical missing piece.
- DuckDB WASM imports (`?url`) are resolved by Vite at build time, so `base` handles them automatically
- `import.meta.env.BASE_URL` (Vite built-in) is the right way to prefix runtime paths in client code

## What didn't need changing
- Nav links in `__root.tsx` — TanStack Router auto-prepends basepath
- DuckDB WASM imports — Vite handles with `base`
- Route file paths — file-based routing + basepath composition
- MCP server URL — external, doesn't go through CloudFront
