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
- `GET /` dashboard
- `GET /explore` cross-tab explorer
- `GET /profile` profile/cohort percentile summary
- `GET /sql` SQL console and CSV export

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
`mcp-server/Dockerfile` is ready. To deploy MCP separately on Railway:
1. Create/link a second Railway service.
2. Configure start command to run the Python MCP server.
3. Set `BKS_PARQUET_PATH` if data is mounted at a non-default path.

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
