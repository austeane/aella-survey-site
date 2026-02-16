# Feature: Two-finger scroll to pan in fullscreen — COMPLETED

Moved to completed after verification.

## Summary
In fullscreen mode, two-finger trackpad scroll now **pans** the graph instead of zooming. Pinch-to-zoom still works. Outside fullscreen, behavior is unchanged (wheel → zoom).

## Implementation
- Canvas `wheel` listener (fullscreen only) intercepts non-pinch events and applies `deltaX`/`deltaY` as d3-zoom transform translations
- d3-zoom filter rejects non-pinch wheel events in fullscreen so they don't double-fire as zoom
- `isFullscreenRef` lets the filter read fullscreen state without triggering zoom re-initialization
- Container gets `overflow: hidden` in fullscreen to prevent browser scroll behavior

## File
- `src/components/charts/network-graph.tsx`
