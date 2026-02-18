import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ColumnCombobox } from "@/components/column-combobox";
import { ColumnNameTooltip } from "@/components/column-name-tooltip";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { MiniHeatmap, type MiniHeatmapCell } from "@/components/charts/mini-heatmap";
import {
  NetworkGraph,
  filterNetworkEdges,
  getEffectiveNetworkEdgeCutoff,
  type NetworkEdge,
  type NetworkNode,
  type NetworkViewMode,
} from "@/components/charts/network-graph";
import { QuestionIdentityCard } from "@/components/question-identity-card";
import { track } from "@/lib/client/track";
import { useDuckDB } from "@/lib/duckdb/provider";
import { quoteIdentifier } from "@/lib/duckdb/sql-helpers";
import { asNumber, formatNumber, formatPercent } from "@/lib/format";
import { formatValueWithLabel, getColumnDisplayName, getColumnTooltip } from "@/lib/format-labels";
import relationshipData from "@/lib/schema/relationships.generated.json";
import schemaMetadata from "@/lib/schema/columns.generated.json";
import { getValueLabels } from "@/lib/schema/value-labels";

export const Route = createFileRoute("/relationships")({
  validateSearch: (search): { column?: string } => ({
    column: typeof search.column === "string" ? search.column : undefined,
  }),
  component: RelationshipsPage,
});

interface ColumnSummary {
  name: string;
  displayName?: string;
  logicalType?: string;
  tags?: string[];
  nullRatio?: number;
  valueLabels?: Record<string, string>;
  approxTopValues?: string[];
}

interface SchemaMetadata {
  dataset?: {
    rowCount?: number;
    generatedAt?: string;
  };
  columns: ColumnSummary[];
}

interface TopPatternValues {
  sourceVal: string;
  targetVal: string;
  sourceColumn: string;
  targetColumn: string;
  lift: number;
}

interface Relationship {
  column: string;
  metric: "cramers_v" | "correlation";
  value: number;
  n: number;
  direction?: "positive" | "negative";
  topPattern?: string;
  topPatternValues?: TopPatternValues;
}

interface RelationshipCluster {
  id: string;
  label: string;
  members: string[];
  bridgesTo: string[];
}

interface RelationshipPayload {
  generatedAt: string;
  columnCount: number;
  pairCount: number;
  clusters?: RelationshipCluster[];
  clusterByColumn?: Record<string, string>;
  relationships: Record<string, Relationship[]>;
}

interface QueryResultLike {
  numRows: number;
  schema: { fields: unknown[] };
  getChildAt(index: number): { get(rowIndex: number): unknown } | null | undefined;
}

function toRows(result: QueryResultLike): unknown[][] {
  const rows: unknown[][] = [];
  for (let i = 0; i < result.numRows; i += 1) {
    const row: unknown[] = [];
    for (let c = 0; c < result.schema.fields.length; c += 1) {
      const value = result.getChildAt(c)?.get(i);
      row.push(typeof value === "bigint" ? Number(value) : value ?? null);
    }
    rows.push(row);
  }
  return rows;
}

function shortText(value: string, max = 34): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function resolveColumnValueLabels(
  column: Pick<ColumnSummary, "name" | "valueLabels"> | undefined,
): Record<string, string> | undefined {
  if (!column) return undefined;
  return column.valueLabels ?? getValueLabels(column.name) ?? undefined;
}

const SHORT_DISPLAY_OVERRIDES: Record<string, string> = {
  '"I can get aroused by a partner doing what I like, even if I know they aren\'t aroused by it themselves" (aw1a1ss)':
    "Aroused despite partner disinterest",
  '"If my partner is aroused by something, I can also be aroused by it, even if I don\'t normally find it erotic" (j5yb5lu)':
    "Aroused by partner arousal",
  "In general, it's most erotic when _____ wears the clothing you find erotic (eowvxbs)":
    "Who wears erotic clothing",
  "My erotic fantasies involving toys typically involve ____ using the toys":
    "Who uses toys",
  '"In general, I prefer scenarios where receiver of the pain is:" (8r5zld8)':
    "Preferred pain recipient",
  '"In general, I prefer scenarios where the intensity of the pain is:" (m73c3q1)':
    "Preferred pain intensity",
  '"In general, on average, the optimal amount of consent in my preferred erotic scenarios is:" (b0ukpvo)':
    "Preferred consent level",
  "Which of the following categories contains things you find erotic?":
    "Most erotic category",
  "Compared to other people of your same gender and age range, you are (yh6d44s)":
    "Self-rated attractiveness",
};

const SHORT_LABEL_STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "do",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "my",
  "of",
  "on",
  "or",
  "the",
  "to",
  "was",
  "were",
  "when",
  "where",
  "which",
  "who",
  "with",
  "you",
  "your",
]);

function shortQuestionDisplay(columnName: string, displayName: string): string {
  const override = SHORT_DISPLAY_OVERRIDES[columnName];
  if (override) return override;

  let short = displayName
    .replace(/^"(.+)"$/, "$1")
    .replace(/\s+\.\.\.$/, "")
    .replace(/\s+/g, " ")
    .trim();

  short = short
    .replace(
      /^How old were you when you first experienced sexual interest in /i,
      "First interest age: ",
    )
    .replace(
      /^How old were you when you first experienced interest in /i,
      "First interest age: ",
    )
    .replace(/^At what age did you first begin \(at least semiregularly\) /i, "Age began ")
    .replace(/^At what age did you begin /i, "Age began ")
    .replace(/^Of these options, which one is the most erotic\?/i, "Most erotic option")
    .replace(/^In scenarios you find erotic, you tend to identify with \(or imagine being\):/i, "Erotic role identity")
    .replace(/^The type of erotic content you prefer tends to be/i, "Erotic content tends to be")
    .replace(/^Have you ever had a sexual experience with someone else who did not want the experience\?/i, "Non-consensual experience history")
    .replace(/^I find the thought of existing \(in \*nonsexual\* situations\) as a biological \*female\* to be erotic/i, "Erotic as biological female")
    .replace(/^I find the thought of existing \(in \*nonsexual\* situations\) as a biological \*male\* to be erotic/i, "Erotic as biological male")
    .replace(/^I find the thought of masturbating alone as a biological female, to be erotic/i, "Erotic as solo biological female")
    .replace(/^I find the thought of masturbating alone as a biological male, to be erotic/i, "Erotic as solo biological male");

  if (short.length <= 42) return short;

  const keywordOnly = short
    .split(/\s+/)
    .filter((word) => !SHORT_LABEL_STOPWORDS.has(word.toLowerCase()))
    .slice(0, 7)
    .join(" ");

  if (keywordOnly.length >= 16) {
    return keywordOnly.length <= 42 ? keywordOnly : `${keywordOnly.slice(0, 41)}…`;
  }

  return `${short.slice(0, 41)}…`;
}

function topValuesSubtitle(column: ColumnSummary | undefined, limit = 3): string | null {
  if (!column?.approxTopValues || column.approxTopValues.length === 0) {
    return null;
  }
  const valueLabels = resolveColumnValueLabels(column);
  return column.approxTopValues
    .slice(0, limit)
    .map((value) => formatValueWithLabel(value, valueLabels))
    .join(" · ");
}

function pickTag(tags: string[] | undefined): NetworkNode["tag"] {
  if (!tags || tags.length === 0) return "other";
  if (tags.includes("fetish")) return "fetish";
  if (tags.includes("demographic")) return "demographic";
  if (tags.includes("ocean")) return "ocean";
  if (tags.includes("derived")) return "derived";
  return "other";
}

type RelationshipNodeType = "question" | "derived_scale" | "aggregate_total";
type RelationshipNetworkScope = "core" | "derived" | "bridges" | "full";

interface NetworkComponentSummary {
  id: string;
  nodeIds: Set<string>;
  size: number;
  edgeCount: number;
}

function isAggregateTotalColumn(name: string, column: ColumnSummary | undefined): boolean {
  const displayName = column?.displayName?.trim() ?? "";
  return name.startsWith("Total") || displayName.startsWith("Total:");
}

function classifyRelationshipNodeType(
  name: string,
  column: ColumnSummary | undefined,
): RelationshipNodeType {
  if (isAggregateTotalColumn(name, column)) {
    return "aggregate_total";
  }

  const tags = column?.tags ?? [];
  if (tags.includes("derived") || tags.includes("ocean")) {
    return "derived_scale";
  }
  return "question";
}

function edgeMatchesScope(
  sourceId: string,
  targetId: string,
  scope: RelationshipNetworkScope,
  nodeTypeById: Map<string, RelationshipNodeType>,
): boolean {
  const sourceType = nodeTypeById.get(sourceId) ?? "question";
  const targetType = nodeTypeById.get(targetId) ?? "question";

  if (scope === "full") return true;
  if (scope === "core") {
    return sourceType === "question" && targetType === "question";
  }
  if (scope === "derived") {
    return sourceType !== "question" && targetType !== "question";
  }
  return (sourceType === "question") !== (targetType === "question");
}

function computeNetworkComponents(
  nodeIds: Set<string>,
  edges: NetworkEdge[],
): NetworkComponentSummary[] {
  if (nodeIds.size === 0) return [];

  const adjacency = new Map<string, Set<string>>();
  for (const nodeId of nodeIds) {
    adjacency.set(nodeId, new Set());
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  }

  const visited = new Set<string>();
  const components: Array<{ nodeIds: Set<string>; edgeCount: number }> = [];

  for (const start of nodeIds) {
    if (visited.has(start)) continue;

    const queue = [start];
    const members = new Set<string>([start]);
    visited.add(start);

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index]!;
      for (const neighbor of adjacency.get(current) ?? []) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        members.add(neighbor);
        queue.push(neighbor);
      }
    }

    let edgeCount = 0;
    for (const member of members) {
      edgeCount += [...(adjacency.get(member) ?? [])].filter((neighbor) =>
        members.has(neighbor)
      ).length;
    }

    components.push({ nodeIds: members, edgeCount: edgeCount / 2 });
  }

  const ordered = components.sort((left, right) => {
    if (right.nodeIds.size !== left.nodeIds.size) {
      return right.nodeIds.size - left.nodeIds.size;
    }
    return right.edgeCount - left.edgeCount;
  });

  return ordered.map((component, index) => ({
    id: `component-${index + 1}`,
    nodeIds: component.nodeIds,
    size: component.nodeIds.size,
    edgeCount: component.edgeCount,
  }));
}

function strengthDetail(value: number): { label: string; detail: string } {
  if (value < 0.1) {
    return { label: "Very weak", detail: "likely noisy and subtle" };
  }
  if (value < 0.2) {
    return { label: "Weak", detail: "detectable but limited" };
  }
  if (value < 0.35) {
    return { label: "Moderate", detail: "a clear pattern" };
  }
  return { label: "Strong", detail: "one of the tighter links here" };
}

function metricLabel(metric: Relationship["metric"], direction?: Relationship["direction"]): string {
  if (metric === "correlation") {
    if (direction === "negative") return "Correlation (inverse)";
    return "Correlation";
  }
  return "Association";
}

function fallbackPattern(
  sourceLabel: string,
  targetLabel: string,
  relationship: Relationship,
): string {
  if (relationship.metric === "correlation") {
    const direction = relationship.direction === "negative" ? "opposite directions" : "together";
    return `${sourceLabel} and ${targetLabel} tend to move ${direction}.`;
  }
  return `${sourceLabel} and ${targetLabel} show a ${strengthDetail(relationship.value).label.toLowerCase()} association.`;
}

function resolveTopPattern(
  relationship: Relationship,
  columnByName: Map<string, ColumnSummary>,
): string | undefined {
  const vals = relationship.topPatternValues;
  if (!vals) return relationship.topPattern;

  const sourceCol = columnByName.get(vals.sourceColumn);
  const targetCol = columnByName.get(vals.targetColumn);
  const sourceLabels = resolveColumnValueLabels(sourceCol);
  const targetLabels = resolveColumnValueLabels(targetCol);
  const sourceLabel = formatValueWithLabel(vals.sourceVal, sourceLabels);
  const targetLabel = formatValueWithLabel(vals.targetVal, targetLabels);

  return `People who chose ${sourceLabel} were ${vals.lift}x more likely to also choose ${targetLabel}.`;
}

function rankBuckets(totals: Map<string, number>): string[] {
  return [...totals.entries()]
    .sort((left, right) => {
      if (left[0] === "Other") return 1;
      if (right[0] === "Other") return -1;
      return right[1] - left[1];
    })
    .slice(0, 5)
    .map(([bucket]) => bucket);
}

interface RelationshipMiniHeatmapProps {
  db: AsyncDuckDB | null;
  xColumn: ColumnSummary;
  yColumn: ColumnSummary;
}

function RelationshipMiniHeatmap({ db, xColumn, yColumn }: RelationshipMiniHeatmapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [xLabels, setXLabels] = useState<string[]>([]);
  const [yLabels, setYLabels] = useState<string[]>([]);
  const [cells, setCells] = useState<MiniHeatmapCell[]>([]);
  const xValueLabels = resolveColumnValueLabels(xColumn);
  const yValueLabels = resolveColumnValueLabels(yColumn);

  useEffect(() => {
    if (shouldLoad) return;

    const node = containerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || !db) return;

    let cancelled = false;
    const run = async () => {
      setStatus("loading");

      const xQuoted = quoteIdentifier(xColumn.name);
      const yQuoted = quoteIdentifier(yColumn.name);

      const sql = `
        WITH base AS (
          SELECT
            cast(${xQuoted} AS VARCHAR) AS x_val,
            cast(${yQuoted} AS VARCHAR) AS y_val
          FROM data
          WHERE ${xQuoted} IS NOT NULL AND ${yQuoted} IS NOT NULL
        ),
        x_top AS (
          SELECT x_val
          FROM base
          GROUP BY 1
          ORDER BY count(*) DESC
          LIMIT 4
        ),
        y_top AS (
          SELECT y_val
          FROM base
          GROUP BY 1
          ORDER BY count(*) DESC
          LIMIT 4
        ),
        bucketed AS (
          SELECT
            CASE WHEN x_val IN (SELECT x_val FROM x_top) THEN x_val ELSE 'Other' END AS x_bucket,
            CASE WHEN y_val IN (SELECT y_val FROM y_top) THEN y_val ELSE 'Other' END AS y_bucket
          FROM base
        )
        SELECT
          x_bucket,
          y_bucket,
          count(*)::DOUBLE AS cnt
        FROM bucketed
        GROUP BY 1, 2
      `;

      let conn: Awaited<ReturnType<AsyncDuckDB["connect"]>> | null = null;
      try {
        conn = await db.connect();
        const result = await conn.query(sql);
        const rows = toRows(result as QueryResultLike);

        if (rows.length === 0) {
          if (!cancelled) {
            setXLabels([]);
            setYLabels([]);
            setCells([]);
            setStatus("ready");
          }
          return;
        }

        const xTotals = new Map<string, number>();
        const yTotals = new Map<string, number>();
        const matrix = new Map<string, number>();

        for (const row of rows) {
          const xRaw = String(row[0] ?? "Other");
          const yRaw = String(row[1] ?? "Other");
          const count = asNumber(row[2], 0);
          if (!Number.isFinite(count) || count <= 0) continue;

          xTotals.set(xRaw, (xTotals.get(xRaw) ?? 0) + count);
          yTotals.set(yRaw, (yTotals.get(yRaw) ?? 0) + count);
          matrix.set(`${xRaw}\0${yRaw}`, count);
        }

        const xRawOrder = rankBuckets(xTotals);
        const yRawOrder = rankBuckets(yTotals);
        const xIndex = new Map(xRawOrder.map((value, index) => [value, index]));
        const yIndex = new Map(yRawOrder.map((value, index) => [value, index]));

        const nextCells: MiniHeatmapCell[] = [];
        for (const [key, value] of matrix.entries()) {
          const [xRaw, yRaw] = key.split("\0");
          const xCell = xIndex.get(xRaw);
          const yCell = yIndex.get(yRaw);
          if (xCell == null || yCell == null) continue;
          nextCells.push({ xIndex: xCell, yIndex: yCell, value });
        }

        if (!cancelled) {
          setXLabels(
            xRawOrder.map((value) =>
              value === "Other" ? value : formatValueWithLabel(value, xValueLabels),
            ),
          );
          setYLabels(
            yRawOrder.map((value) =>
              value === "Other" ? value : formatValueWithLabel(value, yValueLabels),
            ),
          );
          setCells(nextCells);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      } finally {
        if (conn) {
          await conn.close();
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [db, shouldLoad, xColumn.name, yColumn.name, xValueLabels, yValueLabels]);

  return (
    <div ref={containerRef} className="space-y-1">
      {!db ? (
        <p className="mono-value text-[0.64rem] text-[var(--ink-faded)]">
          Heatmap preview will load once DuckDB is ready.
        </p>
      ) : null}

      {db && (status === "idle" || status === "loading") ? (
        <div className="h-[140px] w-[260px] animate-pulse border border-[var(--rule-light)] bg-[var(--paper-warm)]" />
      ) : null}

      {db && status === "ready" && cells.length > 0 ? (
        <MiniHeatmap xLabels={xLabels} yLabels={yLabels} cells={cells} width={260} height={140} />
      ) : null}

      {db && status === "ready" && cells.length === 0 ? (
        <p className="mono-value text-[0.64rem] text-[var(--ink-faded)]">Not enough paired responses for preview.</p>
      ) : null}

      {db && status === "error" ? (
        <p className="mono-value text-[0.64rem] text-[var(--ink-faded)]">Heatmap preview unavailable.</p>
      ) : null}
    </div>
  );
}

const schema = schemaMetadata as SchemaMetadata;
const relationshipsPayload = relationshipData as RelationshipPayload;
const columns = schema.columns ?? [];
const columnByName = new Map(columns.map((column) => [column.name, column]));

const allRelationshipColumns = (() => {
  const names = new Set<string>();
  for (const [column, rows] of Object.entries(relationshipsPayload.relationships)) {
    names.add(column);
    for (const row of rows) {
      names.add(row.column);
    }
  }
  return [...names];
})();

const DEFAULT_NETWORK_EDGE_MIN = 0.14;
const STRONG_NETWORK_EDGE_MIN = 0.2;
const DEFAULT_NETWORK_SCOPE: RelationshipNetworkScope = "core";

const NETWORK_SCOPE_OPTIONS: Array<{
  id: RelationshipNetworkScope;
  label: string;
  subtitle: string;
}> = [
  {
    id: "core",
    label: "Core questions",
    subtitle: "Question-level map without derived totals/scales.",
  },
  {
    id: "derived",
    label: "Derived + totals",
    subtitle: "Constructed variables and aggregate totals only.",
  },
  {
    id: "bridges",
    label: "Bridge explorer",
    subtitle: "Cross-layer links between questions and derived signals.",
  },
  {
    id: "full",
    label: "Full graph",
    subtitle: "All nodes and all relationship types.",
  },
];

function RelationshipsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/relationships" });
  const { db, phase } = useDuckDB();

  const [selectedColumn, setSelectedColumn] = useState(() =>
    search.column && allRelationshipColumns.includes(search.column) ? search.column : "",
  );
  const [networkEdgeMin, setNetworkEdgeMin] = useState(DEFAULT_NETWORK_EDGE_MIN);
  const [networkViewMode, setNetworkViewMode] = useState<NetworkViewMode>("strong");
  const [networkScope, setNetworkScope] = useState<RelationshipNetworkScope>(
    DEFAULT_NETWORK_SCOPE,
  );
  const [showIsolates, setShowIsolates] = useState(false);
  const [focusedComponentId, setFocusedComponentId] = useState<string | null>(null);

  const handleSelectColumn = useCallback(
    (column: string, action: string) => {
      if (column && column !== selectedColumn) {
        track({
          event: "interaction",
          page: typeof window !== "undefined" ? window.location.pathname : "/relationships",
          action,
          label: column,
        });
      }
      setSelectedColumn(column);
    },
    [selectedColumn],
  );

  useEffect(() => {
    if (search.column && allRelationshipColumns.includes(search.column)) {
      setSelectedColumn(search.column);
      return;
    }
    setSelectedColumn("");
  }, [search.column]);

  useEffect(() => {
    const nextSearchValue = selectedColumn || undefined;
    if (search.column === nextSearchValue) return;
    void navigate({
      search: { column: nextSearchValue },
      replace: true,
      resetScroll: false,
    });
  }, [navigate, search.column, selectedColumn]);

  const columnOptions = useMemo(
    () =>
      [...allRelationshipColumns]
        .map((name) => {
          const column = columnByName.get(name);
          return {
            name,
            displayName: column ? getColumnDisplayName(column) : name,
          };
        })
        .sort((left, right) => left.displayName.localeCompare(right.displayName)),
    [],
  );

  const { nodes, edges } = useMemo(() => {
    const edgeByKey = new Map<string, NetworkEdge>();
    const displayNameCounts = new Map<string, number>();

    for (const name of allRelationshipColumns) {
      const column = columnByName.get(name);
      const display = column ? getColumnDisplayName(column) : name;
      displayNameCounts.set(display, (displayNameCounts.get(display) ?? 0) + 1);
    }

    for (const [source, rows] of Object.entries(relationshipsPayload.relationships)) {
      for (const row of rows) {
        if (source === row.column) continue;
        const a = source < row.column ? source : row.column;
        const b = source < row.column ? row.column : source;
        const key = `${a}::${b}`;
        const next: NetworkEdge = {
          source: a,
          target: b,
          value: row.value,
          metric: row.metric,
          direction: row.direction,
        };
        const existing = edgeByKey.get(key);
        if (!existing || row.value > existing.value) {
          edgeByKey.set(key, next);
        }
      }
    }

    const computedEdges = [...edgeByKey.values()];
    const degreeByNode = new Map<string, number>();
    for (const edge of computedEdges) {
      degreeByNode.set(edge.source, (degreeByNode.get(edge.source) ?? 0) + 1);
      degreeByNode.set(edge.target, (degreeByNode.get(edge.target) ?? 0) + 1);
    }

    const computedNodes: NetworkNode[] = allRelationshipColumns.map((name) => {
      const column = columnByName.get(name);
      const display = column ? getColumnDisplayName(column) : name;
      const shortDisplay = shortQuestionDisplay(name, display);
      const duplicateName = (displayNameCounts.get(display) ?? 0) > 1;
      const subtitle = topValuesSubtitle(column, 2);
      const disambiguator = subtitle?.split(" · ").slice(0, 2).join(" / ");
      const label =
        duplicateName && disambiguator
          ? `${shortText(shortDisplay, 22)} · ${shortText(disambiguator, 16)}`
          : shortText(shortDisplay, 34);

      return {
        id: name,
        label,
        fullLabel: display,
        subtitle: subtitle ?? undefined,
        tag: pickTag(column?.tags),
        degree: degreeByNode.get(name) ?? 0,
        clusterId: relationshipsPayload.clusterByColumn?.[name],
      };
    });

    return { nodes: computedNodes, edges: computedEdges };
  }, []);

  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const nodeTypeById = useMemo(
    () =>
      new Map(
        nodes.map((node) => [
          node.id,
          classifyRelationshipNodeType(node.id, columnByName.get(node.id)),
        ]),
      ),
    [nodes],
  );

  const allNodeIds = useMemo(() => new Set(nodes.map((node) => node.id)), [nodes]);

  const scopedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const node of nodes) {
      const nodeType = nodeTypeById.get(node.id) ?? "question";
      if (networkScope === "core" && nodeType !== "question") continue;
      if (networkScope === "derived" && nodeType === "question") continue;
      ids.add(node.id);
    }
    return ids;
  }, [nodes, nodeTypeById, networkScope]);

  useEffect(() => {
    if (selectedColumn && !scopedNodeIds.has(selectedColumn)) {
      setSelectedColumn("");
    }
  }, [selectedColumn, scopedNodeIds]);

  const scopedSelectedId = selectedColumn && scopedNodeIds.has(selectedColumn)
    ? selectedColumn
    : null;

  useEffect(() => {
    if (!scopedSelectedId && networkViewMode === "focused") {
      setNetworkViewMode("strong");
    }
  }, [scopedSelectedId, networkViewMode]);

  const scopedEdges = useMemo(
    () =>
      edges.filter((edge) =>
        edgeMatchesScope(edge.source, edge.target, networkScope, nodeTypeById)
      ),
    [edges, networkScope, nodeTypeById],
  );

  const effectiveEdgeCutoff = useMemo(
    () =>
      getEffectiveNetworkEdgeCutoff({
        edgeMinValue: networkEdgeMin,
        viewMode: networkViewMode,
        strongEdgeValue: STRONG_NETWORK_EDGE_MIN,
      }),
    [networkEdgeMin, networkViewMode],
  );

  const filteredScopeEdges = useMemo(
    () =>
      filterNetworkEdges({
        edges: scopedEdges,
        selectedId: scopedSelectedId,
        edgeMinValue: networkEdgeMin,
        viewMode: networkViewMode,
        strongEdgeValue: STRONG_NETWORK_EDGE_MIN,
      }),
    [networkEdgeMin, networkViewMode, scopedEdges, scopedSelectedId],
  );

  const connectedScopeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const edge of filteredScopeEdges) {
      ids.add(edge.source);
      ids.add(edge.target);
    }
    if (scopedSelectedId) {
      ids.add(scopedSelectedId);
    }
    return ids;
  }, [filteredScopeEdges, scopedSelectedId]);

  const isolatedScopedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const nodeId of scopedNodeIds) {
      if (!connectedScopeNodeIds.has(nodeId)) {
        ids.add(nodeId);
      }
    }
    return ids;
  }, [scopedNodeIds, connectedScopeNodeIds]);

  const preComponentNodeIds = useMemo(() => {
    const ids = showIsolates
      ? new Set(scopedNodeIds)
      : new Set(connectedScopeNodeIds);
    if (scopedSelectedId) {
      ids.add(scopedSelectedId);
    }
    return ids;
  }, [showIsolates, scopedNodeIds, connectedScopeNodeIds, scopedSelectedId]);

  const preComponentEdges = useMemo(
    () =>
      filteredScopeEdges.filter(
        (edge) => preComponentNodeIds.has(edge.source) && preComponentNodeIds.has(edge.target),
      ),
    [filteredScopeEdges, preComponentNodeIds],
  );

  const networkComponents = useMemo(
    () => computeNetworkComponents(preComponentNodeIds, preComponentEdges),
    [preComponentNodeIds, preComponentEdges],
  );

  const componentById = useMemo(
    () => new Map(networkComponents.map((component) => [component.id, component])),
    [networkComponents],
  );

  useEffect(() => {
    if (!focusedComponentId) return;
    const focusedComponent = componentById.get(focusedComponentId);
    if (!focusedComponent) {
      setFocusedComponentId(null);
      return;
    }

    if (scopedSelectedId && !focusedComponent.nodeIds.has(scopedSelectedId)) {
      setFocusedComponentId(null);
    }
  }, [focusedComponentId, componentById, scopedSelectedId]);

  const activeComponent = focusedComponentId
    ? componentById.get(focusedComponentId)
    : undefined;

  const visibleNetworkNodeIds = useMemo(() => {
    if (!activeComponent) return preComponentNodeIds;
    return new Set(activeComponent.nodeIds);
  }, [activeComponent, preComponentNodeIds]);

  const visibleNetworkEdges = useMemo(
    () =>
      preComponentEdges.filter(
        (edge) => visibleNetworkNodeIds.has(edge.source) && visibleNetworkNodeIds.has(edge.target),
      ),
    [preComponentEdges, visibleNetworkNodeIds],
  );

  const visibleNetworkNodeCount = visibleNetworkNodeIds.size;
  const hiddenByScopeCount = Math.max(0, allNodeIds.size - scopedNodeIds.size);
  const hiddenWithinScopeCount = Math.max(0, scopedNodeIds.size - visibleNetworkNodeCount);
  const hiddenNodeCount = Math.max(0, allNodeIds.size - visibleNetworkNodeCount);
  const hiddenOutsideFocusedComponentCount = focusedComponentId
    ? Math.max(0, preComponentNodeIds.size - visibleNetworkNodeCount)
    : 0;
  const hiddenByFiltersCount = Math.max(
    0,
    hiddenWithinScopeCount - hiddenOutsideFocusedComponentCount,
  );
  const isolatedScopeNodeCount = isolatedScopedNodeIds.size;

  const graphNodes = useMemo(
    () => nodes.filter((node) => visibleNetworkNodeIds.has(node.id)),
    [nodes, visibleNetworkNodeIds],
  );

  const clusterLabelsById = useMemo(
    () =>
      Object.fromEntries(
        (relationshipsPayload.clusters ?? []).map((cluster) => [cluster.id, cluster.label]),
      ),
    [],
  );

  const scopedColumnOptions = useMemo(
    () => columnOptions.filter((option) => scopedNodeIds.has(option.name)),
    [columnOptions, scopedNodeIds],
  );

  const componentChipData = useMemo(() => {
    const MAX_COMPONENT_CHIPS = 12;
    const chips = networkComponents.slice(0, MAX_COMPONENT_CHIPS).map((component, index) => {
      const alphaIndex = index % 26;
      const alphaLabel = String.fromCharCode(65 + alphaIndex);
      const cycle = index >= 26 ? Math.floor(index / 26) + 1 : null;
      const componentLabel = cycle ? `${alphaLabel}${cycle}` : alphaLabel;
      return {
        id: component.id,
        label: `Component ${componentLabel}`,
        size: component.size,
      };
    });

    return {
      chips,
      hiddenCount: Math.max(0, networkComponents.length - chips.length),
    };
  }, [networkComponents]);

  const mobileClusterSummaries = useMemo(() => {
    const clusters = relationshipsPayload.clusters ?? [];
    const shouldFilterToVisible = visibleNetworkNodeIds.size > 0;

    return clusters
      .map((cluster) => {
        const members = cluster.members
          .filter((member) => !shouldFilterToVisible || visibleNetworkNodeIds.has(member))
          .map((member) => {
            const node = nodeById.get(member);
            const metadata = columnByName.get(member) ?? { name: member };
            const display = getColumnDisplayName(metadata);
            return {
              id: member,
              label: shortQuestionDisplay(member, display),
              degree: node?.degree ?? 0,
            };
          })
          .sort((left, right) => right.degree - left.degree)
          .slice(0, 6);

        if (members.length === 0) {
          return null;
        }

        return {
          id: cluster.id,
          label: cluster.label,
          memberCount: cluster.members.length,
          visibleMemberCount: members.length,
          members,
        };
      })
      .filter(
        (
          cluster,
        ): cluster is {
          id: string;
          label: string;
          memberCount: number;
          visibleMemberCount: number;
          members: Array<{ id: string; label: string; degree: number }>;
        } => cluster !== null,
      )
      .sort((left, right) => right.visibleMemberCount - left.visibleMemberCount);
  }, [nodeById, visibleNetworkNodeIds]);

  const mobileFallbackNodes = useMemo(() => {
    const candidateNodes =
      visibleNetworkNodeIds.size > 0
        ? nodes.filter((node) => visibleNetworkNodeIds.has(node.id))
        : nodes;

    return [...candidateNodes]
      .sort((left, right) => (right.degree ?? 0) - (left.degree ?? 0))
      .slice(0, 14)
      .map((node) => ({
        id: node.id,
        label: node.fullLabel ? shortQuestionDisplay(node.id, node.fullLabel) : node.label,
      }));
  }, [nodes, visibleNetworkNodeIds]);

  const selectedColumnMeta = scopedSelectedId ? columnByName.get(scopedSelectedId) : undefined;
  const selectedDisplayName = selectedColumnMeta
    ? getColumnTooltip(selectedColumnMeta)
    : (scopedSelectedId ?? "");

  const selectedRelationships = useMemo(() => {
    if (!scopedSelectedId) return [];

    return (relationshipsPayload.relationships[scopedSelectedId] ?? []).filter((relationship) =>
      relationship.value >= effectiveEdgeCutoff &&
      edgeMatchesScope(scopedSelectedId, relationship.column, networkScope, nodeTypeById)
    );
  }, [scopedSelectedId, effectiveEdgeCutoff, networkScope, nodeTypeById]);

  const maxRelationshipValue = useMemo(
    () =>
      selectedRelationships.length > 0
        ? Math.max(...selectedRelationships.map((row) => row.value))
        : 1,
    [selectedRelationships],
  );

  const clusterById = useMemo(
    () =>
      new Map((relationshipsPayload.clusters ?? []).map((cluster) => [cluster.id, cluster])),
    [],
  );

  const selectedClusterId = scopedSelectedId
    ? relationshipsPayload.clusterByColumn?.[scopedSelectedId]
    : undefined;
  const selectedCluster = selectedClusterId ? clusterById.get(selectedClusterId) : undefined;
  const bridgeClusters =
    selectedCluster?.bridgesTo
      .map((clusterId) => clusterById.get(clusterId))
      .filter(Boolean) ?? [];

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Relationship Atlas</h1>
        <p className="page-subtitle">
          Explore one lens at a time. Defaults prioritize interpretable question-level structure, with derived and bridge views available when needed.
        </p>
        <p className="dateline">
          {formatNumber(relationshipsPayload.columnCount)} questions &middot;{" "}
          {formatNumber(relationshipsPayload.pairCount)} links &middot;{" "}
          {formatNumber(relationshipsPayload.clusters?.length ?? 0)} clusters
        </p>
      </header>

      <section className="raised-panel space-y-4">
        <SectionHeader
          number="01"
          title="Atlas network lens"
          subtitle="Choose a scope, then tune link strength. Hidden nodes are removed from rendering (not ghosted)."
        />

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <label className="editorial-label">
            Focus question
            <ColumnCombobox
              columns={scopedColumnOptions}
              value={scopedSelectedId ?? ""}
              onValueChange={(value) => handleSelectColumn(value, "select_relationship_column")}
              includeNoneOption
              noneOptionLabel="Scope overview"
              placeholder="Search for a question in this scope"
            />
          </label>

          {scopedSelectedId ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleSelectColumn("", "clear_relationship_column")}
              className="w-full md:w-auto"
            >
              Clear selection
            </Button>
          ) : null}
        </div>

        <div className="space-y-3 border border-[var(--rule)] bg-[var(--paper-warm)] p-3">
          <div>
            <p className="mono-label">scope</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {NETWORK_SCOPE_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={networkScope === option.id ? "accent" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setNetworkScope(option.id);
                    setFocusedComponentId(null);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            <p className="mono-value mt-1 text-[0.66rem] text-[var(--ink-faded)]">
              {NETWORK_SCOPE_OPTIONS.find((option) => option.id === networkScope)?.subtitle}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-end">
            <div>
              <p className="mono-label">network view</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant={networkViewMode === "all" ? "accent" : "ghost"}
                  size="sm"
                  onClick={() => setNetworkViewMode("all")}
                >
                  All links
                </Button>
                <Button
                  type="button"
                  variant={networkViewMode === "strong" ? "accent" : "ghost"}
                  size="sm"
                  onClick={() => setNetworkViewMode("strong")}
                >
                  Strong links
                </Button>
                <Button
                  type="button"
                  variant={networkViewMode === "focused" ? "accent" : "ghost"}
                  size="sm"
                  onClick={() => setNetworkViewMode("focused")}
                  disabled={!scopedSelectedId}
                >
                  Selected + 1 hop
                </Button>
              </div>
            </div>

            <label className="editorial-label">
              Minimum link strength: {formatPercent(networkEdgeMin * 100, 0)}
              <input
                type="range"
                min={0.05}
                max={0.35}
                step={0.01}
                value={networkEdgeMin}
                onChange={(event) => {
                  setNetworkEdgeMin(Number(event.target.value));
                  setFocusedComponentId(null);
                }}
                className="mt-1 w-full accent-[var(--accent)]"
              />
              <p className="mono-value mt-1 text-[0.66rem] text-[var(--ink-faded)]">
                Effective cutoff: {formatPercent(effectiveEdgeCutoff * 100, 0)}
                {networkViewMode === "strong"
                  ? ` (strong floor ${formatPercent(STRONG_NETWORK_EDGE_MIN * 100, 0)})`
                  : ""}
              </p>
              <p className="mono-value mt-1 text-[0.66rem] text-[var(--ink-faded)]">
                Showing {formatNumber(visibleNetworkEdges.length)} links across{" "}
                {formatNumber(visibleNetworkNodeCount)} nodes
                {hiddenNodeCount > 0
                  ? ` · ${formatNumber(hiddenNodeCount)} hidden by scope/filters${focusedComponentId ? "/component focus" : ""}`
                  : ""}.
              </p>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={showIsolates ? "accent" : "ghost"}
              size="sm"
              onClick={() => {
                setShowIsolates((current) => !current);
                setFocusedComponentId(null);
              }}
            >
              {showIsolates ? "Hide isolates" : "Show isolates"}
            </Button>
            <p className="mono-value text-[0.64rem] text-[var(--ink-faded)]">
              {formatNumber(isolatedScopeNodeCount)} isolated nodes in this scope
              {showIsolates
                ? " are currently rendered."
                : " are hidden by default for clarity."}
            </p>
          </div>

          {componentChipData.chips.length > 1 ? (
            <div className="space-y-1">
              <p className="mono-label">connected components</p>
              <div className="flex flex-wrap gap-1.5">
                {componentChipData.chips.map((component) => {
                  const isActive = focusedComponentId === component.id;
                  return (
                    <button
                      key={component.id}
                      type="button"
                      className="null-badge"
                      onClick={() => {
                        setFocusedComponentId((current) =>
                          current === component.id ? null : component.id,
                        );
                      }}
                      style={
                        isActive
                          ? {
                              borderColor: "var(--accent)",
                              color: "var(--accent)",
                            }
                          : undefined
                      }
                    >
                      {component.label} · {formatNumber(component.size)}
                    </button>
                  );
                })}
              </div>
              <p className="mono-value text-[0.64rem] text-[var(--ink-faded)]">
                Click a component chip to focus it. {focusedComponentId && hiddenOutsideFocusedComponentCount > 0
                  ? `${formatNumber(hiddenOutsideFocusedComponentCount)} nodes are hidden outside the focused component.`
                  : hiddenByFiltersCount > 0
                    ? `${formatNumber(hiddenByFiltersCount)} scoped nodes are hidden by threshold/isolate filters.`
                    : "All scoped nodes are visible."}
                {componentChipData.hiddenCount > 0
                  ? ` ${formatNumber(componentChipData.hiddenCount)} smaller components are omitted from chips.`
                  : ""}
              </p>
            </div>
          ) : null}
        </div>

        <div className="hidden sm:block">
          {/* Graph receives pre-filtered nodes/edges from atlas scope + threshold logic above. */}
          <NetworkGraph
            nodes={graphNodes}
            edges={visibleNetworkEdges}
            selectedId={scopedSelectedId}
            onSelect={(value) => handleSelectColumn(value, "select_network_node")}
            onClearSelection={() => handleSelectColumn("", "clear_network_selection")}
            compact={Boolean(scopedSelectedId)}
            edgeMinValue={0}
            viewMode="all"
            strongEdgeValue={0}
            clusterLabelsById={clusterLabelsById}
            showIsolates={showIsolates}
          />
        </div>

        <div className="space-y-2 sm:hidden">
          <div className="border border-[var(--rule)] bg-[var(--paper)] p-2">
            <p className="mono-label">mobile network view</p>
            <p className="mono-value text-[0.68rem] text-[var(--ink-faded)]">
              Cluster-first list for small screens. Pick any question to open relationship cards below.
            </p>
          </div>

          {mobileClusterSummaries.length > 0 ? (
            <div className="grid gap-2">
              {mobileClusterSummaries.map((cluster) => (
                <article
                  key={cluster.id}
                  className="space-y-2 border border-[var(--rule)] bg-[var(--paper)] p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-['Source_Serif_4',Georgia,serif] text-[0.82rem] text-[var(--ink)]">
                      {cluster.label}
                    </p>
                    <span className="mono-value text-[0.62rem] text-[var(--ink-faded)]">
                      {formatNumber(cluster.visibleMemberCount)}
                      {cluster.visibleMemberCount !== cluster.memberCount
                        ? ` / ${formatNumber(cluster.memberCount)}`
                        : ""}{" "}
                      nodes
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {cluster.members.map((member) => {
                      const isActive = member.id === scopedSelectedId;
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() =>
                            handleSelectColumn(member.id, "select_mobile_cluster_member")
                          }
                          className="null-badge"
                          style={
                            isActive
                              ? {
                                  borderColor: "var(--accent)",
                                  color: "var(--accent)",
                                }
                              : undefined
                          }
                        >
                          {shortText(member.label, 26)}
                        </button>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-[var(--rule)] bg-[var(--paper)] p-2">
              <p className="mono-label">top connected questions</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {mobileFallbackNodes.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => handleSelectColumn(node.id, "select_mobile_top_node")}
                    className="null-badge"
                  >
                    {shortText(node.label, 26)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-4">
          <div className="border border-[var(--rule)] bg-[var(--paper)] p-2">
            <p className="mono-label">scope nodes</p>
            <p className="mono-value text-[0.86rem] text-[var(--ink)]">
              {formatNumber(visibleNetworkNodeCount)} / {formatNumber(scopedNodeIds.size)}
            </p>
          </div>
          <div className="border border-[var(--rule)] bg-[var(--paper)] p-2">
            <p className="mono-label">hidden by scope</p>
            <p className="mono-value text-[0.86rem] text-[var(--ink)]">
              {formatNumber(hiddenByScopeCount)}
            </p>
          </div>
          <div className="border border-[var(--rule)] bg-[var(--paper)] p-2">
            <p className="mono-label">visible edges</p>
            <p className="mono-value text-[0.86rem] text-[var(--ink)]">
              {formatNumber(visibleNetworkEdges.length)} / {formatNumber(scopedEdges.length)}
            </p>
          </div>
          <div className="border border-[var(--rule)] bg-[var(--paper)] p-2">
            <p className="mono-label">duckdb phase</p>
            <p className="mono-value text-[0.86rem] text-[var(--ink)]">{phase}</p>
          </div>
        </div>
      </section>

      {scopedSelectedId ? (
        <section className="raised-panel space-y-4">
          <SectionHeader number="02" title="Selected question detail" />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
            <QuestionIdentityCard
              column={selectedColumnMeta ?? { name: scopedSelectedId }}
              datasetRowCount={schema.dataset?.rowCount}
              valueLabels={resolveColumnValueLabels(selectedColumnMeta)}
            />

            <aside className="space-y-3 border border-[var(--rule)] bg-[var(--paper)] p-3">
              <div>
                <p className="mono-label">cluster</p>
                <p className="font-['Source_Serif_4',Georgia,serif] text-[0.92rem] text-[var(--ink)]">
                  {selectedCluster?.label ?? "Unclustered"}
                </p>
              </div>

              {selectedCluster ? (
                <>
                  <div>
                    <p className="mono-label">members</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selectedCluster.members.slice(0, 14).map((member) => {
                        const memberMeta = columnByName.get(member) ?? { name: member };
                        const isActive = member === scopedSelectedId;
                        return (
                          <button
                            key={member}
                            type="button"
                            onClick={() => handleSelectColumn(member, "select_cluster_member")}
                            className="null-badge"
                            style={
                              isActive
                                ? {
                                    borderColor: "var(--accent)",
                                    color: "var(--accent)",
                                  }
                                : undefined
                            }
                          >
                            {shortText(
                              shortQuestionDisplay(member, getColumnDisplayName(memberMeta)),
                              28,
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {bridgeClusters.length > 0 ? (
                    <div>
                      <p className="mono-label">bridges to</p>
                      <p className="mono-value text-[0.7rem] text-[var(--ink-faded)]">
                        {bridgeClusters.map((cluster) => cluster?.label ?? "").join(" · ")}
                      </p>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="mono-value text-[0.7rem] text-[var(--ink-faded)]">
                  Cluster metadata unavailable. Run the relationship precompute step to populate cluster labels.
                </p>
              )}
            </aside>
          </div>
        </section>
      ) : null}

      <section className="editorial-panel space-y-4">
        <SectionHeader
          number="03"
          title="Relationship cards"
          subtitle={
            scopedSelectedId
              ? `${selectedRelationships.length} strongest links for "${selectedDisplayName}"`
              : "Select a node to open relationship cards with mini heatmaps."
          }
        />

        {scopedSelectedId ? (
          selectedRelationships.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {selectedRelationships.map((relationship) => {
                const relatedColumn = columnByName.get(relationship.column) ?? { name: relationship.column };
                const relatedLabel = getColumnTooltip(relatedColumn);
                const subtitle = topValuesSubtitle(relatedColumn, 3);
                const detail = strengthDetail(relationship.value);
                const width =
                  maxRelationshipValue > 0
                    ? (relationship.value / maxRelationshipValue) * 100
                    : 0;
                const pattern =
                  resolveTopPattern(relationship, columnByName) ??
                  fallbackPattern(selectedDisplayName, relatedLabel, relationship);

                return (
                  <article
                    key={relationship.column}
                    className="space-y-2 border border-[var(--rule)] bg-[var(--paper)] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <ColumnNameTooltip column={relatedColumn}>
                          <Link
                            to="/explore/crosstab"
                            search={{ x: scopedSelectedId, y: relationship.column }}
                            className="block font-['Source_Serif_4',Georgia,serif] text-[0.9rem] leading-snug text-[var(--accent)]"
                          >
                            {relatedLabel}
                          </Link>
                        </ColumnNameTooltip>
                        {subtitle ? (
                          <p className="mono-value mt-1 text-[0.64rem] text-[var(--ink-faded)]">
                            {subtitle}
                          </p>
                        ) : null}
                      </div>

                      <span className="null-badge">{detail.label}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="mono-value text-[0.66rem] text-[var(--ink-faded)]">
                        {metricLabel(relationship.metric, relationship.direction)}
                      </p>
                      <p className="mono-value text-[0.66rem] text-[var(--ink-faded)]">
                        {formatPercent(relationship.value * 100, 1)} · n={formatNumber(relationship.n)}
                      </p>
                    </div>

                    <div className="h-2 w-full bg-[var(--rule-light)]">
                      <span
                        className="block h-full bg-[var(--accent)]"
                        style={{ width: `${Math.max(3, width)}%`, opacity: 0.85 }}
                      />
                    </div>

                    <RelationshipMiniHeatmap
                      db={db}
                      xColumn={selectedColumnMeta ?? { name: scopedSelectedId }}
                      yColumn={relatedColumn}
                    />

                    <p className="section-subtitle text-[0.73rem]">{pattern}</p>

                    <div className="flex justify-end pt-1">
                      <Button asChild variant="accent" size="sm">
                        <Link
                          to="/explore/crosstab"
                          search={{ x: scopedSelectedId, y: relationship.column }}
                        >
                          Open in Explore
                        </Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="section-subtitle">
              {networkScope === "bridges"
                ? "No cross-layer links for this selection at the current threshold."
                : "No relationships found for this question in the current scope + threshold."}
            </p>
          )
        ) : (
          <p className="section-subtitle">
            The map is currently in overview mode. Pick a question to open detailed cards and heatmaps.
          </p>
        )}
      </section>
    </div>
  );
}
