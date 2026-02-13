# Repomix Notes — Excluded Content

## Excluded: design-mockups/ (4 HTML files, ~21k tokens)
Four self-contained HTML design mockups exploring different visual directions for the app:
- `01-ink-and-paper.html` — Editorial research journal aesthetic (cream, ink, Fraunces/Source Serif fonts). This was the chosen direction.
- `02-phosphor.html` — Dark/neon terminal aesthetic
- `03-velvet.html` — Rich, warm luxury aesthetic
- `04-signal.html` — Clean, minimal data-viz aesthetic

## Excluded: mcp-server/ (~5.8k tokens)
Python MCP server for AI agent access to the dataset. Key details:
- **File**: `mcp-server/server.py` (~600 lines) — FastMCP server with 5 tools: `get_schema`, `get_stats`, `cross_tabulate`, `query_data`, `search_columns`
- **Transport**: streamable-http (for Railway deployment), stdio (for local use)
- **Safety**: Read-only SQL enforcement, row limits (default 1000, max 10000), timeout guards, typed error envelopes matching API contracts
- **Deployed**: https://bks-mcp-server-production.up.railway.app (Railway Service B)
- **Dockerfile**: Installs mcp>=1.0.0 and duckdb>=1.0.0 via uv, copies data + server, exposes port 8000
- **pyproject.toml**: Minimal config with mcp and duckdb dependencies

## Excluded: test files (~7k tokens)
8 test files with 121 passing tests (Vitest):
- `contracts.test.ts` (42 tests) — Zod schema validation for all API contracts
- `sql-guards.test.ts` + `sql-guards.extended.test.ts` (42 tests) — SQL read-only enforcement, normalization, quoting
- `caveats.test.ts` + `caveats.extended.test.ts` (16 tests) — Caveat pattern matching and formatting
- `metadata.test.ts` (8 tests) — Schema metadata loading and querying
- `api-response.test.ts` (9 tests) — JSON envelope helpers
- `db.test.ts` (4 tests) — Query execution error handling

## Excluded: columns.generated.json (~26k tokens)
Auto-generated schema metadata for all 365 columns. Each entry contains:
- `name`, `logicalType` (categorical|numeric|boolean|text), `nullRatio`, `approxCardinality`
- `categoryTag` (demographic|ocean|fetish|derived|other)
- Regenerate with: `pnpm profile-schema`

## Summary: Big Kink Survey (970k cleaned).md (~45k tokens)

The Big Kink Survey is a large-scale online survey collecting data on human sexuality, kinks, fetishes, and sexual preferences. Participants were recruited primarily through Reddit, FetLife, Twitter, Facebook, and other online platforms. The survey explores relationships between demographic characteristics, childhood experiences, personality traits, and sexual interests.

The full dataset contains ~970k responses; the cleaned public subsample has 15,503 rows (stratified by age bin and biological sex) and 365 columns.

### Survey Structure (5 parts)
1. **Demographics**: gender identity, trans/cis status, HRT usage, sexual orientation, ethnicity, relationship style, location, physical characteristics, political orientation, sexual history
2. **Childhood & Upbringing**: religion, cultural attitudes, social class, locus of control, spanking/abuse history, parental configuration, Big Five personality traits
3. **Sexual Fantasy & Pornography**: emotional states in fantasy, porn consumption patterns, sex work experience, consent preferences, dom/sub orientation
4. **Vanilla Sex Acts**: oral, anal, positions, specific acts, breast size preferences, energy level preferences
5. **Fetish Categories**: hierarchical gating — broad category endorsement, then detailed follow-ups only for endorsed categories (13 "uncommon" + 17 "common" categories)

### Gating Logic
Questions are conditional on previous answers. Key gates: trans-specific questions gate on trans identity; menstrual/HRT questions gate on assigned sex; religion follow-ups gate on having a religion; abuse detail questions gate on reporting abuse; porn preference questions gate on consuming porn; each fetish category's detailed questions gate on endorsing that category. This creates substantial structural missingness — NULLs typically mean "not applicable" rather than "refused to answer."

### Derived Variables
- `biomale` (1=male, 0=female), `gendermale`, `cis`, `gendered` (binary vs nonbinary)
- Big Five composites (e.g., `opennessvariable = openness2 - openness`)
- HRT duration on ordinal scales, binary gender preference for attraction

### Data Quality Caveats
- Rating scales compressed from 0-8 to 0-5/1-5
- Questions added mid-collection create time-cohort missingness (menstrual cycle Nov 2024, horniness May 2025, sex work Oct 2024)
- Gated missingness often represents implicit zeros, not true missing data
- Some vanilla arousal scales use counterintuitive negative scoring
- Only 19 of 365 columns have zero nulls; 64% have >50% null rates (by design)
- The 19 universal columns (age, biomale, OCEAN scores, politics, etc.) are safe starting points for analysis
