# Plan: V3 UX Remediation (Post-Testing)

Status: Active  
Last updated: 2026-02-14

## Inputs

- `docs/plans/completed/2026-02-14-v3-ux-testing.md`
- `docs/plans/active/v3-ux-overhaul.md`
- Current implementation in:
  - `src/routes/index.tsx`
  - `src/routes/explore.tsx`
  - `src/routes/__root.tsx`
  - `src/routes/relationships.tsx`
  - `src/routes/profile.tsx`
  - `src/routes/columns.tsx`
  - `src/components/*`
  - `analysis/build_findings.py`
  - `analysis/findings.json`

## Objective

Close the "cliff edge" between the highly approachable home page and the still-technical deeper routes, without removing analytical power.

Primary outcomes:

1. Preserve the strong first impression on Home.
2. Ensure Home -> Explore remains visual and understandable for naive users.
3. Remove raw internals (IDs, opaque labels, unknown badges) from user-facing paths.
4. Fix mobile navigation access on small screens.

## Definition of Done

All high-priority findings from `2026-02-14-v3-ux-testing.md` are resolved, and medium-priority comprehension blockers are reduced to non-blocking polish.

Specifically:

1. Preset labels are understandable without domain jargon.
2. Build-your-own default chart shows an interpretable pattern.
3. Mobile users can reliably access all nav links.
4. Explore section "01" presents an actual visual for the common mixed-type case.
5. "Unknown" badges/messages no longer appear as unexplained errors in core workflows.
6. Raw internal identifiers are not exposed in primary user copy.

## Scope

In scope:

1. Copy/content changes.
2. Frontend behavior and layout changes.
3. Schema display/label improvements where required for comprehension.
4. E2E coverage for remediated flows.

Out of scope:

1. Recomputing relationship matrices.
2. New backend services.
3. New auth/permissions systems.
4. A full visual redesign of the existing Ink & Paper system.

## Baseline (Already Completed)

Completed and should not be re-opened:

1. Base-path bug for question-card deep link fixed (`Link` usage on Home cards).
2. Human label override pipeline added:
   - `src/lib/schema/human-labels.json`
   - `scripts/profile-schema.mjs`
   - regenerated `src/lib/schema/columns.generated.json`

This remediation plan starts after those fixes.

## Execution Strategy

Ship in five PRs (small-to-medium), in priority order:

1. PR1: Home clarity and default behavior.
2. PR2: Explore visual integrity and plain-language controls.
3. PR3: Mobile navigation accessibility.
4. PR4: Internals/jargon cleanup across Relationships, Profile, and Columns.
5. PR5: Polish and trust affordances.

Each PR must pass `pnpm check-types`, `pnpm test --run`, and targeted Playwright checks.

## PR1 - Home Clarity + Better Defaults (P0)

Issues covered: H1, H2, M1, M2, M5, L3, L4

### Files

1. `analysis/build_findings.py`
2. `analysis/findings.json` (generated)
3. `src/lib/chart-presets.ts` (consumption only, may not need edits)
4. `src/routes/index.tsx`
5. `e2e/dashboard.spec.ts`

### Tasks

1. Replace jargon-heavy `shortTitle` strings in findings generation with lay labels.
   - Example direction:
   - `Arousal Fixity` -> `How fixed are kinks?`
   - `Politics & Breadth` -> `Politics & Kinks`
2. Change Home subtitle copy to content-focused language.
   - Current: app-architecture meta text.
   - Target: what users can learn from the data.
3. Rename section headers:
   - `Featured Chart Explorer` -> `What the data shows`
   - `Build Your Own (v1)` -> `Build your own chart`
   - `Question Cards` -> `Questions you can explore`
4. Improve interactivity affordance on preset pills.
   - Add "Pick a finding" helper label.
   - Add stronger hover/focus treatment for unselected pills.
5. Change default Build-your-own pair to a visibly informative combination.
   - Move off `straightness x politics`.
   - Use a pair with clear gradient/separation (for example `politics x opennessvariable`).
6. Add sample size cue near featured chart.
   - Query count of rows used for selected preset via `exploreX/exploreY` non-null counts.
   - Display compact `N = ...` line near caption/evidence block.
7. Add a concise trust line near top (not only in section 04).
   - Keep existing detailed trust block.

### Acceptance

1. Home loads with updated non-jargon section/copy labels.
2. Preset row is clearly interactive for first-time users.
3. Default Build-your-own view no longer looks like a one-bar composition artifact.
4. Featured chart area shows a clear sample-size indicator.

### Verification

1. `pnpm check-types`
2. `pnpm test --run`
3. `pnpm test:e2e -- e2e/dashboard.spec.ts`
4. Manual:
   - Switch all presets.
   - Confirm URL syncing unchanged.
   - Confirm no copy regressions on base path deploy.

## PR2 - Explore Visual Integrity + Control Comprehension (P0)

Issues covered: H4, H5, M7, naive-journey blockers on Explore

### Files

1. `src/routes/explore.tsx`
2. `src/components/charts/bar-chart.tsx`
3. `src/components/charts/line-chart.tsx`
4. `src/components/data-table.tsx` (if needed for details mode)
5. `src/components/missingness-badge.tsx`
6. `src/lib/format-labels.ts`
7. `e2e/explore.spec.ts`

### Tasks

1. Keep section 01 truly visual by default.
   - For categorical/categorical: keep existing pivot visual.
   - For categorical/numeric and numeric/categorical: add aggregated chart mode (bar/line as appropriate) instead of table-first display.
   - If a table is still needed for detail, make it secondary/collapsible under the chart.
2. Remove unexplained `Unknown` rendering under X/Y selectors.
   - Option A: hide unknown badge entirely in Explore controls.
   - Option B: replace with explicit explanatory copy only when meaningful.
3. Convert remaining raw-name usage in result details to display names.
   - `People who answered X` lines should use `displayName`.
4. Rename implementation-jargon control labels.
   - `Result row limit (table mode)` -> plain language label indicating optional detail rows.
5. Improve numeric filter value clarity.
   - Ensure `formatValueWithLabel` path is used consistently for filter options.
   - Expand value-label mappings where needed for frequent demographic filters.
6. Keep "Edit this chart" anchor behavior, but ensure it lands after visual block and is keyboard reachable.

### Acceptance

1. Section 01 on Explore is visually interpretable in common mixed-type flows.
2. No unexplained `Unknown` badge appears below X/Y selectors.
3. Result details use human-readable labels.
4. Filter options are legible and not raw unlabeled code where mappings exist.

### Verification

1. `pnpm check-types`
2. `pnpm test --run`
3. `pnpm test:e2e -- e2e/explore.spec.ts`
4. Manual:
   - Home -> Explore from three different presets.
   - Confirm section 01 always starts with a visual result.
   - Verify selected cell and SQL handoff still work.

## PR3 - Mobile Navigation Access (P0)

Issues covered: H3

### Files

1. `src/routes/__root.tsx`
2. `src/styles.css`
3. `e2e/navigation.spec.ts`

### Tasks

1. Replace fragile overflow-only nav behavior on narrow screens with explicit mobile navigation.
   - Implement menu button + drawer/sheet on mobile breakpoint.
   - Keep existing desktop nav unchanged.
2. Add accessibility mechanics:
   - `aria-expanded` and labeled toggle button.
   - Escape key closes drawer.
   - Focus management when menu opens/closes.
3. Ensure all route links remain available and tappable.
   - Home, Explore, Browse Topics, Build a Profile, What's Connected, SQL Console, Notebook, Data Quality, About.
4. Keep basepath-safe TanStack `Link` usage.

### Acceptance

1. On mobile viewport, nav does not truncate critical links.
2. All primary routes are accessible from the menu.
3. Keyboard and screen-reader behavior is valid for the menu toggle.

### Verification

1. `pnpm check-types`
2. `pnpm test --run`
3. `pnpm test:e2e -- e2e/navigation.spec.ts`
4. Manual:
   - iPhone/Android emulation in Playwright or browser devtools.
   - Verify open/close/focus behavior and route transitions.

## PR4 - Remove Internals + Plain-Language Across Deep Routes (P1)

Issues covered: relationships/profile/columns comprehension leaks, M7 follow-through

### Files

1. `src/routes/relationships.tsx`
2. `src/routes/profile.tsx`
3. `src/routes/columns.tsx`
4. `src/components/column-inspector.tsx`
5. `src/lib/schema/value-labels.ts`
6. `src/lib/schema/human-labels.json`
7. `scripts/profile-schema.mjs` (only if additional label generation logic needed)
8. `e2e/profile-rel-sql-notebook.spec.ts`
9. `e2e/columns.spec.ts`

### Tasks

1. Relationships page:
   - Remove raw internal column key echo from main table (`rel.column` fallback should not be printed as secondary line by default).
   - Replace metric/subtitle jargon:
     - avoid bare `V`, `r`, and `categorical/numeric pairs` phrasing in hero copy.
     - keep exact stats available but framed with plain-language explanations.
2. Profile page:
   - Ensure field labels and selected values render with display names/value labels.
   - Map high-frequency coded demographics (`biomale` etc.) to readable labels consistently.
   - Ensure percentile metric names use display names where available.
3. Columns page:
   - Render card title as display name first, raw name as secondary metadata only.
   - Replace topic filter slugs with user labels:
     - `ocean` -> `Personality (Big Five)`
     - `derived` -> `Computed scores`
   - Replace logical type badge jargon where possible (`categorical` -> `Multiple choice`, etc.).
   - Avoid showing `Unknown` badges as error-like primary tags.
4. Column Inspector:
   - Keep technical context but prioritize readable naming/value labels.

### Acceptance

1. Deep routes no longer surface raw internals in primary reading flow.
2. Topic/tag/type labels are understandable without stats background.
3. Suggested cohorts and profile outputs are interpretable by non-technical users.

### Verification

1. `pnpm check-types`
2. `pnpm test --run`
3. `pnpm test:e2e -- e2e/profile-rel-sql-notebook.spec.ts`
4. `pnpm test:e2e -- e2e/columns.spec.ts`
5. Manual:
   - Relationships top rows read cleanly with no hash/id clutter.
   - Profile suggested cohorts show interpretable field/value pairs.

## PR5 - Polish Pass (P2)

Issues covered: M3, M4, L1, L2, plus minor UX smoothing

### Files

1. `src/routes/index.tsx`
2. `src/components/charts/grouped-bar-chart.tsx`
3. `src/components/charts/chart-config.ts`
4. `src/styles.css`
5. `e2e/dashboard.spec.ts`

### Tasks

1. Collapse advanced evidence text behind progressive disclosure.
   - Show simple tier by default.
   - Expand to technical notes on demand.
2. Address grouped-bar legend glitch.
   - Validate font/fallback, legend sizing, and wrapper styles.
   - Ensure label rendering is stable at common viewport widths.
3. Improve preset-switch perceived performance.
   - Add transition/skeleton state on preset change, not just first load.
4. Add light hierarchy to question cards.
   - Promote 1-2 cards (visual weight only; no heavy layout changes).

### Acceptance

1. Evidence block is readable at a glance for casual users.
2. Legend text renders consistently (no overlap artifacts).
3. Preset switches feel intentional (no blank flash).

### Verification

1. `pnpm check-types`
2. `pnpm test --run`
3. `pnpm test:e2e -- e2e/dashboard.spec.ts`
4. Manual visual check on desktop + mobile.

## Cross-Cutting Requirements

1. Preserve basepath-safe routing (`Link` and TanStack router search state).
2. Keep analytical depth available; do not remove power-user features.
3. Prefer displayName + valueLabels everywhere user-facing.
4. Do not regress existing Notebook, SQL, and Data Quality workflows.

## Testing Matrix

Automated gates per PR:

1. `pnpm check-types`
2. `pnpm test --run`
3. Targeted e2e specs for touched surfaces

Final full regression sweep:

1. `pnpm check-types`
2. `pnpm test --run`
3. `pnpm test:e2e`
4. `pnpm build`

Manual final pass (production-like):

1. Home preset switching + deep links.
2. Home -> Explore flow for at least 5 presets.
3. Mobile nav on all primary pages.
4. Profile suggested cohorts and output readability.
5. Relationships table readability and metric comprehension.
6. Browse Topics tag/type clarity.

## Risks and Mitigations

1. Risk: Scope creep from "copy tweaks" into broad redesign.
   - Mitigation: keep UI structure stable; target comprehension and access first.
2. Risk: Mixed-type Explore visualization introduces query/perf regressions.
   - Mitigation: start with bounded aggregate queries and keep raw table as fallback.
3. Risk: Label changes could drift from findings generator output.
   - Mitigation: treat `analysis/build_findings.py` as source of truth; regenerate artifacts.
4. Risk: Mobile nav changes break desktop styling.
   - Mitigation: isolate with clear breakpoints and e2e coverage for both layouts.

## Rollout

1. Merge PR1-PR3 first (all P0 blockers).
2. Merge PR4 once P0 is stable.
3. Merge PR5 as a polish pass.
4. After production deploy, run the manual final pass checklist.

## Completion Criteria

Move this file to `docs/plans/completed/` when:

1. PR1-PR5 are merged.
2. Final regression sweep passes.
3. `docs/worklog.md` has a summary entry with command/test evidence.
