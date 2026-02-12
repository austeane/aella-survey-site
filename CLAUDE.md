# Big Kink Survey Explorer

Interactive data explorer for the Big Kink Survey (15.5k rows, 365 columns). Serves both human users (browser UI) and AI agents (REST API + MCP server).

## Stack
- TanStack Start + React, Tailwind v4 + shadcn/ui, Vite + Nitro
- DuckDB-WASM (client-side), DuckDB Python (MCP server)
- `pnpm` for JS, `uv` for Python (never pip directly)

## Commands
- `pnpm dev` — start dev server
- `pnpm build` — production build
- `pnpm check-types` — TypeScript validation
- `pnpm test --run` — unit tests
- `pnpm lint` — oxlint + eslint

## Pre-commit Contract
Every commit must pass: lint-staged → type-check → tests

## Key Files
- `PLAN.md` — concrete implementation plan
- `META-PLAN.md` — agent-first development philosophy
- `data/` — source parquet + documentation
- `src/lib/schema/columns.ts` — column metadata (source of truth)
- `src/lib/duckdb/` — DuckDB-WASM initialization and hooks
- `src/routes/api/` — JSON API for AI agents

## Architectural Invariants
1. Data flows one direction: Parquet → DuckDB → Query → Component
2. API routes are thin wrappers around DuckDB SQL
3. Schema metadata is the single source of truth for columns
4. Client-first: DuckDB-WASM for humans, server API for agents
5. Validate at boundaries (Zod for API inputs)
