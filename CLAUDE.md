# Big Kink Survey Explorer

Interactive research explorer for the Big Kink Survey (~15.5k rows, 365 columns). Based on Aella's publicly released anonymized dataset. Serves both human users (browser UI with DuckDB-WASM) and AI agents (REST API + MCP server).

## Stack
- TanStack Start + React, Tailwind v4, Vite 7 + Nitro
- DuckDB-WASM (browser), DuckDB CLI + Node API (server), DuckDB Python (MCP)
- "Ink & Paper" editorial design system (Fraunces, Source Serif 4, JetBrains Mono)
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
- `duckdb -c "SQL"` — ad-hoc queries against `data/BKSPublic.parquet` (see `docs/design/architecture.md`)

## Pre-commit Contract
Every commit must pass: lint-staged → type-check → tests

## Key Files
- `PLAN.md` — v1 implementation plan with milestones M0-M6 (complete)
- `META-PLAN.md` — agent-first development philosophy
- `docs/plans/active/v2-next-steps.md` — v2 execution plan (phases 1-3 complete, phase 4 partial)
- `data/` — source parquet + column notes + survey documentation
- `src/router.tsx` — TanStack Start entry (required, exports `getRouter`)
- `src/routes/` — 9 UI pages: about, index, explore, columns, profile, relationships, sql, notebook
- `src/routes/api/` — server route API endpoints
- `src/lib/notebook-store.ts` — localStorage CRUD for notebook entries
- `src/lib/schema/relationships.generated.json` — precomputed pairwise associations
- `scripts/precompute-relationships.mjs` — generates relationships JSON
- `mcp-server/` — Python MCP server for AI agent access

## Docs (progressive disclosure — start here, dig in as needed)
- `docs/design/frontend.md` — **design system**: "Ink & Paper" editorial aesthetic, color tokens, typography, component patterns
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
6. UI follows "Ink & Paper" design system — see `docs/design/frontend.md` for tokens/patterns

## Session Hygiene
At the end of each session or before compaction, update `docs/` with what was built, changed, or decided. Future agents should be able to read CLAUDE.md → docs/ and understand the current state without needing conversation history.
