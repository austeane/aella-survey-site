import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ColumnCombobox } from "@/components/column-combobox";
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
import type { SchemaData } from "@/lib/api/contracts";
import { getSchema } from "@/lib/client/api";

import { formatValueWithLabel, getColumnDisplayName } from "@/lib/format-labels";
import { addNotebookEntry } from "@/lib/notebook-store";
import { useDuckDB } from "@/lib/duckdb/provider";
import { buildWhereClause, quoteIdentifier, quoteLiteral } from "@/lib/duckdb/sql-helpers";
import { asNumber, formatNumber, formatPercent } from "@/lib/format";
import { useDuckDBQuery } from "@/lib/duckdb/use-query";

export const Route = createFileRoute("/explore")({
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
  { value: "row", label: "Row %" },
  { value: "column", label: "Column %" },
  { value: "overall", label: "Overall %" },
];

function associationLabel(cramersV: number): string {
  if (cramersV < 0.1) return "negligible";
  if (cramersV < 0.3) return "weak";
  if (cramersV < 0.5) return "moderate";
  return "strong";
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
  const [initialSearch] = useState(search);
  const navigate = useNavigate({ from: "/explore" });
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

  useEffect(() => {
    let cancelled = false;

    void getSchema()
      .then((response) => {
        if (cancelled) return;

        const nextSchema = response.data;
        setSchema(nextSchema);

        const preferredX =
          (initialSearch.x ? nextSchema.columns.find((c) => c.name === initialSearch.x) : undefined) ??
          nextSchema.columns.find((c) => c.name === "straightness") ??
          nextSchema.columns[0];

        const preferredY =
          (initialSearch.y ? nextSchema.columns.find((c) => c.name === initialSearch.y) : undefined) ??
          nextSchema.columns.find((c) => c.name === "politics") ??
          nextSchema.columns[1];

        setXColumn(preferredX?.name ?? "");
        setYColumn(preferredY?.name ?? "");
        setNormalization(initialSearch.normalization ?? "count");
        setTopN(
          Number.isFinite(initialSearch.topN)
            ? Math.max(3, Math.min(30, Math.trunc(initialSearch.topN ?? 12)))
            : 12,
        );

        const requestedFilter = initialSearch.filterColumn
          ? nextSchema.columns.find((column) => column.name === initialSearch.filterColumn)
          : undefined;

        const firstDemoFilter = nextSchema.columns.find(
          (c) => c.tags.includes("demographic") && c.logicalType === "categorical",
        );
        const selectedFilter = requestedFilter?.name ?? firstDemoFilter?.name ?? "";
        setFilterColumn(selectedFilter);

        const initialFilterValues =
          selectedFilter && initialSearch.filterValues
            ? initialSearch.filterValues.split(",").map((value) => value.trim()).filter(Boolean)
            : [];
        setSelectedFilterValues(initialFilterValues);
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
  }, [initialSearch]);

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
    ["categorical", "boolean"].includes(xMeta.logicalType) &&
    ["categorical", "boolean"].includes(yMeta.logicalType);

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
  const sampleSizeQuery = useDuckDBQuery(sampleSizeSql);

  const rows = useMemo(() => {
    if (!crosstabQuery.data) return [];
    return crosstabQuery.data.rows.map((r) => ({
      x: String(r[0] ?? "NULL"),
      y: String(r[1] ?? "NULL"),
      count: asNumber(r[2]),
    }));
  }, [crosstabQuery.data]);

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
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Cross-Tab Explorer</h1>
        <p className="page-subtitle">Cross-tabulate any two variables. Normalize, filter by demographics, and measure association strength.</p>
      </header>

      {schemaError ? <section className="alert alert--error">Failed to load schema: {schemaError}</section> : null}

      {schema ? (
        <section className="raised-panel space-y-4">
          <SectionHeader number="01" title="Controls" />

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="editorial-label">
              X Column
              <ColumnCombobox
                columns={schema.columns}
                value={xColumn}
                onValueChange={setXColumn}
                placeholder="Select X"
              />
              {xMeta ? <MissingnessBadge meaning={xMeta.nullMeaning} /> : null}
            </label>

            <label className="editorial-label">
              Y Column
              <ColumnCombobox
                columns={schema.columns}
                value={yColumn}
                onValueChange={setYColumn}
                placeholder="Select Y"
              />
              {yMeta ? <MissingnessBadge meaning={yMeta.nullMeaning} /> : null}
            </label>

            <label className="editorial-label">
              Optional Demographic Filter
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
            </label>

            <label className="editorial-label">
              Result Row Limit (non-pivot)
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
                  Normalization
                  <Select value={normalization} onValueChange={(value) => setNormalization(value as PivotNormalization)}>
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
                  Show Top N Categories Per Axis
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
              <p className="mono-label">Filter Values</p>
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

      <section className="editorial-panel space-y-4">
        <SectionHeader number="02" title="Results" />

        <SampleSizeDisplay
          total={sampleSizes.total}
          nonNull={Math.min(sampleSizes.xNonNull, sampleSizes.yNonNull)}
          used={sampleSizes.used}
        />
        <p className="mono-value">
          N non-null {xColumn || "X"}: {formatNumber(sampleSizes.xNonNull)} | N non-null {yColumn || "Y"}:{" "}
          {formatNumber(sampleSizes.yNonNull)}
        </p>

        {association ? (
          <p className="mono-value">
            Association: V = {association.value.toFixed(3)} ({associationLabel(association.value)}) | N used: {formatNumber(association.nUsed)}
          </p>
        ) : null}

        {rows.length > 0 ? (
          <button
            type="button"
            className="editorial-button"
            onClick={saveToNotebook}
          >
            {notebookSaved ? "Saved!" : "Add to Notebook"}
          </button>
        ) : null}

        {crosstabQuery.loading ? <p className="section-subtitle">Running crosstab query...</p> : null}
        {crosstabQuery.error ? <p className="alert alert--error">{crosstabQuery.error}</p> : null}

        {!crosstabQuery.loading && !crosstabQuery.error ? (
          isPivotable ? (
            <PivotMatrix
              rows={rows}
              topN={topN}
              normalization={normalization}
              xValueLabels={xMeta?.valueLabels}
              yValueLabels={yMeta?.valueLabels}
              onCellClick={setSelectedCell}
            />
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
                  header: "Count",
                  align: "right",
                  cell: (row) => formatNumber(row.count),
                },
              ]}
              emptyMessage="No matching rows"
            />
          )
        ) : null}

        {selectedCell ? (
          <aside className="raised-panel space-y-2">
            <SectionHeader number="03" title="Selected Cell" />
            <p className="mono-value">
              {xMeta ? getColumnDisplayName(xMeta) : xColumn}:{" "}
              {formatValueWithLabel(selectedCell.x, xMeta?.valueLabels)}
            </p>
            <p className="mono-value">
              {yMeta ? getColumnDisplayName(yMeta) : yColumn}:{" "}
              {formatValueWithLabel(selectedCell.y, yMeta?.valueLabels)}
            </p>
            <p className="mono-value">Count: {formatNumber(selectedCell.count)}</p>
            <p className="mono-value">% of row: {formatPercent(selectedCell.rowPercent, 2)}</p>
            <p className="mono-value">% of column: {formatPercent(selectedCell.columnPercent, 2)}</p>
            <p className="mono-value">% overall: {formatPercent(selectedCell.overallPercent, 2)}</p>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link to="/profile" className="editorial-button">
                Open this cohort in Profile
              </Link>
              <a href={sqlHref} className="editorial-button">
                Generate SQL for this cohort
              </a>
            </div>
          </aside>
        ) : null}
      </section>
    </div>
  );
}
