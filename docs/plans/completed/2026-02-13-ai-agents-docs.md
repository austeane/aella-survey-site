# Plan: Self-Documenting Site for AI Agents

Owner: Codex agent session
Status: COMPLETE (2026-02-13)
Moved from: `docs/plans/active/ai-agents-docs.md`

## Status (2026-02-13)

- [x] Added dynamic `src/routes/llms[.]txt.ts` server route with `text/plain` output, schema-driven counts, API/MCP docs, and visible-column generation from `listColumns()`.
- [x] Added `Cache-Control` (`3600s`) on `/llms.txt`.
- [x] Updated `src/routes/about.tsx` with Section 06 ("For AI Agents"), MCP URL + tool list, Claude/Cursor JSON snippets, REST fallback, and link to `/llms.txt`.
- [x] Updated architecture/deployment/worklog docs in the same session so agent-facing surface area is legible from repo docs.

## Context

The BKS Explorer has a working MCP server and REST API, but no way for AI agents to discover them. Humans who want to connect their AI also have no instructions. This plan adds both — with the machine-readable docs generated dynamically so they stay in sync with the app.

## Deliverables

### 1. Create `src/routes/llms.txt.ts` — generated AI documentation

A **server route** (not a static file) that generates `llms.txt` content dynamically by importing `getSchemaMetadata()` and `listColumns()`. This means row count, column count, and column names/types update automatically when the schema changes.

Implementation note: TanStack file routes require literal `.` escaping, so this is implemented as `src/routes/llms[.]txt.ts` while still serving `/llms.txt`.

**Route pattern:** `createFileRoute("/llms.txt")` with a GET handler returning `Content-Type: text/plain`.

**Generated content structure (Markdown per llmstxt.org):**
- H1 + blockquote summary
- Dataset stats (row count, column count pulled from `getSchemaMetadata()`)
- Table name is `data`, envelope format, read-only constraints, limits
- `## MCP Server` — URL, transport, 5 tools with descriptions, config snippet
- `## REST API` — 5 endpoints with methods/params
- `## Columns` — dynamically generated list of all visible columns with type and tags (from `listColumns()`)
- `## Optional` — links to UI, about, Zenodo

**Key imports:** `getSchemaMetadata`, `listColumns` from `@/lib/schema/metadata`

**Caching:** Cache-Control header (3600s) since schema rarely changes.

### 2. Modify `src/routes/about.tsx` — add Section 06: "For AI Agents"

New section after Section 05 (insert after line 255), following existing editorial patterns:

- `<SectionHeader number="06" title="For AI Agents" />`
- Brief explanation of MCP
- MCP server URL in accent-bordered callout (`border-l-2 border-[var(--accent)]`)
- 5 tool names in rule-bordered list (`border-l-2 border-[var(--rule)] pl-4`, `mono-value` names)
- Config snippets in `<pre>` blocks (`bg-[var(--sidebar-bg)]`, `border border-[var(--rule)]`, JetBrains Mono) for Claude Desktop and Cursor
- REST API fallback with 4 endpoints
- Link to `/llms.txt`

No new components or CSS needed — uses `SectionHeader`, `mono-value`, `mono-label`, existing link styles.

## Files

| Action | File | Notes |
|--------|------|-------|
| Create | `src/routes/llms[.]txt.ts` | TanStack literal-dot filename for `/llms.txt`; server route, ~130 lines |
| Modify | `src/routes/about.tsx` | Add Section 06, ~80 lines after line 255 |

## Verification

1. `pnpm check-types`
2. `pnpm dev` → `http://localhost:3000/llms.txt` returns generated plain text with correct counts
3. `http://localhost:3000/about` → Section 06 renders with config snippets
4. Column list in llms.txt matches `/api/schema` column count
5. Config JSON snippets are valid

## Closure Summary

- Implemented machine-readable AI discovery docs at `/llms.txt` via `src/routes/llms[.]txt.ts`.
- Implemented About page Section 06 ("For AI Agents") with MCP + REST integration guidance.
- Updated repo docs in the same execution pass (`CLAUDE.md`, architecture, deployment, MCP docs, worklog).
- Verified in local runtime:
  - `/llms.txt` returns `200`, `Content-Type: text/plain`, and `Cache-Control` with 3600s TTL.
  - `/about` renders the new AI agent section.
  - `/llms.txt` visible column count matches `/api/schema` (`361`).
