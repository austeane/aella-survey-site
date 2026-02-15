import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { useEffect, useMemo, useRef, useState } from "react";

import { CHART_COLORS, CHART_FONT } from "./chart-config";

export interface NetworkNode {
  id: string;
  label: string;
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

interface SimNode extends SimulationNodeDatum, NetworkNode {
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  value: number;
  metric: "cramers_v" | "correlation";
  direction?: "positive" | "negative";
}

function isSimNode(value: SimNode | string | number): value is SimNode {
  return typeof value === "object" && value !== null && "id" in value;
}

interface NetworkGraphProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  selectedId?: string | null;
  onSelect?: (nodeId: string) => void;
  compact?: boolean;
}

function nodeColor(tag: NetworkNode["tag"]): string {
  if (tag === "fetish") return CHART_COLORS.accent;
  if (tag === "demographic") return CHART_COLORS.ink;
  if (tag === "ocean") return CHART_COLORS.highlight;
  if (tag === "derived") return CHART_COLORS.inkLight;
  return CHART_COLORS.rule;
}

export function NetworkGraph({
  nodes,
  edges,
  selectedId,
  onSelect,
  compact = false,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [size, setSize] = useState({ width: 900, height: compact ? 220 : 560 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const simNodesRef = useRef<SimNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);

  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const edge of edges) {
      if (!map.has(edge.source)) map.set(edge.source, new Set());
      if (!map.has(edge.target)) map.set(edge.target, new Set());
      map.get(edge.source)?.add(edge.target);
      map.get(edge.target)?.add(edge.source);
    }
    return map;
  }, [edges]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width;
      if (!nextWidth) return;
      setSize({
        width: Math.max(320, nextWidth),
        height: compact ? 220 : 560,
      });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [compact]);

  useEffect(() => {
    const simNodes: SimNode[] = nodes.map((node) => ({ ...node }));
    const simNodeById = new Map(simNodes.map((node) => [node.id, node]));

    const simLinks: SimLink[] = edges.flatMap((edge) => {
        const source = simNodeById.get(edge.source);
        const target = simNodeById.get(edge.target);
        if (!source || !target) return [];
        return [{
          source,
          target,
          value: edge.value,
          metric: edge.metric,
          direction: edge.direction,
        }];
      });

    const simulation = forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance((d) => Math.max(40, 120 - d.value * 90)),
      )
      .force("charge", forceManyBody().strength(compact ? -55 : -95))
      .force("center", forceCenter(size.width / 2, size.height / 2))
      .force("collide", forceCollide<SimNode>((d) => 5 + Math.sqrt(d.degree ?? 1) * 1.2))
      .stop();

    const ticks = compact ? 120 : 200;
    for (let i = 0; i < ticks; i += 1) {
      simulation.tick();
    }

    simNodesRef.current = simNodes;
    simLinksRef.current = simLinks;

    simulation.stop();
  }, [nodes, edges, size.width, size.height, compact]);

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

    const activeId = hoveredId ?? selectedId ?? null;
    const highlighted = activeId ? neighbors.get(activeId) ?? new Set<string>() : null;

    for (const edge of simLinksRef.current) {
      if (!isSimNode(edge.source) || !isSimNode(edge.target)) {
        continue;
      }

      const source = edge.source;
      const target = edge.target;
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
      context.lineWidth = Math.max(0.5, edge.value * 2.1);
      context.setLineDash(edge.metric === "correlation" ? [4, 3] : []);
      context.globalAlpha = isConnected
        ? edge.metric === "correlation"
          ? 0.5
          : 0.36
        : 0.12;
      context.stroke();
    }

    context.setLineDash([]);

    const topDegreeThreshold = compact ? 8 : 12;
    for (const node of simNodesRef.current) {
      const degree = node.degree ?? 1;
      const radius = Math.max(3.2, Math.min(12, 3.2 + Math.sqrt(degree)));
      const isActive = node.id === activeId;
      const isNeighbor = activeId ? neighbors.get(activeId)?.has(node.id) : false;
      const faded = Boolean(activeId && !isActive && !isNeighbor);

      context.beginPath();
      context.arc(node.x ?? 0, node.y ?? 0, radius, 0, Math.PI * 2);
      context.fillStyle = nodeColor(node.tag);
      context.globalAlpha = faded ? 0.18 : 0.96;
      context.fill();

      if (node.id === selectedId) {
        context.beginPath();
        context.arc(node.x ?? 0, node.y ?? 0, radius + 2.6, 0, Math.PI * 2);
        context.strokeStyle = CHART_COLORS.ink;
        context.lineWidth = 1.2;
        context.globalAlpha = 0.95;
        context.stroke();
      }

      const showLabel =
        !compact &&
        ((node.degree ?? 0) >= topDegreeThreshold || node.id === activeId || node.id === selectedId);
      if (showLabel) {
        context.font = `9px ${CHART_FONT.mono}`;
        context.fillStyle = CHART_COLORS.ink;
        context.globalAlpha = faded ? 0.3 : 0.95;
        context.fillText(node.label, (node.x ?? 0) + radius + 2, (node.y ?? 0) - radius - 1);
      }
    }

    context.globalAlpha = 1;
  }, [size.width, size.height, hoveredId, selectedId, neighbors, compact]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      let nearest: { id: string; distance: number } | null = null;

      for (const node of simNodesRef.current) {
        const dx = x - (node.x ?? 0);
        const dy = y - (node.y ?? 0);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radius = Math.max(6, Math.min(14, 4 + Math.sqrt(node.degree ?? 1)));
        if (distance <= radius) {
          if (!nearest || distance < nearest.distance) {
            nearest = { id: node.id, distance };
          }
        }
      }

      setHoveredId(nearest?.id ?? null);
    };

    const onLeave = () => setHoveredId(null);

    const onClick = () => {
      if (!hoveredId) return;
      onSelect?.(hoveredId);
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);
    return () => {
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [onSelect, hoveredId]);

  return (
    <div ref={containerRef} className="w-full border border-[var(--rule)] bg-[var(--paper)]">
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
}
