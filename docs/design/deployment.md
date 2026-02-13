# Deployment

## Railway Project
- **Project**: bks-explorer
- **URL**: https://bks-explorer-production.up.railway.app
- **Environment**: production
- **Service**: bks-explorer (web app)

## Runtime Model
Railway auto-detects pnpm from `packageManager` in `package.json`.

Build/run pipeline:
1. `pnpm install --frozen-lockfile`
2. `pnpm build` (Vite + Nitro -> `.output/`)
3. `pnpm start` (`node .output/server/index.mjs`)

Railway injects `PORT`; Nitro uses it automatically.

## API Surface (Current)
- `GET /api/health` - health envelope
- `GET /api/schema` - dataset + column metadata + caveat definitions
- `POST /api/query` - bounded read-only SQL query
- `GET /api/stats/:column` - typed numeric/categorical summary stats
- `GET /api/crosstab` - x/y grouped counts with optional filters

## App Surface (Current)
- `GET /about` intro page (dataset background, credits, feature guide)
- `GET /llms.txt` machine-readable AI docs (MCP + REST + dynamic column list)
- `GET /` dashboard (schema stats, caveats, missingness, column inspector)
- `GET /explore` cross-tab explorer (pivot matrix, Cramer's V, filters, notebook save)
- `GET /columns` Column Atlas (search, tags, sort, Column Inspector, URL state)
- `GET /profile` profile/cohort builder (single + compare modes, over-indexing, notebook save)
- `GET /relationships` Relationship Finder (precomputed associations for 159 columns)
- `GET /sql` SQL console (templates, quoted identifiers, CSV export, notebook save)
- `GET /notebook` Research Notebook (localStorage persistence, inline editing, JSON export)

## Deploying
```bash
# from repository root
railway up
```

Or via Railway MCP:
```text
mcp__Railway__deploy({ workspacePath: "/Users/austin/dev/kink" })
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
curl https://bks-explorer-production.up.railway.app/api/health
curl https://bks-explorer-production.up.railway.app/api/schema
curl -X POST https://bks-explorer-production.up.railway.app/api/query \
  -H 'content-type: application/json' \
  -d '{"sql":"select count(*) as n from data"}'
```

## Notes
- If production still shows older stub endpoints, redeploy from the latest commit (`railway up`).
- Local verification baseline remains: `pnpm check-types`, `pnpm test --run`, `pnpm build`.
