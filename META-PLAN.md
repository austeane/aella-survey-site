# Meta-Plan: Agent-First Development Philosophy

This document captures the engineering philosophy for this project, informed by [OpenAI's harness engineering approach](https://openai.com/index/harness-engineering/).

## Core Principle

**Humans steer. Agents execute.**

The primary job is not to write code, but to design environments, specify intent, and build feedback loops that let agents do reliable work. When something fails, the fix is never "try harder" — it's "what capability is missing, and how do we make it legible and enforceable?"

## Repository as System of Record

Anything not in the repo doesn't exist for agents. Slack discussions, mental models, undocumented decisions — if an agent can't discover it, it's illegible.

### Knowledge Architecture

```
kink/
├── CLAUDE.md              # ~100 lines, table of contents (NOT an encyclopedia)
├── META-PLAN.md           # This file: philosophy and patterns
├── docs/
│   ├── design/            # Architectural decisions, design system, deployment
│   ├── schema/            # Column metadata, data dictionary, curated findings
│   └── plans/
│       ├── active/        # In-progress execution plans
│       └── completed/     # Done plans (for context)
```

**Progressive disclosure**: CLAUDE.md is the entry point — a map with pointers. Agents start small and are taught where to look next, not overwhelmed upfront.

## CLAUDE.md Philosophy

Following the lesson: "We tried the one big AGENTS.md approach. It failed."

CLAUDE.md should be:
- **Short** (~100 lines) — a table of contents, not a manual
- **Stable** — change rarely, point to things that change often
- **Navigational** — tell agents where to look, not what to do

It should contain:
1. Project overview (2-3 sentences)
2. Stack and key tools
3. How to run/build/test (exact commands)
4. Pointers to docs/ for deeper context
5. Architectural invariants (the few rules that matter everywhere)
6. Pre-commit requirements

It should NOT contain:
- Detailed implementation guides (put in docs/)
- Long lists of conventions (encode as linters)
- Task-specific instructions (put in execution plans)

## Mechanical Enforcement Over Documentation

> "When documentation falls short, promote the rule into code."

Prefer linting rules and structural tests over written guidelines. An enforced rule is a rule that works; a documented rule is a suggestion.

### Enforcement Stack

1. **oxlint** — Fast linter, catches common issues
2. **TypeScript strict mode** — Type safety as enforcement
3. **Pre-commit hooks** (husky + lint-staged):
   - Lint staged `.ts`/`.tsx` files via oxlint
   - Type check (`pnpm check-types`)
   - Run tests (`pnpm test --run`)

When an agent hits a lint failure, the error message should tell it how to fix it. If it doesn't, improve the message or add a doc pointer.

## Architecture Enforcement

> "Enforce boundaries centrally, allow autonomy locally."

### Invariants

1. **Data flows one direction**: Parquet → DuckDB → Query → Component
2. **API routes are thin**: They translate HTTP to DuckDB SQL and return JSON. No business logic in routes.
3. **Schema is the source of truth**: `src/lib/schema/columns.generated.json` defines all column metadata. Charts, filters, and API all derive from it.
4. **DuckDB-WASM is the primary query engine**: Browser-side DuckDB handles interactive exploration. Server API routes provide the same data for agents and server-rendered paths.
5. **Validate at boundaries**: API inputs validated with Zod. SQL queries sanitized. No YOLO data probing.

## Making the App Legible to Agents

Borrowing from OpenAI's approach of making the app itself inspectable by agents:

1. **API routes serve structured JSON** — agents can query the data directly
2. **Schema endpoint** — `/api/schema` returns column metadata, types, categories, valid values
3. **MCP server** — agents connect directly and query with typed tools (`mcp-server/`)
4. **Descriptive column metadata** — every column has a human+agent readable description, caveats, null semantics
5. **`/llms.txt`** — machine-readable integration doc auto-generated from schema, with MCP config and API docs
6. **Query examples in docs** — show agents what queries are useful

## Boring Technology, Agent-Friendly

> "Technologies often described as boring tend to be easier for agents to model."

Our stack choices optimize for agent legibility:
- **DuckDB SQL** — standard SQL, well-represented in training data
- **React** — most common UI framework, agents know it deeply
- **Tailwind** — utility classes are predictable and composable
- **Radix UI + CVA** — composable primitives with variant styling, no opaque abstractions
- **Zod** — schema validation agents naturally reach for
- **Parquet** — standard columnar format, DuckDB's native format

## Testing Strategy

### Unit Tests (Vitest)
- Test query guards, schema logic, API contracts, caveats
- Run on every commit via pre-commit hook

### E2E (Playwright)
- Critical user journeys and visual validation
- Screenshot evidence for review

### Agent-Driven Validation
- Agents can boot the app, drive it with browser automation, validate their own work
- API routes are self-documenting and testable via curl
- MCP server tools are individually testable

## Pre-commit Contract

Every commit must pass:
1. `lint-staged` (oxlint on staged files)
2. `pnpm check-types` (TypeScript)
3. `pnpm test --run` (all unit tests)

This is non-negotiable. It's the minimum bar that keeps agents from committing broken code.

## Continuous Improvement

> "Technical debt is like a high-interest loan."

Rather than scheduled cleanup sprints, encode principles and fix forward:

1. **Doc gardening** — when docs are stale, update them as part of the task that revealed the staleness
2. **Pattern consistency** — prefer shared utilities over hand-rolled helpers
3. **Small changes** — corrections are cheap when changes are small
4. **Promote rules into code** — if a mistake recurs, add a lint rule or structural test

## What This Means in Practice

When building a feature:
1. Write the execution plan (`docs/plans/active/`)
2. Define the schema/types first
3. Implement with mechanical enforcement (lints, types, tests)
4. Validate via API + UI
5. Move plan to completed when done

When something breaks:
1. Don't "try harder" — ask what's missing
2. If the agent can't find context → add it to docs
3. If the agent makes a mistake → add a lint rule
4. If the pattern drifts → add a structural test

The goal is a codebase that gets easier for agents to work in over time, not harder.
