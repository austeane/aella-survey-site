# Network Galaxy: Navigation + Clarity Upgrade (Completed)

## Context
The `/relationships` network started as a dense canvas chart with hover/click only. Exploration quality suffered because users could not navigate, declutter, or quickly orient around the selected node.

## Goal
Make the top network section feel explorable, legible, and polished across desktop and mobile.

## Completed scope

### P0 — Navigation + readability baseline
1. **Pan/zoom camera controls (canvas-safe)**
   - d3 zoom behavior attached directly to canvas.
   - Canvas transform applied in draw pass.
   - Inverse transform used for hover/click hit-testing.
   - Drag-safe click suppression and cursor states (`grab` / `grabbing`).

2. **Wayfinding controls**
   - On-canvas controls for:
     - `Reset view`
     - `Focus selection`
     - zoom factor badge
   - Animated auto-focus when selection changes.

3. **Declutter controls**
   - Network view modes:
     - `All links`
     - `Strong links`
     - `Selected + 1 hop`
   - Edge strength slider (`0.05–0.35`).
   - Live visible-count feedback.

4. **Layout stability**
   - Node position cache reused across rerenders to reduce graph jumping.

### P1 — Visual structure + discovery polish
1. **Cluster structure in graph**
   - Convex-hull backdrops per cluster.
   - Inline cluster labels on the graph.

2. **Zoom-aware detail policy**
   - Label density adapts with zoom (more labels when zoomed in).
   - Label/edge widths scale for legibility.

3. **Hover context tooltip**
   - Full question label + subtitle overlay for hovered nodes.

### P2 — Advanced navigation + mobile fallback
1. **Mini-map overlay**
   - Appears at higher zoom levels.
   - Shows full graph extent + current viewport rectangle.

2. **Keyboard shortcuts**
   - `0` / `Home` → reset camera
   - `F` → focus selected node
   - `Esc` → clear selection

3. **Mobile fallback (<640px)**
   - Replaces graph with simplified cluster-first list view.
   - Tap member chips to select and open relationship cards.

## Files updated
- `src/components/charts/network-graph.tsx`
  - pan/zoom transforms, hit-testing, controls, focus animations
  - cluster hulls + labels
  - hover tooltip
  - mini-map overlay
  - keyboard shortcuts
- `src/routes/relationships.tsx`
  - view mode toggles + edge threshold slider
  - visible graph counts
  - desktop graph wiring and mobile simplified fallback
  - cluster label mapping and selection actions

## Verification checklist
1. `pnpm dev` → open `/relationships`.
2. Drag pan + wheel zoom work smoothly.
3. Hover/click accuracy holds at multiple zoom levels.
4. `Reset view`, `Focus selection`, and auto-focus work.
5. View mode and threshold controls update graph immediately.
6. Cluster hulls/labels appear and remain readable.
7. Mini-map appears when zoomed in and viewport box updates.
8. Keyboard shortcuts (`0`, `F`, `Esc`) work when graph is focused.
9. Mobile (<640px): cluster/list fallback renders and selection works.
10. `pnpm check-types` passes.
