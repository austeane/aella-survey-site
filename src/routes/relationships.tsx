import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { ColumnCombobox } from "@/components/column-combobox";
import { ColumnNameTooltip } from "@/components/column-name-tooltip";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { MiniHeatmap, type MiniHeatmapCell } from "@/components/charts/mini-heatmap";
import { NetworkGraph, type NetworkEdge, type NetworkNode } from "@/components/charts/network-graph";
import { QuestionIdentityCard } from "@/components/question-identity-card";
import { useDuckDB } from "@/lib/duckdb/provider";
import { quoteIdentifier } from "@/lib/duckdb/sql-helpers";
import { asNumber, formatNumber, formatPercent } from "@/lib/format";
import { formatValueWithLabel, getColumnDisplayName } from "@/lib/format-labels";
import relationshipData from "@/lib/schema/relationships.generated.json";
import schemaMetadata from "@/lib/schema/columns.generated.json";

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

interface Relationship {
  column: string;
  metric: "cramers_v" | "correlation";
  value: number;
  n: number;
  direction?: "positive" | "negative";
  topPattern?: string;
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

function topValuesSubtitle(column: ColumnSummary | undefined, limit = 3): string | null {
  if (!column?.approxTopValues || column.approxTopValues.length === 0) {
    return null;
  }
  return column.approxTopValues
    .slice(0, limit)
    .map((value) => formatValueWithLabel(value, column.valueLabels))
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
              value === "Other" ? value : formatValueWithLabel(value, xColumn.valueLabels),
            ),
          );
          setYLabels(
            yRawOrder.map((value) =>
              value === "Other" ? value : formatValueWithLabel(value, yColumn.valueLabels),
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
  }, [db, shouldLoad, xColumn.name, xColumn.valueLabels, yColumn.name, yColumn.valueLabels]);

  return (
    <div ref={containerRef} className="space-y-1">
      {!db ? (
        <p className="mono-value text-[0.64rem] text-[var(--ink-faded)]">
          Heatmap preview will load once DuckDB is ready.
        </p>
      ) : null}

      {db && (status === "idle" || status === "loading") ? (
        <div className="h-[130px] w-[190px] animate-pulse border border-[var(--rule-light)] bg-[var(--paper-warm)]" />
      ) : null}

      {db && status === "ready" && cells.length > 0 ? (
        <MiniHeatmap xLabels={xLabels} yLabels={yLabels} cells={cells} width={190} height={130} />
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

function RelationshipsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/relationships" });
  const { db, phase } = useDuckDB();

  const [selectedColumn, setSelectedColumn] = useState(() =>
    search.column && allRelationshipColumns.includes(search.column) ? search.column : "",
  );
  const [expandedRelationship, setExpandedRelationship] = useState<string | null>(null);

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
    });
  }, [navigate, search.column, selectedColumn]);

  useEffect(() => {
    setExpandedRelationship(null);
  }, [selectedColumn]);

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
      const duplicateName = (displayNameCounts.get(display) ?? 0) > 1;
      const subtitle = topValuesSubtitle(column, 2);
      const disambiguator = subtitle?.split(" · ").slice(0, 2).join(" / ");
      const label =
        duplicateName && disambiguator
          ? `${shortText(display, 22)} · ${shortText(disambiguator, 16)}`
          : shortText(display, 34);

      return {
        id: name,
        label,
        subtitle: subtitle ?? undefined,
        tag: pickTag(column?.tags),
        degree: degreeByNode.get(name) ?? 0,
        clusterId: relationshipsPayload.clusterByColumn?.[name],
      };
    });

    return { nodes: computedNodes, edges: computedEdges };
  }, []);

  const selectedColumnMeta = selectedColumn ? columnByName.get(selectedColumn) : undefined;
  const selectedDisplayName = selectedColumnMeta
    ? getColumnDisplayName(selectedColumnMeta)
    : selectedColumn;

  const selectedRelationships = useMemo(
    () => (selectedColumn ? relationshipsPayload.relationships[selectedColumn] ?? [] : []),
    [selectedColumn],
  );

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

  const selectedClusterId = selectedColumn
    ? relationshipsPayload.clusterByColumn?.[selectedColumn]
    : undefined;
  const selectedCluster = selectedClusterId ? clusterById.get(selectedClusterId) : undefined;
  const bridgeClusters =
    selectedCluster?.bridgesTo
      .map((clusterId) => clusterById.get(clusterId))
      .filter(Boolean) ?? [];

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Relationship Galaxy</h1>
        <p className="page-subtitle">
          Explore how questions connect: start with the map, then zoom into one question and inspect relationship cards.
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
          title="Network galaxy"
          subtitle="Click a node in the graph or pick a question by name."
        />

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <label className="editorial-label">
            Focus question
            <ColumnCombobox
              columns={columnOptions}
              value={selectedColumn}
              onValueChange={setSelectedColumn}
              includeNoneOption
              noneOptionLabel="Network overview"
              placeholder="Search for a question"
            />
          </label>

          {selectedColumn ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedColumn("")}
              className="w-full md:w-auto"
            >
              Clear selection
            </Button>
          ) : null}
        </div>

        <NetworkGraph
          nodes={nodes}
          edges={edges}
          selectedId={selectedColumn || null}
          onSelect={setSelectedColumn}
          compact={Boolean(selectedColumn)}
        />

        <div className="grid gap-2 sm:grid-cols-3">
          <div className="border border-[var(--rule)] bg-[var(--paper)] p-2">
            <p className="mono-label">nodes</p>
            <p className="mono-value text-[0.86rem] text-[var(--ink)]">
              {formatNumber(nodes.length)}
            </p>
          </div>
          <div className="border border-[var(--rule)] bg-[var(--paper)] p-2">
            <p className="mono-label">edges</p>
            <p className="mono-value text-[0.86rem] text-[var(--ink)]">
              {formatNumber(edges.length)}
            </p>
          </div>
          <div className="border border-[var(--rule)] bg-[var(--paper)] p-2">
            <p className="mono-label">duckdb phase</p>
            <p className="mono-value text-[0.86rem] text-[var(--ink)]">{phase}</p>
          </div>
        </div>
      </section>

      {selectedColumn ? (
        <section className="raised-panel space-y-4">
          <SectionHeader number="02" title="Selected question detail" />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
            <QuestionIdentityCard
              column={selectedColumnMeta ?? { name: selectedColumn }}
              datasetRowCount={schema.dataset?.rowCount}
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
                        const isActive = member === selectedColumn;
                        return (
                          <button
                            key={member}
                            type="button"
                            onClick={() => setSelectedColumn(member)}
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
                            {shortText(getColumnDisplayName(memberMeta), 28)}
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
            selectedColumn
              ? `${selectedRelationships.length} strongest links for "${selectedDisplayName}"`
              : "Select a node to open relationship cards with mini heatmaps."
          }
        />

        {selectedColumn ? (
          selectedRelationships.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {selectedRelationships.map((relationship) => {
                const relatedColumn = columnByName.get(relationship.column) ?? { name: relationship.column };
                const relatedLabel = getColumnDisplayName(relatedColumn);
                const subtitle = topValuesSubtitle(relatedColumn, 3);
                const detail = strengthDetail(relationship.value);
                const width =
                  maxRelationshipValue > 0
                    ? (relationship.value / maxRelationshipValue) * 100
                    : 0;
                const isExpanded = expandedRelationship === relationship.column;
                const pattern =
                  relationship.topPattern ??
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
                            search={{ x: selectedColumn, y: relationship.column }}
                            className="block truncate font-['Source_Serif_4',Georgia,serif] text-[0.9rem] text-[var(--accent)]"
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
                      xColumn={selectedColumnMeta ?? { name: selectedColumn }}
                      yColumn={relatedColumn}
                    />

                    <p className="section-subtitle text-[0.73rem]">{pattern}</p>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedRelationship((current) =>
                            current === relationship.column ? null : relationship.column,
                          )
                        }
                      >
                        {isExpanded ? "Hide detail" : "Expand detail"}
                      </Button>

                      <Button asChild variant="accent" size="sm">
                        <Link
                          to="/explore/crosstab"
                          search={{ x: selectedColumn, y: relationship.column }}
                        >
                          Open in Explore
                        </Link>
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="space-y-1 border-t border-[var(--rule-light)] pt-2">
                        <p className="mono-value text-[0.64rem] text-[var(--ink-faded)]">
                          Interpreted as {detail.detail}; compare this card against nearby links in the network map for context.
                        </p>
                        {selectedColumnMeta?.nullRatio != null ? (
                          <p className="mono-value text-[0.64rem] text-[var(--ink-faded)]">
                            Estimated non-null response coverage:{" "}
                            {formatPercent((1 - selectedColumnMeta.nullRatio) * 100, 1)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="section-subtitle">No relationships found for this question.</p>
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
