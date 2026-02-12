# Big Kink Survey Explorer

Interactive data explorer for the Big Kink Survey (15.5k rows, 365 columns). Serves both human users (browser UI) and AI agents (REST API + MCP server).

## Stack
- TanStack Start + React, Tailwind v4, Vite 7 + Nitro
- DuckDB CLI + parquet for web/API queries, DuckDB Python for MCP server
- `pnpm` for JS, `uv` for Python (never pip directly)

## Commands
- `pnpm dev` — start dev server (port 3000)
- `pnpm build` — production build (outputs to `.output/`)
- `pnpm start` — run production server (`node .output/server/index.mjs`)
- `pnpm sync-public-data` — copy parquet from `data/` to `public/`
- `pnpm profile-schema` — regenerate `src/lib/schema/columns.generated.json`
- `pnpm check-types` — TypeScript validation
- `pnpm test --run` — unit tests
- `pnpm lint` — oxlint + eslint

## Pre-commit Contract
Every commit must pass: lint-staged → type-check → tests

## Key Files
- `PLAN.md` — implementation plan with milestones M0-M6
- `META-PLAN.md` — agent-first development philosophy
- `data/` — source parquet + column notes + survey documentation
- `src/router.tsx` — TanStack Start entry (required, exports `getRouter`)
- `src/routes/api/` — server route API endpoints
- `mcp-server/` — Python MCP server for AI agent access

## Docs (progressive disclosure — start here, dig in as needed)
- `docs/design/architecture.md` — stack decisions, technical rationale
- `docs/design/deployment.md` — Railway config, URLs, how to deploy
- `docs/design/mcps.md` — available MCP servers and how to use them
- `docs/schema/README.md` — schema metadata and caveat generation model
- `docs/plans/active/` — in-progress execution plans
- `docs/plans/completed/` — finished plans for context

## Deployment
- **Live**: https://bks-explorer-production.up.railway.app
- Railway project: `bks-explorer`, environment: `production`
- Deploy: `railway up` or use Railway MCP `deploy` tool

## Architectural Invariants
1. Data flows one direction: Parquet → DuckDB → Query → Component
2. API routes are thin wrappers around DuckDB SQL
3. Schema metadata is the single source of truth for columns
4. UI and agents both consume typed API contracts
5. Validate at boundaries (Zod for API inputs)

## Session Hygiene
At the end of each session or before compaction, update `docs/` with what was built, changed, or decided. Future agents should be able to read CLAUDE.md → docs/ and understand the current state without needing conversation history.
