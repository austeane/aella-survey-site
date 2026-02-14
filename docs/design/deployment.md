# Deployment

## URLs
- **Public**: https://www.austinwallace.ca/survey — served via CloudFront proxy to Railway
- **Direct Railway**: https://bks-explorer-production.up.railway.app/survey/

## Railway Project
- **Project**: bks-explorer
- **Environment**: production
- **Services**: bks-explorer (web app), bks-mcp-server (MCP server)

## Base Path Configuration

The app is served under `/survey/` via three coordinated configs:

| Config | Purpose | Where |
|--------|---------|-------|
| `VITE_BASE_PATH=/survey/` | Vite `base` + Nitro `baseURL` (build-time) | Railway env var on bks-explorer |
| `basepath` in `src/router.tsx` | TanStack Router client-side route matching | Derived from `import.meta.env.VITE_BASE_PATH` |
| `import.meta.env.BASE_URL` | Runtime asset/API path prefix in client code | Set automatically by Vite from `base` |

For local development, `VITE_BASE_PATH` is unset, so everything defaults to `/`.

### CloudFront Routing (austin-site)

The public URL is handled by an SST Router in `~/dev/austin-site/sst.config.ts`:

```ts
router.route("/survey", "https://bks-explorer-production.up.railway.app");
```

No rewrite is needed — the full path (e.g., `/survey/explore`) is forwarded to Railway as-is. The app handles the `/survey` prefix natively via its basepath config.

## Runtime Model
Railway auto-detects pnpm from `packageManager` in `package.json`.

Build/run pipeline:
1. `pnpm install --frozen-lockfile`
2. `pnpm build` (Vite + Nitro -> `.output/`)
3. `pnpm start` (`node .output/server/index.mjs`)

Railway injects `PORT`; Nitro uses it automatically.

## API Surface
All endpoints are under the base path (`/survey/` in production):

- `GET /survey/api/health` - health envelope
- `GET /survey/api/schema` - dataset + column metadata + caveat definitions
- `POST /survey/api/query` - bounded read-only SQL query
- `GET /survey/api/stats/:column` - typed numeric/categorical summary stats
- `GET /survey/api/crosstab` - x/y grouped counts with optional filters

## App Surface
All pages are under the base path:

- `GET /survey/` dashboard (schema stats, caveats, missingness, column inspector)
- `GET /survey/about` intro page (dataset background, credits, feature guide)
- `GET /survey/explore` Explore hub landing page
- `GET /survey/explore/crosstab` cross-tab explorer (pivot matrix, Cramer's V, filters, notebook save)
- `GET /survey/columns` Column Atlas (search, tags, sort, Column Inspector, URL state)
- `GET /survey/profile` profile/cohort builder (single + compare modes, over-indexing, notebook save)
- `GET /survey/relationships` Relationship Finder (precomputed associations for 159 columns)
- `GET /survey/sql` SQL console (templates, quoted identifiers, CSV export, notebook save)
- `GET /survey/notebook` Research Notebook (localStorage persistence, inline editing, JSON export)
- `GET /survey/llms.txt` machine-readable AI docs (MCP + REST + dynamic column list)

## Deploying

```bash
# from repository root — make sure bks-explorer service is linked
railway up --service bks-explorer
```

Or via Railway MCP:
```text
mcp__Railway__deploy({ workspacePath: "/Users/austin/dev/kink", service: "bks-explorer" })
```

### Deploying CloudFront changes (austin-site)

```bash
cd ~/dev/austin-site
AWS_PROFILE=prod npx sst deploy --stage production
```

## MCP Service (Service B)
- **Service**: bks-mcp-server
- **URL**: https://bks-mcp-server-production.up.railway.app
- **MCP endpoint**: `POST https://bks-mcp-server-production.up.railway.app/mcp`
- **Transport**: streamable-http (MCP protocol over HTTP)
- **Dockerfile**: `mcp-server/Dockerfile` (build context is repo root)

Environment variables set on the service:
- `MCP_TRANSPORT=streamable-http`
- `BKS_PARQUET_PATH=/app/data/BKSPublic.parquet`
- `RAILWAY_DOCKERFILE_PATH=mcp-server/Dockerfile`
- `PORT` — injected by Railway (default 8080)

### Deploying MCP Service
```bash
# link to the MCP service first
railway service bks-mcp-server
# then deploy
railway up
```

Or via Railway MCP:
```text
mcp__Railway__link-service({ workspacePath: "...", serviceName: "bks-mcp-server" })
mcp__Railway__deploy({ workspacePath: "..." })
```

### MCP Smoke Check
```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
  https://bks-mcp-server-production.up.railway.app/mcp
```

## Smoke Checks After Deploy
```bash
curl https://www.austinwallace.ca/survey/api/health
curl https://www.austinwallace.ca/survey/api/schema
curl -X POST https://www.austinwallace.ca/survey/api/query \
  -H 'content-type: application/json' \
  -d '{"sql":"select count(*) as n from data"}'
```

## Environment Variables (bks-explorer)

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_BASE_PATH` | `/survey/` | Build-time base path for Vite + Nitro |
| `NITRO_APP_BASE_URL` | `/survey/` | Runtime Nitro base URL override |

## Notes
- Local dev runs at `/` (no `VITE_BASE_PATH` set). Production runs at `/survey/`.
- The CloudFront proxy in austin-site passes requests through without rewriting paths.
- If production shows stale content, redeploy with `railway up --service bks-explorer`.
- Local verification baseline: `pnpm check-types`, `pnpm test --run`, `pnpm build`.
