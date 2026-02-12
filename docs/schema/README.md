# Schema Metadata

## Source of Truth
- Generated metadata: `src/lib/schema/columns.generated.json`
- Shared TypeScript types: `src/lib/schema/types.ts`
- Column caveat mapping: `src/lib/schema/caveats.ts`

## Regeneration
Run both commands from repo root:
```bash
pnpm sync-public-data
pnpm profile-schema
```

`profile-schema` computes, per column:
- name
- DuckDB type
- inferred logical type (`categorical|numeric|boolean|text|unknown`)
- null ratio
- approximate cardinality
- category tags (`demographic|ocean|fetish|derived|other`)

## Caveat Model
Two caveats are global across analysis:
- gated missingness
- late-added questions

Additional per-column caveats are pattern-mapped for known modified fields from `BKSPublic_column_notes.txt`:
- binned/collapsed
- combined/merged
- computed

## API Exposure
`GET /api/schema` returns:
- dataset metadata
- per-column metadata + caveat keys
- caveat definitions for UI/agent rendering

## Notes
- This metadata is intended for UI controls, API validation context, and MCP tool assistive hints.
- It is not a replacement for the original survey wording document in `data/Big Kink Survey (970k cleaned).md`.
