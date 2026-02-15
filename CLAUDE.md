# Big Kink Survey Explorer

Interactive research explorer for the Big Kink Survey (~15.5k row anonymized subsample of a ~970k-respondent survey, 365 columns). Based on Aella's publicly released anonymized dataset. Serves both human users (browser UI with DuckDB-WASM) and AI agents (REST API + MCP server).

**Read `META-PLAN.md` first.** It defines how this project is built: humans steer, agents execute. When something fails, the fix is never "try harder" — it's "what capability is missing?" That philosophy governs everything below.

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
- `pnpm validate-chart-presets` — run all curated chart preset SQL against parquet
- `pnpm check-types` — TypeScript validation
- `pnpm test --run` — unit tests
- `pnpm test:e2e` — Playwright end-to-end test suite
- `pnpm lint` — oxlint + eslint
- `uv run --project analysis python analysis/build_findings.py` — regenerate curated findings artifacts
- `uv run --project analysis pytest analysis/tests -q` — validate findings pipeline
- `duckdb -c "SQL"` — ad-hoc queries against `data/BKSPublic.parquet`

## Pre-commit Contract
Every commit must pass: lint-staged → type-check → tests

## Key Files
- `META-PLAN.md` — **start here**: agent-first development philosophy, enforcement stack, architecture invariants
- `docs/plans/active/v3-ux-overhaul.md` — current execution plan and implementation status
- `analysis/META-FINDINGS.md` — deep-analysis synthesis and wave-2 rigor outcomes
- `data/` — source parquet + column notes + survey documentation
- `src/router.tsx` — TanStack Start entry (required, exports `getRouter`)
- `src/routes/` — UI pages: about, index, data-quality, explore, crosstab, columns, profile, relationships, sql, notebook
- `src/routes/llms[.]txt.ts` — machine-readable AI integration document (`/llms.txt`)
- `src/routes/api/` — server route API endpoints
- `src/lib/chart-presets.ts` — canonical featured findings wired from `analysis/findings.json`
- `src/lib/schema/relationships.generated.json` — precomputed pairwise associations
- `mcp-server/` — Python MCP server for AI agent access

## Docs (progressive disclosure)
- `docs/design/frontend.md` — **design system**: "Ink & Paper" aesthetic, color tokens, typography, component patterns
- `docs/design/architecture.md` — stack decisions, technical rationale
- `docs/design/deployment.md` — Railway config, URLs, how to deploy
- `docs/design/observability.md` — logging, analytics tracking, `/api/analytics` query endpoint
- `docs/design/mcps.md` — available MCP servers and how to use them
- `docs/schema/README.md` — schema metadata and caveat generation model
- `docs/schema/interesting-findings.md` — curated findings from `analysis/findings.json`
- `docs/plans/active/` — in-progress execution plans
- `docs/plans/completed/` — finished plans for context

## Deployment
- **Public URL**: https://www.austinwallace.ca/survey (via CloudFront → Railway proxy)
- **Direct Railway**: https://bks-explorer-production.up.railway.app/survey/
- Railway project: `bks-explorer`, environment: `production`
- Deploy: `railway up --service bks-explorer` or use Railway MCP `deploy` tool
- Base path controlled by `VITE_BASE_PATH` env var (set to `/survey/` in production)
- See `docs/design/deployment.md` for full details

## Architectural Invariants
1. Data flows one direction: Parquet → DuckDB → Query → Component
2. API routes are thin wrappers around DuckDB SQL
3. Schema metadata is the single source of truth for columns
4. UI and agents both consume typed API contracts
5. Validate at boundaries (Zod for API inputs)
6. UI follows "Ink & Paper" design system — see `docs/design/frontend.md`

## Session Hygiene
When you have fully completed a task or before compaction, update `docs/` with what was built, changed, or decided. Future agents should be able to read CLAUDE.md → docs/ and understand the current state without needing conversation history.
When you believe you have fully completed a task, verify using Claude for Chrome or another browser tool to visually verify that your changes exist in detail.
