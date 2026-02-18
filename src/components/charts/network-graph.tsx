import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CHART_COLORS, CHART_FONT } from "./chart-config";

export interface NetworkNode {
  id: string;
  label: string;
  fullLabel?: string;
  tag?: "fetish" | "demographic" | "ocean" | "derived" | "other";
  degree?: number;
  subtitle?: string;
  clusterId?: string;
}

export interface NetworkEdge {
  source: string;
  target: string;
  value: number;
  metric: "cramers_v" | "correlation";
  direction?: "positive" | "negative";
}

export type NetworkViewMode = "all" | "focused" | "strong";

interface SimNode extends SimulationNodeDatum, NetworkNode {
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  value: number;
  metric: "cramers_v" | "correlation";
  direction?: "positive" | "negative";
}

interface FilterNetworkEdgesArgs {
  edges: NetworkEdge[];
  selectedId?: string | null;
  edgeMinValue: number;
  viewMode: NetworkViewMode;
  strongEdgeValue: number;
}

interface EffectiveCutoffArgs {
  edgeMinValue: number;
  viewMode: NetworkViewMode;
  strongEdgeValue: number;
}

interface WorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function edgeKey(source: string, target: string): string {
  return source < target ? `${source}::${target}` : `${target}::${source}`;
}

export function filterNetworkEdges({
  edges,
  selectedId,
  edgeMinValue,
  viewMode,
  strongEdgeValue,
}: FilterNetworkEdgesArgs): NetworkEdge[] {
  const cutoff = getEffectiveNetworkEdgeCutoff({
    edgeMinValue,
    viewMode,
    strongEdgeValue,
  });

  const thresholded = edges.filter((edge) => edge.value >= cutoff);
  if (viewMode !== "focused" || !selectedId) {
    return thresholded;
  }

  const neighborhood = new Set<string>([selectedId]);
  for (const edge of thresholded) {
    if (edge.source === selectedId || edge.target === selectedId) {
      neighborhood.add(edge.source);
      neighborhood.add(edge.target);
    }
  }

  return thresholded.filter(
    (edge) => neighborhood.has(edge.source) && neighborhood.has(edge.target),
  );
}

export function getEffectiveNetworkEdgeCutoff({
  edgeMinValue,
  viewMode,
  strongEdgeValue,
}: EffectiveCutoffArgs): number {
  return viewMode === "strong"
    ? Math.max(edgeMinValue, strongEdgeValue)
    : edgeMinValue;
}

function isSimNode(value: SimNode | string | number): value is SimNode {
  return typeof value === "object" && value !== null && "id" in value;
}

interface NetworkGraphProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedId?: string | null;
  onSelect?: (nodeId: string) => void;
  onClearSelection?: () => void;
  compact?: boolean;
  edgeMinValue?: number;
  viewMode?: NetworkViewMode;
  strongEdgeValue?: number;
  clusterLabelsById?: Record<string, string>;
  showIsolates?: boolean;
}

function nodeColor(tag: NetworkNode["tag"]): string {
  if (tag === "fetish") return CHART_COLORS.accent;
  if (tag === "demographic") return CHART_COLORS.ink;
  if (tag === "ocean") return CHART_COLORS.highlight;
  if (tag === "derived") return CHART_COLORS.inkLight;
  return CHART_COLORS.rule;
}

function nodeRadius(degree: number | undefined): number {
  return Math.max(3.2, Math.min(12, 3.2 + Math.sqrt(degree ?? 1)));
}

type Point = [number, number];

function crossProduct(origin: Point, a: Point, b: Point): number {
  return (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0]);
}

function convexHull(points: Point[]): Point[] | null {
  if (points.length < 3) return null;

  const sorted = [...points].sort((left, right) => {
    if (left[0] === right[0]) return left[1] - right[1];
    return left[0] - right[0];
  });

  const lower: Point[] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && crossProduct(lower[lower.length - 2]!, lower[lower.length - 1]!, point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper: Point[] = [];
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index]!;
    while (upper.length >= 2 && crossProduct(upper[upper.length - 2]!, upper[upper.length - 1]!, point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  lower.pop();
  upper.pop();

  const hull = [...lower, ...upper];
  return hull.length >= 3 ? hull : null;
}

function polygonCentroid(points: Point[]): Point {
  let x = 0;
  let y = 0;
  for (const [px, py] of points) {
    x += px;
    y += py;
  }
  return [x / points.length, y / points.length];
}

function expandHull(points: Point[], padding: number): Point[] {
  const [centerX, centerY] = polygonCentroid(points);
  return points.map(([x, y]) => {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return [x, y];

    const scale = (distance + padding) / distance;
    return [centerX + dx * scale, centerY + dy * scale];
  });
}

export function NetworkGraph({
  nodes,
  edges,
  selectedId,
  onSelect,
  onClearSelection,
  compact = false,
  edgeMinValue = 0,
  viewMode = "all",
  strongEdgeValue = 0.2,
  clusterLabelsById,
  showIsolates = false,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [size, setSize] = useState({ width: 900, height: compact ? 220 : 560 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [redrawTick, setRedrawTick] = useState(0);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [isCanvasFocused, setIsCanvasFocused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [worldBounds, setWorldBounds] = useState<WorldBounds | null>(null);
  const effectiveCompact = compact && !isFullscreen;

  const simNodesRef = useRef<SimNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);
  const layoutCacheRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const zoomBehaviorRef = useRef<ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);
  const isFullscreenRef = useRef(false);
  const redrawRafRef = useRef<number | null>(null);
  const zoomAnimationRef = useRef<number | null>(null);
  const suppressClickUntilRef = useRef(0);
  const dragMovedRef = useRef(false);
  const gestureStartTransformRef = useRef<ZoomTransform>(zoomIdentity);
  const pendingFocusIdRef = useRef<string | null>(null);

  const requestRedraw = useCallback(() => {
    if (redrawRafRef.current != null) return;
    redrawRafRef.current = window.requestAnimationFrame(() => {
      redrawRafRef.current = null;
      setRedrawTick((current) => current + 1);
    });
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container || typeof document === "undefined") return;

    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
        return;
      }
      await container.requestFullscreen();
    } catch {
      // no-op: fullscreen can fail on unsupported browsers or blocked permissions
    }
  }, []);

  const visibleEdges = useMemo(
    () =>
      filterNetworkEdges({
        edges,
        selectedId,
        edgeMinValue,
        viewMode,
        strongEdgeValue,
      }),
    [edges, selectedId, edgeMinValue, viewMode, strongEdgeValue],
  );

  const visibleEdgeKeySet = useMemo(
    () => new Set(visibleEdges.map((edge) => edgeKey(edge.source, edge.target))),
    [visibleEdges],
  );

  const visibleNodeIds = useMemo(() => {
    if (showIsolates) {
      const ids = new Set(nodes.map((node) => node.id));
      if (selectedId) {
        ids.add(selectedId);
      }
      return ids;
    }

    const ids = new Set<string>();
    for (const edge of visibleEdges) {
      ids.add(edge.source);
      ids.add(edge.target);
    }
    if (selectedId) {
      ids.add(selectedId);
    }
    return ids;
  }, [nodes, showIsolates, visibleEdges, selectedId]);

  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const edge of visibleEdges) {
      if (!map.has(edge.source)) map.set(edge.source, new Set());
      if (!map.has(edge.target)) map.set(edge.target, new Set());
      map.get(edge.source)?.add(edge.target);
      map.get(edge.target)?.add(edge.source);
    }
    return map;
  }, [visibleEdges]);

  useEffect(
    () => () => {
      if (redrawRafRef.current != null) {
        window.cancelAnimationFrame(redrawRafRef.current);
      }
      if (zoomAnimationRef.current != null) {
        window.cancelAnimationFrame(zoomAnimationRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof document === "undefined") return;

    const onFullscreenChange = () => {
      const fs = document.fullscreenElement === containerRef.current;
      isFullscreenRef.current = fs;
      setIsFullscreen(fs);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    onFullscreenChange();

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isFullscreen) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();

      const zb = zoomBehaviorRef.current;
      if (!zb) return;

      const sel = select(canvas);
      const t = transformRef.current;
      const next = t.translate(-e.deltaX, -e.deltaY);
      zb.transform(sel, next);
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [isFullscreen]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width;
      const observedHeight = entries[0]?.contentRect.height;
      if (!nextWidth) return;

      const defaultHeight = effectiveCompact ? 220 : 560;
      const fullscreenHeight = observedHeight
        ? Math.max(320, Math.floor(observedHeight))
        : Math.max(320, Math.floor(window.innerHeight * 0.9));

      setSize({
        width: Math.max(320, nextWidth),
        height: isFullscreen ? fullscreenHeight : defaultHeight,
      });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [effectiveCompact, isFullscreen]);

  useEffect(() => {
    const simNodes: SimNode[] = nodes
      .filter((node) => visibleNodeIds.has(node.id))
      .map((node) => {
        const cached = layoutCacheRef.current.get(node.id);
        return {
          ...node,
          x: cached?.x,
          y: cached?.y,
        };
      });

    const simNodeById = new Map(simNodes.map((node) => [node.id, node]));

    const simLinks: SimLink[] = visibleEdges.flatMap((edge) => {
      const source = simNodeById.get(edge.source);
      const target = simNodeById.get(edge.target);
      if (!source || !target) return [];
      return [
        {
          source,
          target,
          value: edge.value,
          metric: edge.metric,
          direction: edge.direction,
        },
      ];
    });

    if (simNodes.length === 0) {
      simNodesRef.current = [];
      simLinksRef.current = [];
      setWorldBounds(null);
      setLayoutVersion((current) => current + 1);
      requestRedraw();
      return;
    }

    const simulation = forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance((d) => Math.max(40, 120 - d.value * 90)),
      )
      .force("charge", forceManyBody().strength(-90))
      .force("center", forceCenter(size.width / 2, size.height / 2))
      .force("collide", forceCollide<SimNode>((d) => 5 + Math.sqrt(d.degree ?? 1) * 1.2))
      .stop();

    const hasCachedLayout = simNodes.some((node) => layoutCacheRef.current.has(node.id));
    const ticks = hasCachedLayout ? 72 : effectiveCompact ? 130 : 220;
    for (let i = 0; i < ticks; i += 1) {
      simulation.tick();
    }

    const nextCache = new Map(layoutCacheRef.current);
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const node of simNodes) {
      if (Number.isFinite(node.x) && Number.isFinite(node.y)) {
        const x = node.x ?? 0;
        const y = node.y ?? 0;
        nextCache.set(node.id, { x, y });
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    layoutCacheRef.current = nextCache;
    simNodesRef.current = simNodes;
    simLinksRef.current = simLinks;

    if (
      Number.isFinite(minX) &&
      Number.isFinite(minY) &&
      Number.isFinite(maxX) &&
      Number.isFinite(maxY)
    ) {
      setWorldBounds({ minX, minY, maxX, maxY });
    } else {
      setWorldBounds(null);
    }

    simulation.stop();
    setLayoutVersion((current) => current + 1);
    requestRedraw();
  }, [
    nodes,
    visibleEdges,
    visibleNodeIds,
    size.width,
    size.height,
    effectiveCompact,
    requestRedraw,
  ]);

  const animateTransformTo = useCallback(
    (target: ZoomTransform, duration = 320) => {
      const canvas = canvasRef.current;
      const zoomBehavior = zoomBehaviorRef.current;

      if (!canvas || !zoomBehavior) {
        transformRef.current = target;
        setZoomLevel(target.k);
        requestRedraw();
        return;
      }

      if (zoomAnimationRef.current != null) {
        window.cancelAnimationFrame(zoomAnimationRef.current);
        zoomAnimationRef.current = null;
      }

      const start = transformRef.current;
      const startedAt = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startedAt;
        const progress = Math.min(1, elapsed / duration);
        const eased = 1 - (1 - progress) ** 3;

        const next = zoomIdentity
          .translate(
            start.x + (target.x - start.x) * eased,
            start.y + (target.y - start.y) * eased,
          )
          .scale(start.k + (target.k - start.k) * eased);

        select(canvas).call(zoomBehavior.transform, next);

        if (progress < 1) {
          zoomAnimationRef.current = window.requestAnimationFrame(tick);
          return;
        }

        zoomAnimationRef.current = null;
      };

      zoomAnimationRef.current = window.requestAnimationFrame(tick);
    },
    [requestRedraw],
  );

  const resetView = useCallback(
    (animate = true) => {
      if (animate) {
        animateTransformTo(zoomIdentity, 250);
        return;
      }

      const canvas = canvasRef.current;
      const zoomBehavior = zoomBehaviorRef.current;
      if (!canvas || !zoomBehavior) {
        transformRef.current = zoomIdentity;
        setZoomLevel(1);
        requestRedraw();
        return;
      }

      select(canvas).call(zoomBehavior.transform, zoomIdentity);
    },
    [animateTransformTo, requestRedraw],
  );

  const focusNode = useCallback(
    (nodeId: string, animate = true): boolean => {
      const node = simNodesRef.current.find((candidate) => candidate.id === nodeId);
      if (!node || !Number.isFinite(node.x) || !Number.isFinite(node.y)) {
        return false;
      }

      const targetK = Math.max(effectiveCompact ? 1.45 : 1.2, transformRef.current.k);
      const targetX = size.width / 2 - (node.x ?? 0) * targetK;
      const targetY = size.height / 2 - (node.y ?? 0) * targetK;
      const target = zoomIdentity.translate(targetX, targetY).scale(targetK);

      if (animate) {
        animateTransformTo(target, 340);
        return true;
      }

      const canvas = canvasRef.current;
      const zoomBehavior = zoomBehaviorRef.current;
      if (!canvas || !zoomBehavior) {
        transformRef.current = target;
        setZoomLevel(targetK);
        requestRedraw();
        return true;
      }

      select(canvas).call(zoomBehavior.transform, target);
      return true;
    },
    [animateTransformTo, effectiveCompact, size.width, size.height, requestRedraw],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.tabIndex = 0;

    const onPointerDown = () => {
      canvas.focus();
    };

    const onFocus = () => setIsCanvasFocused(true);
    const onBlur = () => setIsCanvasFocused(false);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "0" || event.key === "Home") {
        event.preventDefault();
        resetView(true);
        return;
      }

      if ((event.key === "f" || event.key === "F") && selectedId) {
        event.preventDefault();
        focusNode(selectedId, true);
        return;
      }

      if (event.key === "Escape" && selectedId) {
        event.preventDefault();
        onClearSelection?.();
      }
    };

    canvas.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("mousedown", onPointerDown);
    canvas.addEventListener("touchstart", onPointerDown, { passive: true });
    canvas.addEventListener("focus", onFocus);
    canvas.addEventListener("blur", onBlur);

    return () => {
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("mousedown", onPointerDown);
      canvas.removeEventListener("touchstart", onPointerDown);
      canvas.removeEventListener("focus", onFocus);
      canvas.removeEventListener("blur", onBlur);
    };
  }, [focusNode, onClearSelection, resetView, selectedId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const selection = select(canvas);
    const horizontalPadding = Math.max(110, size.width * 0.22);
    const topPadding = Math.max(90, size.height * 0.18);
    const bottomPadding = Math.max(80, size.height * 0.14);
    const bounds = worldBounds ?? {
      minX: 0,
      minY: 0,
      maxX: size.width,
      maxY: size.height,
    };

    const boundedTranslateExtent: [[number, number], [number, number]] = [
      [bounds.minX - horizontalPadding, bounds.minY - topPadding],
      [bounds.maxX + horizontalPadding, bounds.maxY + bottomPadding],
    ];

    const zoomBehavior = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.35, 6])
      .extent([
        [0, 0],
        [size.width, size.height],
      ])
      .translateExtent(boundedTranslateExtent)
      .filter((event) => {
        if (event.type === "dblclick") return false;
        if (event.type === "wheel") {
          if (isFullscreenRef.current && !event.ctrlKey && !event.metaKey) {
            return false;
          }
          if ("preventDefault" in event) {
            event.preventDefault();
          }
        }
        if ("button" in event && typeof event.button === "number" && event.button !== 0) {
          return false;
        }
        return true;
      })
      .on("start", (event) => {
        const sourceType = event.sourceEvent?.type;
        gestureStartTransformRef.current = transformRef.current;
        if (sourceType === "mousedown" || sourceType === "pointerdown" || sourceType === "touchstart") {
          dragMovedRef.current = false;
          setIsDragging(true);
        }
      })
      .on("zoom", (event) => {
        const sourceType = event.sourceEvent?.type;
        if (sourceType === "mousemove" || sourceType === "pointermove" || sourceType === "touchmove") {
          dragMovedRef.current = true;
        }

        transformRef.current = event.transform;
        setZoomLevel(event.transform.k);
        requestRedraw();
      })
      .on("end", () => {
        const started = gestureStartTransformRef.current;
        const ended = transformRef.current;
        const movedDistance = Math.hypot(ended.x - started.x, ended.y - started.y);
        const zoomDelta = Math.abs(ended.k - started.k);
        const movedEnough = movedDistance > 2 || zoomDelta > 0.01;

        if (movedEnough) {
          suppressClickUntilRef.current = performance.now() + 120;
        }

        dragMovedRef.current = false;
        setIsDragging(false);
      });

    selection.call(zoomBehavior);
    selection.on("dblclick.zoom", null);
    selection.call(zoomBehavior.transform, transformRef.current);

    zoomBehaviorRef.current = zoomBehavior;

    return () => {
      selection.on(".zoom", null);
      zoomBehaviorRef.current = null;
    };
  }, [size.width, size.height, worldBounds, requestRedraw]);

  useEffect(() => {
    if (!selectedId) {
      pendingFocusIdRef.current = null;
      return;
    }

    pendingFocusIdRef.current = selectedId;
    if (focusNode(selectedId, true)) {
      pendingFocusIdRef.current = null;
    }
  }, [selectedId, focusNode]);

  useEffect(() => {
    const pendingId = pendingFocusIdRef.current;
    if (!pendingId) return;

    if (selectedId && pendingId !== selectedId) {
      pendingFocusIdRef.current = selectedId;
      return;
    }

    if (focusNode(pendingId, true)) {
      pendingFocusIdRef.current = null;
    }
  }, [layoutVersion, focusNode, selectedId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size.width * ratio);
    canvas.height = Math.floor(size.height * ratio);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, size.width, size.height);

    const transform = transformRef.current;
    const zoomScale = Math.max(0.35, transform.k);

    context.save();
    context.translate(transform.x, transform.y);
    context.scale(transform.k, transform.k);

    const activeId = hoveredId ?? selectedId ?? null;
    const highlighted = activeId ? neighbors.get(activeId) ?? new Set<string>() : null;

    const clusterGroups = new Map<string, SimNode[]>();
    for (const node of simNodesRef.current) {
      if (!node.clusterId) continue;
      if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) continue;
      if (visibleEdgeKeySet.size > 0 && !visibleNodeIds.has(node.id)) continue;

      const members = clusterGroups.get(node.clusterId) ?? [];
      members.push(node);
      clusterGroups.set(node.clusterId, members);
    }

    const clusterFillPalette = [
      CHART_COLORS.highlight,
      CHART_COLORS.paperWarm,
      CHART_COLORS.ruleLight,
      CHART_COLORS.inkFaded,
    ];

    const placedClusterLabels: Array<{ left: number; right: number; top: number; bottom: number }> = [];
    const sortedClusterIds = [...clusterGroups.keys()].sort();
    for (const [clusterIndex, clusterId] of sortedClusterIds.entries()) {
      const members = clusterGroups.get(clusterId);
      if (!members || members.length < 3) continue;

      const hullPoints = members.map((node) => [node.x ?? 0, node.y ?? 0] as Point);
      const hull = convexHull(hullPoints);
      if (!hull) continue;

      const paddedHull = expandHull(hull, 9 / Math.max(1, zoomScale));
      const clusterIsConnected =
        !activeId || members.some((node) => node.id === activeId || highlighted?.has(node.id));

      context.beginPath();
      context.moveTo(paddedHull[0]![0], paddedHull[0]![1]);
      for (let index = 1; index < paddedHull.length; index += 1) {
        context.lineTo(paddedHull[index]![0], paddedHull[index]![1]);
      }
      context.closePath();
      context.fillStyle = clusterFillPalette[clusterIndex % clusterFillPalette.length]!;
      context.globalAlpha = clusterIsConnected ? 0.1 : 0.04;
      context.fill();

      context.strokeStyle = CHART_COLORS.rule;
      context.lineWidth = Math.max(0.35, 0.8 / Math.sqrt(zoomScale));
      context.globalAlpha = clusterIsConnected ? 0.26 : 0.12;
      context.stroke();

      if (!effectiveCompact) {
        const clusterLabel = clusterLabelsById?.[clusterId] ?? clusterId;
        const [labelX, labelY] = polygonCentroid(paddedHull);
        const labelSize = Math.max(6.6, 10 / Math.max(zoomScale, 1));

        context.font = `${labelSize}px ${CHART_FONT.mono}`;
        const labelWidth = context.measureText(clusterLabel).width;
        const labelBounds = {
          left: labelX + 2,
          right: labelX + 2 + labelWidth,
          top: labelY - labelSize,
          bottom: labelY + labelSize * 0.25,
        };
        const collides = placedClusterLabels.some((placed) =>
          labelBounds.left < placed.right + 6 &&
          labelBounds.right > placed.left - 6 &&
          labelBounds.top < placed.bottom + 4 &&
          labelBounds.bottom > placed.top - 4
        );

        if (!collides) {
          context.fillStyle = CHART_COLORS.ink;
          context.globalAlpha = clusterIsConnected ? 0.46 : 0.18;
          context.fillText(clusterLabel, labelX + 2, labelY);
          placedClusterLabels.push(labelBounds);
        }
      }
    }

    for (const edge of simLinksRef.current) {
      if (!isSimNode(edge.source) || !isSimNode(edge.target)) {
        continue;
      }

      const source = edge.source;
      const target = edge.target;
      if (!visibleEdgeKeySet.has(edgeKey(source.id, target.id))) {
        continue;
      }

      const isConnected =
        !activeId ||
        source.id === activeId ||
        target.id === activeId ||
        highlighted?.has(source.id) ||
        highlighted?.has(target.id);

      context.beginPath();
      context.moveTo(source.x ?? 0, source.y ?? 0);
      context.lineTo(target.x ?? 0, target.y ?? 0);
      context.strokeStyle = edge.metric === "correlation" ? CHART_COLORS.inkLight : CHART_COLORS.accent;
      const minWorldLineWidth = 0.6 / zoomScale;
      context.lineWidth = Math.max(minWorldLineWidth, (edge.value * 2.1) / Math.sqrt(zoomScale));
      context.setLineDash(edge.metric === "correlation" ? [4 / zoomScale, 3 / zoomScale] : []);
      context.globalAlpha = isConnected
        ? edge.metric === "correlation"
          ? 0.5
          : 0.36
        : 0.1;
      context.stroke();
    }

    context.setLineDash([]);

    const topDegreeThreshold = effectiveCompact ? 8 : 12;
    const adaptiveLabelThreshold = Math.max(3, topDegreeThreshold / Math.max(zoomScale, 1));
    const placedNodeLabels: Array<{ left: number; right: number; top: number; bottom: number }> = [];

    for (const node of simNodesRef.current) {
      const degree = node.degree ?? 1;
      const radius = nodeRadius(degree);
      const isActive = node.id === activeId;
      const isNeighbor = activeId ? neighbors.get(activeId)?.has(node.id) : false;
      const fadedByInteraction = Boolean(activeId && !isActive && !isNeighbor);

      context.beginPath();
      context.arc(node.x ?? 0, node.y ?? 0, radius, 0, Math.PI * 2);
      context.fillStyle = nodeColor(node.tag);
      context.globalAlpha = fadedByInteraction ? 0.2 : 0.96;
      context.fill();

      if (node.id === selectedId) {
        context.beginPath();
        context.arc(node.x ?? 0, node.y ?? 0, radius + 2.6, 0, Math.PI * 2);
        context.strokeStyle = CHART_COLORS.ink;
        context.lineWidth = Math.max(0.8, 1.2 / Math.sqrt(zoomScale));
        context.globalAlpha = 0.95;
        context.stroke();
      }

      const showLabel =
        !effectiveCompact &&
        ((node.degree ?? 0) >= adaptiveLabelThreshold || node.id === activeId || node.id === selectedId);
      if (showLabel) {
        const worldFontSize = Math.max(6, 9 / Math.max(zoomScale, 1));
        const labelX = (node.x ?? 0) + radius + 2;
        const labelY = (node.y ?? 0) - radius - 1;
        const isPriorityLabel = node.id === activeId || node.id === selectedId;

        context.font = `${worldFontSize}px ${CHART_FONT.mono}`;
        const labelWidth = context.measureText(node.label).width;
        const labelBounds = {
          left: labelX,
          right: labelX + labelWidth,
          top: labelY - worldFontSize,
          bottom: labelY + worldFontSize * 0.24,
        };
        const overlapsExisting = placedNodeLabels.some((placed) =>
          labelBounds.left < placed.right + 3 &&
          labelBounds.right > placed.left - 3 &&
          labelBounds.top < placed.bottom + 2 &&
          labelBounds.bottom > placed.top - 2
        );

        if (!isPriorityLabel && overlapsExisting) {
          continue;
        }

        context.fillStyle = CHART_COLORS.ink;
        context.globalAlpha = fadedByInteraction ? 0.34 : 0.95;
        context.fillText(node.label, labelX, labelY);
        placedNodeLabels.push(labelBounds);
      }
    }

    context.restore();

    if (zoomScale > 1.25) {
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;

      for (const node of simNodesRef.current) {
        if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) continue;
        minX = Math.min(minX, node.x ?? 0);
        minY = Math.min(minY, node.y ?? 0);
        maxX = Math.max(maxX, node.x ?? 0);
        maxY = Math.max(maxY, node.y ?? 0);
      }

      if (
        Number.isFinite(minX) &&
        Number.isFinite(minY) &&
        Number.isFinite(maxX) &&
        Number.isFinite(maxY)
      ) {
        const mapPadding = 10;
        const mapWidth = 148;
        const mapHeight = 94;
        const mapX = size.width - mapWidth - mapPadding;
        const mapY = size.height - mapHeight - mapPadding;

        const worldPadding = 24;
        const worldMinX = minX - worldPadding;
        const worldMinY = minY - worldPadding;
        const worldWidth = Math.max(1, maxX - minX + worldPadding * 2);
        const worldHeight = Math.max(1, maxY - minY + worldPadding * 2);

        const toMiniX = (value: number) => mapX + ((value - worldMinX) / worldWidth) * mapWidth;
        const toMiniY = (value: number) => mapY + ((value - worldMinY) / worldHeight) * mapHeight;

        context.fillStyle = CHART_COLORS.paper;
        context.globalAlpha = 0.92;
        context.fillRect(mapX, mapY, mapWidth, mapHeight);
        context.strokeStyle = CHART_COLORS.rule;
        context.lineWidth = 1;
        context.globalAlpha = 0.92;
        context.strokeRect(mapX, mapY, mapWidth, mapHeight);

        for (const node of simNodesRef.current) {
          if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) continue;
          if (visibleEdgeKeySet.size > 0 && !visibleNodeIds.has(node.id)) continue;

          const miniX = toMiniX(node.x ?? 0);
          const miniY = toMiniY(node.y ?? 0);

          context.beginPath();
          context.arc(miniX, miniY, node.id === selectedId ? 2.2 : 1.3, 0, Math.PI * 2);
          context.fillStyle = nodeColor(node.tag);
          context.globalAlpha = 0.78;
          context.fill();
        }

        const [viewportLeft, viewportTop] = transform.invert([0, 0]);
        const [viewportRight, viewportBottom] = transform.invert([size.width, size.height]);

        const viewportX = toMiniX(Math.min(viewportLeft, viewportRight));
        const viewportY = toMiniY(Math.min(viewportTop, viewportBottom));
        const viewportWidth = Math.max(4, Math.abs(toMiniX(viewportRight) - toMiniX(viewportLeft)));
        const viewportHeight = Math.max(4, Math.abs(toMiniY(viewportBottom) - toMiniY(viewportTop)));

        context.strokeStyle = CHART_COLORS.accent;
        context.lineWidth = 1.05;
        context.globalAlpha = 0.96;
        context.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);

        context.fillStyle = CHART_COLORS.ink;
        context.font = `7px ${CHART_FONT.mono}`;
        context.globalAlpha = 0.68;
        context.fillText("MINI MAP", mapX + 4, mapY + 9);
      }
    }

    context.globalAlpha = 1;
  }, [
    size.width,
    size.height,
    hoveredId,
    selectedId,
    neighbors,
    effectiveCompact,
    visibleEdgeKeySet,
    visibleNodeIds,
    clusterLabelsById,
    redrawTick,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const findNearestNode = (screenX: number, screenY: number): string | null => {
      const [simX, simY] = transformRef.current.invert([screenX, screenY]);
      const zoomScale = Math.max(0.35, transformRef.current.k);
      const hitPadding = Math.max(2, 5 / zoomScale);

      let nearest: { id: string; distance: number } | null = null;

      for (const node of simNodesRef.current) {
        if (visibleEdgeKeySet.size > 0 && !visibleNodeIds.has(node.id)) continue;

        const dx = simX - (node.x ?? 0);
        const dy = simY - (node.y ?? 0);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const visualRadius = nodeRadius(node.degree);
        const hitRadius = visualRadius + hitPadding;
        if (distance <= hitRadius) {
          if (!nearest || distance < nearest.distance) {
            nearest = { id: node.id, distance };
          }
        }
      }

      return nearest?.id ?? null;
    };

    const onMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const nextHoveredId = findNearestNode(x, y);
      setHoveredId((current) => (current === nextHoveredId ? current : nextHoveredId));
    };

    const onLeave = () => {
      setHoveredId(null);
      setIsDragging(false);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || performance.now() < suppressClickUntilRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const nodeId = findNearestNode(x, y);
      if (!nodeId) return;
      onSelect?.(nodeId);
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);

    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [onSelect, visibleEdgeKeySet, visibleNodeIds]);

  const hoveredNode = hoveredId
    ? simNodesRef.current.find((node) => node.id === hoveredId) ?? null
    : null;

  const hoveredTooltip = (() => {
    if (!hoveredNode || !Number.isFinite(hoveredNode.x) || !Number.isFinite(hoveredNode.y)) {
      return null;
    }

    const transform = transformRef.current;
    const anchorX = (hoveredNode.x ?? 0) * transform.k + transform.x;
    const anchorY = (hoveredNode.y ?? 0) * transform.k + transform.y;
    const left = Math.max(8, Math.min(size.width - 228, anchorX + 12));
    const top = Math.max(8, Math.min(size.height - 92, anchorY - 34));

    return {
      title: hoveredNode.fullLabel ?? hoveredNode.label,
      subtitle: hoveredNode.subtitle,
      left,
      top,
    };
  })();

  const cursor = isDragging ? "grabbing" : hoveredId ? "pointer" : "grab";

  return (
    <div
      ref={containerRef}
      className="relative w-full border border-[var(--rule)] bg-[var(--paper)]"
      style={
        isFullscreen
          ? {
            width: "100vw",
            height: "100vh",
            maxHeight: "100vh",
            overflow: "hidden",
            border: "none",
          }
          : undefined
      }
    >
      <canvas
        ref={canvasRef}
        className="block w-full outline-none"
        style={{
          cursor,
          boxShadow: isCanvasFocused ? "inset 0 0 0 1px var(--accent)" : undefined,
          touchAction: "none",
        }}
      />

      {hoveredTooltip ? (
        <div
          className="pointer-events-none absolute z-20 max-w-[220px] border border-[var(--ink)] bg-[var(--paper)] px-2 py-1"
          style={{ left: hoveredTooltip.left, top: hoveredTooltip.top }}
        >
          <p className="font-['Source_Serif_4',Georgia,serif] text-[0.76rem] text-[var(--ink)]">
            {hoveredTooltip.title}
          </p>
          {hoveredTooltip.subtitle ? (
            <p className="mono-value mt-0.5 text-[0.6rem] text-[var(--ink-faded)]">
              {hoveredTooltip.subtitle}
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="pointer-events-none absolute bottom-2 left-2 z-30 border border-[var(--rule)] bg-[var(--paper)] px-1.5 py-0.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[0.54rem] uppercase tracking-[0.08em] text-[var(--ink-faded)]">
        0 reset{selectedId ? " · F focus · Esc clear" : ""}
      </p>

      <div className="pointer-events-none absolute right-2 top-2 z-40 flex items-center gap-1.5">
        <span className="border border-[var(--rule)] bg-[var(--paper)] px-1.5 py-0.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[0.58rem] text-[var(--ink-faded)]">
          {zoomLevel.toFixed(2)}x
        </span>

        <button
          type="button"
          onClick={() => {
            void toggleFullscreen();
          }}
          className="pointer-events-auto border border-[var(--rule)] bg-[var(--paper)] px-2 py-1 font-['JetBrains_Mono',ui-monospace,monospace] text-[0.6rem] uppercase tracking-[0.14em] text-[var(--ink-faded)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
        >
          {isFullscreen ? "Exit full" : "Fullscreen"}
        </button>

        <button
          type="button"
          onClick={() => resetView(true)}
          className="pointer-events-auto border border-[var(--rule)] bg-[var(--paper)] px-2 py-1 font-['JetBrains_Mono',ui-monospace,monospace] text-[0.6rem] uppercase tracking-[0.14em] text-[var(--ink-faded)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
        >
          Reset view
        </button>

        {selectedId ? (
          <button
            type="button"
            onClick={() => focusNode(selectedId, true)}
            className="pointer-events-auto border border-[var(--rule)] bg-[var(--paper)] px-2 py-1 font-['JetBrains_Mono',ui-monospace,monospace] text-[0.6rem] uppercase tracking-[0.14em] text-[var(--ink-faded)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
          >
            Focus selection
          </button>
        ) : null}
      </div>
    </div>
  );
}
