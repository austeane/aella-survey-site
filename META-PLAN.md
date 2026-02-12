# Meta-Plan: Agent-First Development Philosophy

This document captures the higher-level engineering philosophy for this project, informed by [OpenAI's harness engineering approach](https://openai.com/index/harness-engineering/) and patterns from the solstice codebase. It sits alongside `PLAN.md` (the concrete implementation plan).

## Core Principle

**Humans steer. Agents execute.**

The primary job is not to write code, but to design environments, specify intent, and build feedback loops that let agents do reliable work. When something fails, the fix is never "try harder" — it's "what capability is missing, and how do we make it legible and enforceable?"

## Repository as System of Record

Anything not in the repo doesn't exist for agents. Slack discussions, mental models, undocumented decisions — if an agent can't discover it, it's illegible.

### Knowledge Architecture

```
kink/
├── CLAUDE.md              # ~100 lines, table of contents (NOT an encyclopedia)
├── PLAN.md                # Concrete implementation plan
├── META-PLAN.md           # This file: philosophy and patterns
├── docs/
│   ├── design/            # Architectural decisions, core beliefs
│   ├── schema/            # Column metadata, data dictionary
│   ├── plans/
│   │   ├── active/        # In-progress execution plans
│   │   └── completed/     # Done plans (for context)
│   └── references/        # External docs pulled in-repo (llms.txt files, etc)
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

### Enforcement Stack (adapted from solstice)

1. **oxlint** — Fast, catches common issues (no-console, eqeqeq, no-debugger)
2. **ESLint** — Framework-specific rules (TanStack Router, React hooks)
3. **TypeScript strict mode** — Type safety as enforcement
4. **Pre-commit hooks** (husky + lint-staged):
   - Format staged files
   - Type check (`pnpm check-types`)
   - Run tests (`pnpm test --run`)
5. **CI pipeline** — Lint, type-check, test, build on every push

### Custom Lints for Agent Legibility

Write custom lint error messages that inject remediation instructions into agent context. When an agent hits a lint failure, the error message should tell it exactly how to fix it.

## Agent Safety

### Git Safety Guard (from solstice)

A `.claude/hooks/git_safety_guard.py` that blocks destructive operations:
- `git reset --hard`
- `git clean -f` (except dry-run)
- `force push`
- `rm -rf` (except /tmp)

This prevents agents from accidentally destroying work.

## Agent Workflows (from solstice .claude/commands/)

Encode common workflows as reusable commands:

| Command | Purpose |
|---|---|
| `/build` | Scaffold → implement → validate loop |
| `/investigate` | Systematic exploration with evidence gathering |
| `/review` | Code review with scope confirmation |
| `/refactor` | Find patterns, plan refactoring, preserve behavior |

These are markdown files in `.claude/commands/` that structure agent work into phases.

## Architecture Enforcement

> "Enforce boundaries centrally, allow autonomy locally."

### Invariants for This Project

1. **Data flows one direction**: Parquet → DuckDB → Query → Component
2. **API routes are thin**: They translate HTTP to DuckDB SQL and return JSON. No business logic in routes.
3. **Schema is the source of truth**: `src/lib/schema/columns.ts` defines all column metadata. Charts, filters, and API all derive from it.
4. **Client-first**: DuckDB-WASM handles all human-facing queries. Server API routes exist only for AI agents.
5. **Validate at boundaries**: API inputs validated with Zod. SQL queries sanitized. No YOLO data probing.

## Making the App Legible to Agents

Borrowing from OpenAI's approach of making the app itself inspectable by agents:

1. **API routes serve structured JSON** — agents can query the data directly
2. **Schema endpoint** — `/api/schema` returns column metadata, types, categories, valid values
3. **MCP server** — agents connect directly and query with typed tools
4. **Descriptive column metadata** — every column has a human+agent readable description
5. **Query examples in docs** — show agents what queries are useful

## Boring Technology, Agent-Friendly

> "Technologies often described as boring tend to be easier for agents to model."

Our stack choices optimize for agent legibility:
- **DuckDB SQL** — standard SQL, well-represented in training data
- **React** — most common UI framework, agents know it deeply
- **Tailwind** — utility classes are predictable and composable
- **shadcn/ui** — copy-paste components, no opaque abstractions
- **Zod** — schema validation agents naturally reach for
- **Parquet** — standard columnar format, DuckDB's native format

## Continuous Cleanup (Garbage Collection)

> "Technical debt is like a high-interest loan."

Rather than "AI slop Fridays," encode golden principles and run cleanup continuously:

1. **Quality scoring** — grade each feature area, track gaps
2. **Doc gardening** — periodic checks for stale documentation
3. **Pattern consistency** — prefer shared utilities over hand-rolled helpers
4. **Small PRs** — corrections are cheap when changes are small

## Testing Strategy

### Unit Tests (Vitest)
- jsdom environment for component tests
- Test utilities and schema logic
- Coverage reporting

### E2E / Visual Validation
- Playwright for critical user journeys
- Screenshot evidence in `.playwright-mcp/`
- Accessibility checks

### Agent-Driven Validation
- Agents can boot the app, drive it with Chrome DevTools, validate their own work
- API routes are self-documenting and testable via curl
- MCP server tools are individually testable

## Pre-commit Contract

Every commit must pass:
1. `lint-staged` (format + lint staged files)
2. `pnpm check-types` (TypeScript)
3. `pnpm test --run` (all unit tests)

This is non-negotiable. It's the minimum bar that keeps agents from committing broken code.

## What This Means in Practice

When building a feature:
1. Write the execution plan (docs/plans/active/)
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
