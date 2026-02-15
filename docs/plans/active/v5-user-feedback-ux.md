# Plan: V5 User Feedback UX Improvements

Status: Draft
Created: 2026-02-14
Source: Direct user testing feedback

## Context

A real user tested the app and gave three pieces of feedback, all related to discoverability and visual clarity:

1. **What's Connected page**: "When it says 'of these options what is the most erotic' it doesn't show the answer... So it's not relevant." Multiple questions share identical display names (e.g., "Of these options, which one is the most erotic?" appears 4+ times). The hash suffix that differentiates them (`35jn7ei`, `35jn7ej`, etc.) is stripped by `getColumnDisplayName()`. Users can't tell them apart. Same problem with "How old were you when you first experienced..." questions.

2. **Profile page — visuals**: "I think in the profile building it would be more fun to be able to see all the questions and how they compare with the average visually like in your graphs." The profile results (sections 03-04) are pure data tables. The user wants visual bar charts like the featured findings on the home page.

3. **Profile page — layout/compare**: "Or compare to another profile / But also visually / The way it's laid out is kind of confusing." Compare mode exists but results are tables. The overall layout is hard to follow.

---

## Issue 1: Ambiguous Question Names on What's Connected

### Root Cause

- Column names in the parquet include a hash suffix: `"Of these options, which one is the most erotic? (35jn7ei)"`
- `getColumnDisplayName()` strips the hash via `stripHashSuffix()`, producing identical display text
- The relationships table shows ~20 related questions with no way to distinguish duplicates
- The actual answer options (e.g., "Affection, Cuddling, Romance..." vs "Octopi/squid, Foxes, Dolphins...") are the real differentiator but are never shown

### Options

**Option A: Show top answer values as subtitle (Recommended)**

Under each question link in the relationships table, show the top 2-3 answer values from the schema as a gray subtitle. E.g.:

> Of these options, which one is the most erotic?
> _Affection · Cuddling · Romance · ..._

Implementation:
- Add `approxTopValues` to `columns.generated.json` during schema profiling (run `pnpm profile-schema` to populate)
- OR query DuckDB at page load for columns that have duplicate display names (lazy, only when needed)
- Render as a secondary line in the relationships table, styled in `mono-value` at smaller size

Pros: Immediately disambiguates. Tells the user what the question is actually about.
Cons: Need to either extend schema generation or add a DuckDB query. Adds vertical space to the table.

**Option B: Keep hash suffix for duplicates only**

If a display name appears more than once in the list, append the hash suffix back: "Of these options, which one is the most erotic? (35jn7ei)".

Pros: Zero data changes, pure display logic.
Cons: Hash suffix is meaningless to users — they still can't tell what the question is about.

**Option C: Use a tooltip to show answer options on hover**

Keep the current display but add a hover tooltip (or click-to-expand) showing the column's top values.

Pros: Doesn't change layout. Progressive disclosure.
Cons: Discoverability problem — user won't know to hover. Doesn't solve the "it's not relevant" feeling.

### Recommendation

**Option A**. The answer values ARE the question identity for these "Of these options..." columns. Showing them inline makes the page actually useful. Option B is a minimal fallback if Option A is too much work.

---

## Issue 2: Profile Results Need Visual Charts

### Current State

- **Section 03 "How This Group Compares"**: DataTable with columns [Metric, Group Median, Ranking vs. Everyone, N]. Shows 5 personality/kink metrics.
- **Section 04 "What Makes This Group Different"**: DataTable with columns [Column, Value, Times more likely, Group % (N), Global % (N)]. Shows top 8 over-indexed traits.

The user wants charts "like your graphs" (referring to the grouped bar charts on the home page).

### Options

**Option A: Horizontal bar chart for over-indexing (Recommended)**

Replace or supplement section 04's table with a horizontal bar chart showing the top over-indexed traits. Each bar shows group % vs global %, with the ratio as a label.

```
Age: 25-28          ████████████████████ 100% group  ▎▎▎▎ 21% global  (4.73x)
Biological Sex: Male  ████████████████████ 100% group  ██████████ 51% global  (1.95x)
Bondage: Chastity     ██ 2.4% group  ▎ 1.6% global  (1.53x)
```

Implementation:
- New component: `OverIndexChart` — horizontal paired bars (group vs global), sorted by ratio
- Data is already available in `summary.overIndexing`
- Keep the table below as a "detailed view" toggle for power users

Pros: Immediately visual. Reuses existing data. The ratio (4.73x) becomes viscerally clear.
Cons: New component to build. Need to handle long column+value labels.

**Option B: Radar/spider chart for personality metrics**

Section 03's 5 personality metrics (kink count, powerlessness, openness, extroversion, neuroticism) as a radar chart showing the group's percentile vs the 50th percentile baseline.

Pros: Compelling "personality profile" visualization.
Cons: Radar charts are notoriously hard to read. Only 5 data points — might be underwhelming.

**Option C: Simple bar chart for section 03, keep table for section 04**

Replace section 03's table with a vertical bar chart where each bar is the group's percentile (0-100%), with a 50% reference line.

```
Kink Categories  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 54%
Powerlessness    ▓▓▓▓▓▓▓▓▓▓▓▓ 48%
Openness         ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 60%  ← above average
Extroversion     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 62%  ← above average
Neuroticism      ▓▓▓▓▓▓▓▓▓▓ 42%
                 ──────────50%──────────
```

Pros: Simple, clear, easy to build with existing `SimpleBarChart`. The 50% line makes "above/below average" instantly obvious.
Cons: Doesn't address section 04 (over-indexing), which is the more interesting part.

**Option D: Combined approach (A + C)**

Use Option C for section 03 (percentile bar chart with 50% reference line) AND Option A for section 04 (horizontal over-indexing bars). This gives both sections visual treatment.

Pros: Full visual overhaul. Both sections become scannable.
Cons: More work, but each component is independently simple.

### Recommendation

**Option D** — both sections deserve visualization. Section 03 is a quick win with `SimpleBarChart` + reference line. Section 04 is the big payoff (the "what makes you different" is the most interesting part of the page).

---

## Issue 3: Profile Page Layout & Compare Mode

### Current Problems

1. **Confusing flow**: The page jumps from filter controls → stat cards → data table → data table with no visual breaks or narrative
2. **Compare mode results are dense**: Two side-by-side DataTables with 6+ columns each
3. **No visual distinction between group and global**: Just numbers in columns

### Options

**Option A: Narrative layout with chart sections (Recommended)**

Restructure the results into a clear story flow:

```
01. Choose your group          [existing, keep as-is]
02. Your group at a glance     [stat cards — existing, minor cleanup]
03. Personality snapshot        [NEW: bar chart of percentiles vs 50% baseline]
04. What stands out             [NEW: horizontal bar chart of over-indexed traits]
05. Explore deeper              [links to crosstab with pre-populated filters]
```

For compare mode, sections 03-04 show side-by-side or overlaid charts:
- Section 03: Grouped bar chart (Group A vs Group B percentiles)
- Section 04: Paired horizontal bars (Group A over-indexing vs Group B)

Implementation:
- Reorder existing sections for better narrative flow
- Add chart components from Issue 2
- For compare mode: use `GroupedBarChart` (already exists) for section 03
- Keep tables available as expandable "Show data" toggles

**Option B: Tab-based results**

Put single/compare results in tabs: "Summary | Personality | What's Different | Raw Data"

Pros: Clean separation. Each tab is focused.
Cons: Hides information. User has to click through tabs to see everything.

**Option C: Minimal cleanup — just add visual breathing room**

Keep current structure but add:
- Clearer section dividers
- Better section headers with descriptions
- Larger stat cards
- Slightly wider tables

Pros: Least work.
Cons: Doesn't address the core "it's confusing" feedback.

### Recommendation

**Option A**. The narrative flow is what makes the home page work well (per the UX testing report). Apply the same principle here: lead with a clear story, use charts as the primary view, tables as secondary detail.

---

## Implementation Scope Estimate

| Item | Effort | Dependencies |
|------|--------|-------------|
| Issue 1: Answer value subtitles on relationships | Small | Schema profiling or DuckDB query |
| Issue 2: Percentile bar chart (section 03) | Small | Extend `SimpleBarChart` with reference line |
| Issue 2: Over-indexing horizontal bars (section 04) | Medium | New `OverIndexChart` component |
| Issue 3: Layout restructure + compare charts | Medium | Builds on Issue 2 components |

Suggested order: Issue 1 → Issue 2 (section 03) → Issue 2 (section 04) → Issue 3

---

## Open Questions

1. Should the over-indexing chart show group % vs global %, or just the ratio? (Ratio is more dramatic; both percentages give full context.)
2. For compare mode charts, overlay on same axes or side-by-side? (Overlay is more compact; side-by-side is clearer.)
3. Should we add "category context" to the column schema more broadly (not just for relationships page)? This would help everywhere column names are truncated.
