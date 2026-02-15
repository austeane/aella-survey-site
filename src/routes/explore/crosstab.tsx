import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ColumnCombobox } from "@/components/column-combobox";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { DataTable } from "@/components/data-table";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { MissingnessBadge } from "@/components/missingness-badge";
import { PivotMatrix, type PivotCellDetail, type PivotNormalization } from "@/components/pivot-matrix";
import { SampleSizeDisplay } from "@/components/sample-size-display";
import { SectionHeader } from "@/components/section-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { SchemaData } from "@/lib/api/contracts";
import { getSchema } from "@/lib/client/api";
import { track } from "@/lib/client/track";
import { DEFAULTS_BY_PAGE } from "@/lib/chart-presets";

import { formatValueWithLabel, getColumnDisplayName } from "@/lib/format-labels";
import { addNotebookEntry } from "@/lib/notebook-store";
import { useDuckDB } from "@/lib/duckdb/provider";
import { buildWhereClause, quoteIdentifier, quoteLiteral } from "@/lib/duckdb/sql-helpers";
import { asNumber, formatNumber, formatPercent } from "@/lib/format";
import { useDuckDBQuery } from "@/lib/duckdb/use-query";

export const Route = createFileRoute("/explore/crosstab")({
  validateSearch: (
    search,
  ): {
    x?: string;
    y?: string;
    normalization?: PivotNormalization;
    topN?: number;
    filterColumn?: string;
    filterValues?: string;
  } => ({
    x: typeof search.x === "string" ? search.x : undefined,
    y: typeof search.y === "string" ? search.y : undefined,
    normalization:
      search.normalization === "count" ||
      search.normalization === "row" ||
      search.normalization === "column" ||
      search.normalization === "overall"
        ? search.normalization
        : undefined,
    topN:
      typeof search.topN === "number"
        ? search.topN
        : typeof search.topN === "string" && Number.isFinite(Number(search.topN))
          ? Number(search.topN)
          : undefined,
    filterColumn: typeof search.filterColumn === "string" ? search.filterColumn : undefined,
    filterValues: typeof search.filterValues === "string" ? search.filterValues : undefined,
  }),
  component: ExplorePage,
});

const NORMALIZATION_OPTIONS: Array<{ value: PivotNormalization; label: string }> = [
  { value: "count", label: "Counts" },
  { value: "row", label: "Row % (within each row)" },
  { value: "column", label: "Column % (within each column)" },
  { value: "overall", label: "Overall %" },
];

function ControlHelp({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="null-badge" aria-label="Help">
          ?
        </button>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

function associationLabel(cramersV: number): string {
  if (cramersV < 0.1) return "very weak";
  if (cramersV < 0.3) return "weak";
  if (cramersV < 0.5) return "moderate";
  return "strong";
}

function isCategoricalType(logicalType: string): boolean {
  return logicalType === "categorical" || logicalType === "boolean";
}

function computeCramersV(rows: Array<{ x: string; y: string; count: number }>): { value: number; nUsed: number } {
  if (rows.length === 0) {
    return { value: 0, nUsed: 0 };
  }

  const rowTotals = new Map<string, number>();
  const colTotals = new Map<string, number>();
  let total = 0;

  for (const row of rows) {
    rowTotals.set(row.y, (rowTotals.get(row.y) ?? 0) + row.count);
    colTotals.set(row.x, (colTotals.get(row.x) ?? 0) + row.count);
    total += row.count;
  }

  const rowCount = rowTotals.size;
  const colCount = colTotals.size;

  if (total <= 0 || rowCount < 2 || colCount < 2) {
    return { value: 0, nUsed: total };
  }

  const observed = new Map<string, number>();
  for (const row of rows) {
    observed.set(`${row.y}\u0000${row.x}`, row.count);
  }

  let chiSquare = 0;
  for (const [yValue, yTotal] of rowTotals.entries()) {
    for (const [xValue, xTotal] of colTotals.entries()) {
      const expected = (yTotal * xTotal) / total;
      if (expected <= 0) continue;

      const obs = observed.get(`${yValue}\u0000${xValue}`) ?? 0;
      chiSquare += ((obs - expected) ** 2) / expected;
    }
  }

  const denominator = total * Math.min(rowCount - 1, colCount - 1);
  if (denominator <= 0) {
    return { value: 0, nUsed: total };
  }

  return {
    value: Math.sqrt(chiSquare / denominator),
    nUsed: total,
  };
}

function ExplorePage() {
  const search = Route.useSearch();
  const searchKey = `${search.x ?? ""}|${search.y ?? ""}|${search.filterColumn ?? ""}`;
  const [appliedKey, setAppliedKey] = useState(searchKey);
  const navigate = useNavigate({ from: "/explore/crosstab" });
  const { phase } = useDuckDB();

  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [searchReady, setSearchReady] = useState(false);

  const [xColumn, setXColumn] = useState("");
  const [yColumn, setYColumn] = useState("");
  const [limit, setLimit] = useState(50);
  const [normalization, setNormalization] = useState<PivotNormalization>("count");
  const [topN, setTopN] = useState(12);

  const [filterColumn, setFilterColumn] = useState("");
  const [selectedFilterValues, setSelectedFilterValues] = useState<string[]>([]);
  const [selectedCell, setSelectedCell] = useState<PivotCellDetail | null>(null);
  const lastCrosstabTrackKey = useRef<string | null>(null);

  useEffect(() => {
    if (searchKey === appliedKey && schema) return;

    let cancelled = false;

    void getSchema()
      .then((response) => {
        if (cancelled) return;

        const nextSchema = response.data;
        setSchema(nextSchema);
        const defaults = DEFAULTS_BY_PAGE.explore;

        const preferredX =
          (search.x ? nextSchema.columns.find((c) => c.name === search.x) : undefined) ??
          (defaults?.x ? nextSchema.columns.find((c) => c.name === defaults.x) : undefined) ??
          nextSchema.columns.find((c) => c.name === "straightness") ??
          nextSchema.columns[0];

        const preferredY =
          (search.y ? nextSchema.columns.find((c) => c.name === search.y) : undefined) ??
          (defaults?.y ? nextSchema.columns.find((c) => c.name === defaults.y) : undefined) ??
          nextSchema.columns.find((c) => c.name === "politics") ??
          nextSchema.columns[1];

        setXColumn(preferredX?.name ?? "");
        setYColumn(preferredY?.name ?? "");
        const defaultNormalization =
          defaults?.normalization === "count" ||
          defaults?.normalization === "row" ||
          defaults?.normalization === "column" ||
          defaults?.normalization === "overall"
            ? defaults.normalization
            : "count";

        setNormalization(search.normalization ?? defaultNormalization);
        const defaultTopN = Number.isFinite(defaults?.topN) ? Number(defaults?.topN) : 12;
        setTopN(
          Number.isFinite(search.topN)
            ? Math.max(3, Math.min(30, Math.trunc(search.topN ?? 12)))
            : Math.max(3, Math.min(30, Math.trunc(defaultTopN))),
        );

        const requestedFilter = search.filterColumn
          ? nextSchema.columns.find((column) => column.name === search.filterColumn)
          : undefined;

        const firstDemoFilter = nextSchema.columns.find(
          (c) => c.tags.includes("demographic") && c.logicalType === "categorical",
        );
        const selectedFilter = requestedFilter?.name ?? firstDemoFilter?.name ?? "";
        setFilterColumn(selectedFilter);

        const initialFilterValues =
          selectedFilter && search.filterValues
            ? search.filterValues.split(",").map((value: string) => value.trim()).filter(Boolean)
            : [];
        setSelectedFilterValues(initialFilterValues);
        setAppliedKey(searchKey);
        setSearchReady(true);
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setSchemaError(error.message);
          setSearchReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  useEffect(() => {
    if (!searchReady) return;

    void navigate({
      search: {
        x: xColumn || undefined,
        y: yColumn || undefined,
        normalization: normalization !== "count" ? normalization : undefined,
        topN: topN !== 12 ? topN : undefined,
        filterColumn: filterColumn || undefined,
        filterValues: selectedFilterValues.length > 0 ? selectedFilterValues.join(",") : undefined,
      },
      replace: true,
    });
  }, [xColumn, yColumn, normalization, topN, filterColumn, selectedFilterValues, navigate, searchReady]);

  const xMeta = useMemo(() => schema?.columns.find((c) => c.name === xColumn) ?? null, [schema, xColumn]);
  const yMeta = useMemo(() => schema?.columns.find((c) => c.name === yColumn) ?? null, [schema, yColumn]);
  const filterMeta = useMemo(
    () => schema?.columns.find((c) => c.name === filterColumn) ?? null,
    [schema, filterColumn],
  );

  const isPivotable =
    xMeta != null &&
    yMeta != null &&
    isCategoricalType(xMeta.logicalType) &&
    isCategoricalType(yMeta.logicalType);

  const isMixedCategoricalNumeric =
    xMeta != null &&
    yMeta != null &&
    ((isCategoricalType(xMeta.logicalType) && yMeta.logicalType === "numeric")
      || (xMeta.logicalType === "numeric" && isCategoricalType(yMeta.logicalType)));

  const filterOptionsSql = useMemo(() => {
    if (!filterColumn) return null;
    const quoted = quoteIdentifier(filterColumn);
    return `
      SELECT cast(${quoted} AS VARCHAR) AS value, count(*)::BIGINT AS cnt
      FROM data
      WHERE ${quoted} IS NOT NULL
      GROUP BY 1
      ORDER BY cnt DESC
      LIMIT 20
    `;
  }, [filterColumn]);

  const filterOptionsQuery = useDuckDBQuery(filterOptionsSql);

  const filterOptions = useMemo(() => {
    if (!filterOptionsQuery.data) return [];
    return filterOptionsQuery.data.rows.map((r) => ({
      value: String(r[0] ?? "NULL"),
      count: asNumber(r[1]),
    }));
  }, [filterOptionsQuery.data]);

  const queryFilters = useMemo(() => {
    if (!filterColumn || selectedFilterValues.length === 0) return undefined;
    return {
      [filterColumn]: selectedFilterValues.map((v) => (v === "NULL" ? null : v)),
    };
  }, [filterColumn, selectedFilterValues]);

  const whereClause = useMemo(() => buildWhereClause(queryFilters), [queryFilters]);

  const crosstabSql = useMemo(() => {
    if (!xColumn || !yColumn) return null;

    const xQuoted = quoteIdentifier(xColumn);
    const yQuoted = quoteIdentifier(yColumn);

    const clauses: string[] = [];
    if (whereClause.startsWith("WHERE ")) {
      clauses.push(whereClause.replace(/^WHERE\s+/i, ""));
    }
    clauses.push(`${xQuoted} IS NOT NULL`);
    clauses.push(`${yQuoted} IS NOT NULL`);

    const fullWhere = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

    return `
      SELECT
        cast(${xQuoted} AS VARCHAR) AS x,
        cast(${yQuoted} AS VARCHAR) AS y,
        count(*)::BIGINT AS count
      FROM data
      ${fullWhere}
      GROUP BY 1, 2
      ORDER BY count DESC
      ${isPivotable ? "" : `LIMIT ${limit}`}
    `;
  }, [xColumn, yColumn, whereClause, isPivotable, limit]);

  const mixedChartSql = useMemo(() => {
    if (!xMeta || !yMeta || !isMixedCategoricalNumeric) return null;

    const categoryColumn = isCategoricalType(xMeta.logicalType) ? xColumn : yColumn;
    const numericColumn = isCategoricalType(xMeta.logicalType) ? yColumn : xColumn;
    const categoryQuoted = quoteIdentifier(categoryColumn);
    const numericQuoted = quoteIdentifier(numericColumn);
    const topCategories = Math.max(3, Math.min(30, topN));

    const clauses: string[] = [];
    if (whereClause.startsWith("WHERE ")) {
      clauses.push(whereClause.replace(/^WHERE\s+/i, ""));
    }
    clauses.push(`${categoryQuoted} IS NOT NULL`);
    clauses.push(`${numericQuoted} IS NOT NULL`);
    const fullWhere = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

    return `
      SELECT
        cast(${categoryQuoted} AS VARCHAR) AS name,
        round(avg(cast(${numericQuoted} AS DOUBLE))::DOUBLE, 3) AS value,
        count(*)::BIGINT AS people
      FROM data
      ${fullWhere}
      GROUP BY 1
      ORDER BY people DESC
      LIMIT ${topCategories}
    `;
  }, [xMeta, yMeta, isMixedCategoricalNumeric, xColumn, yColumn, topN, whereClause]);

  const sampleSizeSql = useMemo(() => {
    if (!xColumn || !yColumn) return null;

    const xQuoted = quoteIdentifier(xColumn);
    const yQuoted = quoteIdentifier(yColumn);

    return `
      SELECT
        count(*)::BIGINT AS total_count,
        count(${xQuoted})::BIGINT AS x_non_null,
        count(${yQuoted})::BIGINT AS y_non_null,
        count(*) FILTER (
          WHERE ${xQuoted} IS NOT NULL AND ${yQuoted} IS NOT NULL
        )::BIGINT AS used_count
      FROM data
      ${whereClause}
    `;
  }, [xColumn, yColumn, whereClause]);

  const crosstabQuery = useDuckDBQuery(crosstabSql);
  const mixedChartQuery = useDuckDBQuery(mixedChartSql);
  const sampleSizeQuery = useDuckDBQuery(sampleSizeSql);

  const crosstabTrackKey = useMemo(
    () => `${xColumn}|${yColumn}|${whereClause}|${normalization}|${topN}|${limit}`,
    [xColumn, yColumn, whereClause, normalization, topN, limit],
  );

  useEffect(() => {
    if (!crosstabSql || crosstabQuery.loading || crosstabQuery.error || !crosstabQuery.data) {
      return;
    }

    if (lastCrosstabTrackKey.current === crosstabTrackKey) {
      return;
    }

    lastCrosstabTrackKey.current = crosstabTrackKey;

    track({
      event: "query",
      page: typeof window !== "undefined" ? window.location.pathname : "/explore/crosstab",
      action: "run_crosstab",
      label: isPivotable ? "pivot" : isMixedCategoricalNumeric ? "mixed" : "table",
      value: crosstabQuery.data.rows.length,
    });
  }, [
    crosstabSql,
    crosstabQuery.loading,
    crosstabQuery.error,
    crosstabQuery.data,
    crosstabTrackKey,
    isPivotable,
    isMixedCategoricalNumeric,
  ]);

  useEffect(() => {
    if (!selectedCell) return;

    track({
      event: "interaction",
      page: typeof window !== "undefined" ? window.location.pathname : "/explore/crosstab",
      action: "cell_drilldown",
      label: `${selectedCell.x} × ${selectedCell.y}`,
    });
  }, [selectedCell]);

  const rows = useMemo(() => {
    if (!crosstabQuery.data) return [];
    return crosstabQuery.data.rows.map((r) => ({
      x: String(r[0] ?? "NULL"),
      y: String(r[1] ?? "NULL"),
      count: asNumber(r[2]),
    }));
  }, [crosstabQuery.data]);

  const mixedChartRows = useMemo(() => {
    if (!mixedChartQuery.data) return [];
    return mixedChartQuery.data.rows.map((row) => ({
      name: String(row[0] ?? "NULL"),
      value: asNumber(row[1]),
      people: asNumber(row[2]),
    }));
  }, [mixedChartQuery.data]);

  const mixedCategoryMeta = useMemo(() => {
    if (!xMeta || !yMeta || !isMixedCategoricalNumeric) return null;
    return isCategoricalType(xMeta.logicalType) ? xMeta : yMeta;
  }, [xMeta, yMeta, isMixedCategoricalNumeric]);

  const mixedNumericMeta = useMemo(() => {
    if (!xMeta || !yMeta || !isMixedCategoricalNumeric) return null;
    return isCategoricalType(xMeta.logicalType) ? yMeta : xMeta;
  }, [xMeta, yMeta, isMixedCategoricalNumeric]);

  const mixedChartData = useMemo(
    () =>
      mixedChartRows.map((row) => ({
        name: formatValueWithLabel(row.name, mixedCategoryMeta?.valueLabels),
        value: row.value,
      })),
    [mixedChartRows, mixedCategoryMeta],
  );

  const sampleSizes = useMemo(() => {
    const row = sampleSizeQuery.data?.rows[0];
    if (!row) {
      return {
        total: 0,
        xNonNull: 0,
        yNonNull: 0,
        used: 0,
      };
    }

    return {
      total: asNumber(row[0]),
      xNonNull: asNumber(row[1]),
      yNonNull: asNumber(row[2]),
      used: asNumber(row[3]),
    };
  }, [sampleSizeQuery.data]);

  const association = useMemo(() => {
    if (!isPivotable) return null;
    return computeCramersV(rows);
  }, [rows, isPivotable]);

  const demographicColumns = useMemo(() => {
    if (!schema) return [];
    return schema.columns.filter(
      (c) => c.tags.includes("demographic") && c.logicalType === "categorical",
    );
  }, [schema]);

  const sqlForCell = useMemo(() => {
    if (!selectedCell || !xColumn || !yColumn) return null;

    const predicateForCell = (
      columnName: string,
      value: string,
      isOther: boolean,
      topValues: string[],
    ): string[] => {
      const quotedColumn = quoteIdentifier(columnName);
      if (!isOther) {
        return [`${quotedColumn} = ${quoteLiteral(value)}`];
      }

      const predicates = [`${quotedColumn} IS NOT NULL`];
      if (topValues.length > 0) {
        predicates.push(
          `${quotedColumn} NOT IN (${topValues.map((item) => quoteLiteral(item)).join(", ")})`,
        );
      }

      return predicates;
    };

    const predicates: string[] = [];
    if (queryFilters) {
      for (const [columnName, rawValue] of Object.entries(queryFilters)) {
        if (!Array.isArray(rawValue)) continue;
        const normalized = rawValue.filter((value) => value !== null);
        if (normalized.length > 0) {
          predicates.push(
            `${quoteIdentifier(columnName)} IN (${normalized.map((value) => quoteLiteral(value)).join(", ")})`,
          );
        }
      }
    }

    predicates.push(
      ...predicateForCell(xColumn, selectedCell.x, selectedCell.xIsOther, selectedCell.topXValues),
    );
    predicates.push(
      ...predicateForCell(yColumn, selectedCell.y, selectedCell.yIsOther, selectedCell.topYValues),
    );

    return `
SELECT *
FROM data
WHERE ${predicates.join("\n  AND ")}
LIMIT 250
`.trim();
  }, [selectedCell, xColumn, yColumn, queryFilters]);

  const sqlHref = sqlForCell ? `/sql?sql=${encodeURIComponent(sqlForCell)}` : "/sql";

  const [notebookSaved, setNotebookSaved] = useState(false);

  const saveToNotebook = useCallback(() => {
    if (!xColumn || !yColumn || rows.length === 0) return;

    addNotebookEntry({
      title: `Cross-tab: ${xColumn} × ${yColumn}`,
      sourceUrl: window.location.href,
      queryDefinition: {
        type: "crosstab",
        params: {
          x: xColumn,
          y: yColumn,
          normalization,
          filterColumn: filterColumn || undefined,
          filterValues: selectedFilterValues.length > 0 ? selectedFilterValues : undefined,
        },
      },
      resultsSnapshot: {
        columns: ["x", "y", "count"],
        rows: rows.slice(0, 50).map((r) => [r.x, r.y, r.count]),
        summary: association ? { cramersV: association.value, nUsed: association.nUsed } : {},
      },
      notes: "",
    });

    setNotebookSaved(true);
    setTimeout(() => setNotebookSaved(false), 2000);
  }, [xColumn, yColumn, rows, normalization, filterColumn, selectedFilterValues, association]);

  return (
    <TooltipProvider delayDuration={120}>
      <div className="page">
        <header className="page-header">
          <h1 className="page-title">Explore Two Questions</h1>
          <p className="page-subtitle">
            Compare any two survey questions, then refine with filters and counting options.
          </p>
        </header>

        {schemaError ? <section className="alert alert--error">Failed to load schema: {schemaError}</section> : null}

        <section className="editorial-panel space-y-4">
          <SectionHeader number="01" title="Chart" />
          <p className="section-subtitle">
            Start by reading the visual result first. Then tune controls in the next section.
          </p>

          <a href="#edit-chart-controls" className="editorial-button inline-flex">
            Edit this chart
          </a>

          {crosstabQuery.loading || (isMixedCategoricalNumeric && mixedChartQuery.loading) ? (
            <p className="section-subtitle">Running comparison query...</p>
          ) : null}
          {crosstabQuery.error ? <p className="alert alert--error">{crosstabQuery.error}</p> : null}
          {mixedChartQuery.error ? <p className="alert alert--error">{mixedChartQuery.error}</p> : null}

          {!crosstabQuery.loading && !crosstabQuery.error && !mixedChartQuery.error ? (
            isPivotable ? (
              <PivotMatrix
                rows={rows}
                topN={topN}
                normalization={normalization}
                xValueLabels={xMeta?.valueLabels}
                yValueLabels={yMeta?.valueLabels}
                onCellClick={setSelectedCell}
              />
            ) : isMixedCategoricalNumeric ? (
              <div className="space-y-3">
                <div className="h-[360px] w-full">
                  <SimpleBarChart
                    data={mixedChartData}
                    xLabel={mixedCategoryMeta ? getColumnDisplayName(mixedCategoryMeta) : "Category"}
                    yLabel={mixedNumericMeta ? `Average ${getColumnDisplayName(mixedNumericMeta)}` : "Average value"}
                  />
                </div>
                {mixedChartRows.length > 0 ? (
                  <p className="mono-value text-[var(--ink-faded)]">
                    Showing top {Math.min(mixedChartRows.length, Math.max(3, Math.min(30, topN)))} categories by people count.
                  </p>
                ) : null}
                <details>
                  <summary className="mono-value cursor-pointer text-[var(--ink-faded)]">Show data table</summary>
                  <div className="mt-2">
                    <DataTable
                      rows={rows}
                      rowKey={(row, index) => `${row.x}-${row.y}-${index}`}
                      columns={[
                        {
                          id: "x",
                          header: xMeta ? getColumnDisplayName(xMeta) : xColumn || "X",
                          cell: (row) => formatValueWithLabel(row.x, xMeta?.valueLabels),
                        },
                        {
                          id: "y",
                          header: yMeta ? getColumnDisplayName(yMeta) : yColumn || "Y",
                          cell: (row) => formatValueWithLabel(row.y, yMeta?.valueLabels),
                        },
                        {
                          id: "count",
                          header: "People",
                          align: "right",
                          cell: (row) => formatNumber(row.count),
                        },
                      ]}
                      emptyMessage="No matching rows"
                    />
                  </div>
                </details>
              </div>
            ) : (
              <DataTable
                rows={rows}
                rowKey={(row, index) => `${row.x}-${row.y}-${index}`}
                columns={[
                  {
                    id: "x",
                    header: xMeta ? getColumnDisplayName(xMeta) : xColumn || "X",
                    cell: (row) => formatValueWithLabel(row.x, xMeta?.valueLabels),
                  },
                  {
                    id: "y",
                    header: yMeta ? getColumnDisplayName(yMeta) : yColumn || "Y",
                    cell: (row) => formatValueWithLabel(row.y, yMeta?.valueLabels),
                  },
                  {
                    id: "count",
                    header: "People",
                    align: "right",
                    cell: (row) => formatNumber(row.count),
                  },
                ]}
                emptyMessage="No matching rows"
              />
            )
          ) : null}
        </section>

        <section className="raised-panel space-y-4">
          <SectionHeader number="02" title="Result Details" />

          <SampleSizeDisplay
            total={sampleSizes.total}
            nonNull={Math.min(sampleSizes.xNonNull, sampleSizes.yNonNull)}
            used={sampleSizes.used}
          />
          <p className="mono-value">
            People who answered {xMeta ? getColumnDisplayName(xMeta) : xColumn || "X"}: {formatNumber(sampleSizes.xNonNull)} | People who answered{" "}
            {yMeta ? getColumnDisplayName(yMeta) : yColumn || "Y"}: {formatNumber(sampleSizes.yNonNull)}
          </p>

          {association ? (
            <p className="mono-value">
              How related: {associationLabel(association.value)} ({association.value.toFixed(2)}) - based on {formatNumber(association.nUsed)} responses
            </p>
          ) : null}

          {rows.length > 0 ? (
            <button type="button" className="editorial-button" onClick={saveToNotebook}>
              {notebookSaved ? "Saved!" : "Add to Notebook"}
            </button>
          ) : null}

          {selectedCell ? (
            <aside className="editorial-panel space-y-2">
              <SectionHeader number="02a" title="Selected Cell" />
              <p className="mono-value">
                {xMeta ? getColumnDisplayName(xMeta) : xColumn}:{" "}
                {formatValueWithLabel(selectedCell.x, xMeta?.valueLabels)}
              </p>
              <p className="mono-value">
                {yMeta ? getColumnDisplayName(yMeta) : yColumn}:{" "}
                {formatValueWithLabel(selectedCell.y, yMeta?.valueLabels)}
              </p>
              <p className="mono-value">People: {formatNumber(selectedCell.count)}</p>
              <p className="mono-value">% of row: {formatPercent(selectedCell.rowPercent, 2)}</p>
              <p className="mono-value">% of column: {formatPercent(selectedCell.columnPercent, 2)}</p>
              <p className="mono-value">% overall: {formatPercent(selectedCell.overallPercent, 2)}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                <Link to="/profile" className="editorial-button">
                  Open this group in Profile
                </Link>
                <a href={sqlHref} className="editorial-button">
                  Open in SQL Console
                </a>
              </div>
            </aside>
          ) : null}
        </section>

        {schema ? (
          <section id="edit-chart-controls" className="raised-panel space-y-4">
            <SectionHeader number="03" title="Edit this chart" />

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="editorial-label">
                <div className="flex items-center gap-2">
                  <span>X question</span>
                  <ControlHelp text="Pick the first question for the horizontal axis." />
                </div>
                <ColumnCombobox
                  columns={schema.columns}
                  value={xColumn}
                  onValueChange={setXColumn}
                  placeholder="Select X"
                />
                {xMeta?.nullMeaning && xMeta.nullMeaning !== "UNKNOWN" ? <MissingnessBadge meaning={xMeta.nullMeaning} /> : null}
              </div>

              <div className="editorial-label">
                <div className="flex items-center gap-2">
                  <span>Y question</span>
                  <ControlHelp text="Pick the second question to compare against X." />
                </div>
                <ColumnCombobox
                  columns={schema.columns}
                  value={yColumn}
                  onValueChange={setYColumn}
                  placeholder="Select Y"
                />
                {yMeta?.nullMeaning && yMeta.nullMeaning !== "UNKNOWN" ? <MissingnessBadge meaning={yMeta.nullMeaning} /> : null}
              </div>

              <div className="editorial-label">
                <div className="flex items-center gap-2">
                  <span>Optional demographic filter</span>
                  <ControlHelp text="Limit the comparison to specific groups before counting." />
                </div>
                <ColumnCombobox
                  columns={demographicColumns}
                  value={filterColumn}
                  includeNoneOption
                  noneOptionLabel="None"
                  onValueChange={(value) => {
                    setFilterColumn(value);
                    setSelectedFilterValues([]);
                  }}
                />
              </div>

              <label className="editorial-label">
                <div className="flex items-center gap-2">
                  <span>Max rows in detail table</span>
                  <ControlHelp text="Only affects the optional advanced table shown below the main chart." />
                </div>
                <Input
                  type="number"
                  name="result_limit"
                  min={1}
                  max={1000}
                  value={limit}
                  onChange={(event) =>
                    setLimit(Math.max(1, Math.min(1000, Number(event.target.value) || 1)))
                  }
                />
              </label>

              {isPivotable ? (
                <>
                  <label className="editorial-label">
                    <div className="flex items-center gap-2">
                      <span>How to count</span>
                      <ControlHelp text="Row % means percentage within each row. Column % means percentage within each column." />
                    </div>
                    <Select
                      value={normalization}
                      onValueChange={(value) => {
                        const nextNormalization = value as PivotNormalization;
                        track({
                          event: "interaction",
                          page: typeof window !== "undefined" ? window.location.pathname : "/explore/crosstab",
                          action: "change_normalization",
                          label: nextNormalization,
                        });
                        setNormalization(nextNormalization);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NORMALIZATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>

                  <label className="editorial-label">
                    <div className="flex items-center gap-2">
                      <span>Maximum categories to show</span>
                      <ControlHelp text="Keeps charts readable by collapsing the long tail into “Other”." />
                    </div>
                    <Input
                      type="number"
                      name="top_n"
                      min={3}
                      max={30}
                      value={topN}
                      onChange={(event) =>
                        setTopN(Math.max(3, Math.min(30, Number(event.target.value) || 3)))
                      }
                    />
                  </label>
                </>
              ) : null}
            </div>

            {filterColumn && filterOptions.length > 0 ? (
              <div>
                <p className="mono-label">Filter values</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {filterOptions.map((option) => {
                    const checked = selectedFilterValues.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className="flex items-center justify-between border border-[var(--rule)] bg-[var(--paper)] px-2.5 py-2"
                      >
                        <span className="mono-value truncate pr-2">
                          {formatValueWithLabel(option.value, filterMeta?.valueLabels)}
                        </span>
                        <span className="mono-value text-[var(--ink-faded)]">{formatNumber(option.count)}</span>
                        <Checkbox
                          className="ml-3"
                          checked={checked}
                          onCheckedChange={(nextChecked) => {
                            if (nextChecked === true) {
                              setSelectedFilterValues((current) => [...current, option.value]);
                            } else {
                              setSelectedFilterValues((current) =>
                                current.filter((value) => value !== option.value),
                              );
                            }
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>
        ) : (
          <section className="editorial-panel">
            <LoadingSkeleton variant="panel" phase={phase} title="Loading schema metadata..." />
          </section>
        )}
      </div>
    </TooltipProvider>
  );
}
