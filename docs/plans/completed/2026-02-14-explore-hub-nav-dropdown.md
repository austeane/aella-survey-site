# Plan: Explore Hub + Navigation Dropdown

Status: Completed  
Completed on: 2026-02-14

## Implementation Summary

Delivered:

1. Split Explore route into:
   - `/explore` hub (`src/routes/explore/index.tsx`)
   - `/explore/crosstab` analysis page (`src/routes/explore/crosstab.tsx`)
2. Reworked root nav to 5 top-level items with:
   - Desktop Explore dropdown for grouped destinations
   - Mobile Explore expandable group with ARIA controls
3. Added Home hero CTA: `Start Exploring` -> `/explore`.
4. Migrated crosstab deep links (`x/y` links) to `/explore/crosstab` across home/about/data-quality/relationships/column-inspector.
5. Updated route tree generation and E2E specs for the new route contract.

## Objective

Reduce top-level nav clutter while improving discoverability of exploration pages.

Primary outcomes:

1. Top-level nav becomes: `Home | ✦ Explore | SQL Console | Notebook | About`.
2. `Explore` becomes a hub page at `/explore`.
3. Cross-tab moves to `/explore/crosstab` without breaking deep-link workflows.
4. Mobile navigation is first-class: clear hierarchy, accessible controls, reliable tap behavior.

## Definition of Done

1. `/explore` renders a hub landing page with five clear destinations.
2. Existing crosstab behavior is preserved at `/explore/crosstab` (including URL search params).
3. All links that pass crosstab state (`x`, `y`, `normalization`, `topN`, `filterColumn`, `filterValues`) target `/explore/crosstab`.
4. Desktop nav has 5 top-level items and exposes Explore children via dropdown.
5. Mobile nav supports expanding/collapsing Explore children with proper ARIA, keyboard support, and tap targets.
6. Updated E2E tests pass for navigation and crosstab deep-link behavior.

## Scope

In scope:

1. Route split (`/explore` hub + `/explore/crosstab` page).
2. Root nav restructure (desktop dropdown + mobile expandable group).
3. Home CTA addition for Explore hub entry.
4. Link-target migration for crosstab deep links.
5. E2E updates for nav and new route contract.

Out of scope:

1. Backend/API changes.
2. Visual redesign outside nav and Explore hub.
3. Historical docs cleanup outside this plan (can be follow-up).

## Route Contract (Explicit)

1. `/explore` = hub page only (discovery/entry point).
2. `/explore/crosstab` = existing cross-tab analysis page.
3. Any link that encodes crosstab state in query params must use `/explore/crosstab`.
4. Plain exploratory links without crosstab params may keep targeting `/explore`.

## Files to Change

### 1. Route Split

1. Move `src/routes/explore.tsx` -> `src/routes/explore/crosstab.tsx`.
2. In moved file:
   - `createFileRoute("/explore")` -> `createFileRoute("/explore/crosstab")`.
   - `useNavigate({ from: "/explore" })` -> `useNavigate({ from: "/explore/crosstab" })`.
3. Add new file `src/routes/explore/index.tsx` for hub landing page.
4. Remove old `src/routes/explore.tsx` after move.
5. Regenerate route tree via normal dev/build flow (do not hand-edit `src/routeTree.gen.ts`).

### 2. Explore Hub Page

File: `src/routes/explore/index.tsx` (new)

Requirements:

1. Heading: "Explore the Data" with short subtitle framing exploration paths.
2. Five destination cards:
   - Compare Questions -> `/explore/crosstab`
   - Browse Topics -> `/columns`
   - Build a Profile -> `/profile`
   - What's Connected? -> `/relationships`
   - Data Quality -> `/data-quality`
3. Use existing editorial visual language (Ink & Paper), matching current card/button patterns.
4. Feature the crosstab card as primary entry (accent label + stronger border/background).
5. Mobile layout: single-column stack at small widths; no horizontal scrolling.

### 3. Root Navigation Restructure

File: `src/routes/__root.tsx`

Requirements:

1. Replace flat nav list with a structured model supporting `children` and `featured` metadata.
2. Keep desktop top-level items to exactly 5:
   - Home (`/`)
   - Explore (`/explore`, featured, has children)
   - SQL Console (`/sql`)
   - Notebook (`/notebook`)
   - About (`/about`)
3. Explore children:
   - Compare Questions (`/explore/crosstab`)
   - Browse Topics (`/columns`)
   - Build a Profile (`/profile`)
   - What's Connected? (`/relationships`)
   - Data Quality (`/data-quality`)
4. Active-state logic:
   - Explore is active on any of these paths: `/explore`, `/explore/crosstab`, `/columns`, `/profile`, `/relationships`, `/data-quality`.
   - Non-Explore top-level items keep normal active behavior.
5. Desktop interaction:
   - Explore remains a real link to `/explore`.
   - Dropdown is reachable by mouse and keyboard (`:hover` + `:focus-within` and/or explicit state).
   - Escape closes open menu state if JS state is used.
6. Mobile interaction:
   - Add `mobileExploreOpen` state for expandable Explore group.
   - Group toggle is a `<button>` with `aria-expanded` and `aria-controls`.
   - Sub-links are indented and tappable; selecting any sub-link closes mobile menu and group.
   - Reset `mobileExploreOpen` when main mobile menu closes.

### 4. Navigation and Hub Styling

File: `src/styles.css`

Add/adjust styles for:

1. Desktop dropdown:
   - `.nav-dropdown`, `.nav-dropdown-trigger`, `.nav-dropdown-menu`, `.nav-dropdown-item`.
   - No rounded corners/shadows; use existing border and accent-top rule language.
2. Featured Explore top-level style:
   - `.nav-link--featured` with accent treatment and strong active/focus-visible state.
3. Mobile group styles:
   - `.nav-link--mobile-group`, `.nav-mobile-subitems`, `.nav-link--mobile-sub`.
4. Mobile quality constraints:
   - Minimum tap target ~44px height.
   - Preserve legibility at 320px width.
   - Avoid nowrap clipping that hides labels.
5. Focus and keyboard visibility:
   - Add visible `:focus-visible` outlines for dropdown trigger, group toggle, and submenu links.

### 5. Home Page CTA

File: `src/routes/index.tsx`

1. Add a prominent `editorial-button editorial-button--filled` link in hero header after dateline.
2. Label: `Start Exploring`.
3. Target: `/explore`.
4. On mobile, CTA wraps cleanly and does not crowd dateline text.

### 6. Crosstab Deep-Link Target Migration

Update links that are semantically crosstab deep links:

1. `src/routes/index.tsx`
   - "Explore this further" -> `/explore/crosstab`
   - "Open this in Explore" -> `/explore/crosstab`
2. `src/routes/about.tsx`
   - "Explore orientation vs politics" -> `/explore/crosstab`
   - "Compare gender and relationship style" -> `/explore/crosstab`
   - Keep generic "Explore" reference in page list pointing to `/explore` hub.
3. `src/routes/data-quality.tsx`
   - table link with `search={{ x: ... }}` -> `/explore/crosstab`
4. `src/routes/relationships.tsx`
   - relationship jump link (`x` + `y`) -> `/explore/crosstab`
5. `src/components/column-inspector.tsx`
   - string-built href with `x`/`y` -> `/explore/crosstab?...`
   - fallback link without params remains `/explore`.

### 7. E2E Test Updates

1. `e2e/navigation.spec.ts`
   - Update expected desktop top-level links to 5 items.
   - Add dropdown assertions for Explore children (visibility + navigation).
   - Add Explore active-state assertions for grouped routes.
   - Add mobile assertions:
     - menu toggle opens/closes,
     - Explore group expands/collapses,
     - sub-link click navigates and closes mobile menu.
   - Smoke tests include both `/explore` and `/explore/crosstab`.
2. `e2e/explore.spec.ts`
   - Replace crosstab entry URLs: `/explore...` -> `/explore/crosstab...`.
3. `e2e/dashboard.spec.ts`
   - Update href expectations to `/explore/crosstab` where x/y params are required.
4. `e2e/profile-rel-sql-notebook.spec.ts`
   - Update relationships result-link expectation to `/explore/crosstab`.

## Mobile Excellence Acceptance Criteria

1. All nav actions are usable at 390x844 and 320x568.
2. No nav item requires hover-only interaction.
3. Explore group state is screen-reader explicit (`aria-expanded`, controlled region).
4. Tap targets are comfortable (about 44px high minimum) and do not overlap.
5. Menu closes predictably after navigation and with Escape.
6. No horizontal overflow in nav/menu/hub cards on small screens.

## Implementation Sequence

1. Route split + hub page scaffold.
2. Nav data model + desktop dropdown rendering.
3. Mobile group behavior + accessibility wiring.
4. CSS polish for desktop/mobile parity.
5. Deep-link migration across route/components.
6. E2E updates and full verification.

## Verification Checklist

1. `pnpm check-types`
2. `pnpm test --run`
3. `pnpm test:e2e -- e2e/navigation.spec.ts e2e/explore.spec.ts e2e/dashboard.spec.ts e2e/profile-rel-sql-notebook.spec.ts`
4. Manual desktop:
   - Explore top-level click -> `/explore` hub.
   - Explore dropdown items navigate correctly.
   - Explore top-level is active on all grouped pages.
5. Manual mobile (390px and 320px widths):
   - Open menu, expand Explore, navigate via each child link.
   - Confirm menu/group close after navigation.
   - Confirm no clipping/overflow and visible keyboard focus.
6. Manual deep-link checks:
   - Home and About crosstab links land on `/explore/crosstab` with correct query params.
   - Relationships/Data Quality/Column Inspector crosstab links preserve expected params.
