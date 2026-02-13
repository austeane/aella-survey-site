import { useMemo } from "react";

import { CAVEAT_DEFINITIONS } from "@/lib/schema/caveats";
import { asNullableNumber, asNumber, formatNumber, formatPercent } from "@/lib/format";
import { quoteIdentifier } from "@/lib/duckdb/sql-helpers";
import { useDuckDBQuery } from "@/lib/duckdb/use-query";
import { MissingnessBadge } from "./missingness-badge";
import { SampleSizeDisplay } from "./sample-size-display";
import { ScrollArea } from "./ui/scroll-area";
import type { SchemaData } from "@/lib/api/contracts";
import { DataTable } from "./data-table";
import { SectionHeader } from "./section-header";

interface ColumnInspectorProps {
  column: SchemaData["columns"][number] | null;
  allColumns: SchemaData["columns"];
}

interface CategoryRow {
  value: string;
  count: number;
  percentage: number;
}

function encodeSql(sql: string): string {
  return encodeURIComponent(sql);
}

function candidateValueKeys(value: string): string[] {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return [trimmed];
  }

  const candidates = new Set<string>([trimmed]);
  const numeric = Number(trimmed);

  if (Number.isFinite(numeric)) {
    candidates.add(String(numeric));
    if (Number.isInteger(numeric)) {
      candidates.add(String(Math.trunc(numeric)));
    }
  }

  if (/^-?\d+\.0+$/.test(trimmed)) {
    candidates.add(trimmed.replace(/\.0+$/, ""));
  }

  return [...candidates];
}

function formatValueWithLabel(value: string, valueLabels?: Record<string, string>): string {
  if (!valueLabels || value === "NULL") {
    return value;
  }

  for (const key of candidateValueKeys(value)) {
    const label = valueLabels[key];
    if (label) {
      return `${value} - ${label}`;
    }
  }

  return value;
}

export function ColumnInspector({ column, allColumns }: ColumnInspectorProps) {
  const quotedColumn = column ? quoteIdentifier(column.name) : "";

  const countsSql = useMemo(() => {
    if (!column) return null;

    return `
      SELECT
        count(*)::BIGINT AS total_count,
        count(${quotedColumn})::BIGINT AS non_null_count
      FROM data
    `;
  }, [column, quotedColumn]);

  const numericSql = useMemo(() => {
    if (!column || column.logicalType !== "numeric") return null;

    return `
      SELECT
        avg(${quotedColumn})::DOUBLE AS mean,
        stddev_samp(${quotedColumn})::DOUBLE AS stddev,
        min(${quotedColumn})::DOUBLE AS min_value,
        quantile_cont(${quotedColumn}, 0.25)::DOUBLE AS p25,
        median(${quotedColumn})::DOUBLE AS median_value,
        quantile_cont(${quotedColumn}, 0.75)::DOUBLE AS p75,
        max(${quotedColumn})::DOUBLE AS max_value
      FROM data
      WHERE ${quotedColumn} IS NOT NULL
    `;
  }, [column, quotedColumn]);

  const categoricalSql = useMemo(() => {
    if (!column || column.logicalType === "numeric") return null;

    return `
      WITH totals AS (
        SELECT count(${quotedColumn})::DOUBLE AS non_null_count
        FROM data
      ),
      top_values AS (
        SELECT
          cast(${quotedColumn} AS VARCHAR) AS value,
          count(*)::BIGINT AS cnt
        FROM data
        WHERE ${quotedColumn} IS NOT NULL
        GROUP BY 1
        ORDER BY cnt DESC
        LIMIT 12
      )
      SELECT
        top_values.value,
        top_values.cnt,
        CASE
          WHEN totals.non_null_count = 0 THEN 0
          ELSE (top_values.cnt::DOUBLE / totals.non_null_count) * 100
        END AS pct
      FROM top_values
      CROSS JOIN totals
      ORDER BY top_values.cnt DESC
    `;
  }, [column, quotedColumn]);

  const categoricalTailSql = useMemo(() => {
    if (!column || column.logicalType === "numeric") return null;

    return `
      SELECT
        greatest((approx_count_distinct(${quotedColumn}) - 12)::BIGINT, 0::BIGINT) AS tail_size
      FROM data
      WHERE ${quotedColumn} IS NOT NULL
    `;
  }, [column, quotedColumn]);

  const countsQuery = useDuckDBQuery(countsSql);
  const numericQuery = useDuckDBQuery(numericSql);
  const categoricalQuery = useDuckDBQuery(categoricalSql);
  const tailQuery = useDuckDBQuery(categoricalTailSql);

  const counts = useMemo(() => {
    const row = countsQuery.data?.rows[0];
    if (!row) {
      return { total: 0, nonNull: 0 };
    }

    return {
      total: asNumber(row[0]),
      nonNull: asNumber(row[1]),
    };
  }, [countsQuery.data]);

  const categoryRows = useMemo<CategoryRow[]>(() => {
    if (!categoricalQuery.data) return [];

    return categoricalQuery.data.rows.map((row) => ({
      value: String(row[0] ?? "NULL"),
      count: asNumber(row[1]),
      percentage: asNumber(row[2]),
    }));
  }, [categoricalQuery.data]);

  const suggestedColumn = useMemo(() => {
    if (!column) return null;

    const overlap = allColumns.find(
      (candidate) =>
        candidate.name !== column.name &&
        candidate.logicalType === "categorical" &&
        candidate.tags.some((tag) => column.tags.includes(tag)),
    );

    if (overlap) return overlap.name;

    return allColumns.find((candidate) => candidate.name !== column.name)?.name ?? null;
  }, [allColumns, column]);

  if (!column) {
    return (
      <aside className="raised-panel">
        <SectionHeader number="02" title="Column Inspector" subtitle="Select a column to inspect." />
      </aside>
    );
  }

  const numericRow = numericQuery.data?.rows[0];
  const numericStats = numericRow
    ? {
        min: asNullableNumber(numericRow[2]),
        p25: asNullableNumber(numericRow[3]),
        median: asNullableNumber(numericRow[4]),
        p75: asNullableNumber(numericRow[5]),
        max: asNullableNumber(numericRow[6]),
        mean: asNullableNumber(numericRow[0]),
        stddev: asNullableNumber(numericRow[1]),
      }
    : null;

  const caveatDefinitions = column.caveatKeys.map((key) => CAVEAT_DEFINITIONS[key]);
  const tailSize = asNumber(tailQuery.data?.rows[0]?.[0] ?? 0, 0);

  const exploreHref = suggestedColumn
    ? `/explore?x=${encodeURIComponent(column.name)}&y=${encodeURIComponent(suggestedColumn)}`
    : "/explore";

  const sqlHref = `/sql?sql=${encodeSql(
    `SELECT ${quotedColumn} AS value, count(*)::BIGINT AS count\nFROM data\nGROUP BY 1\nORDER BY count DESC\nLIMIT 50`,
  )}`;

  return (
    <aside className="raised-panel space-y-5">
      <SectionHeader
        number="02"
        title="Column Inspector"
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span className="mono-value">{column.name}</span>
            <span className="null-badge">{column.logicalType}</span>
            <MissingnessBadge meaning={column.nullMeaning} />
          </span>
        }
      />

      <SampleSizeDisplay total={counts.total} nonNull={counts.nonNull} />

      {countsQuery.error ? <p className="alert alert--error">{countsQuery.error}</p> : null}

      {column.logicalType === "numeric" ? (
        <div>
          <p className="mono-label">Numeric Summary</p>
          {numericStats ? (
            <DataTable
              rows={[
                { label: "Min", value: numericStats.min },
                { label: "P25", value: numericStats.p25 },
                { label: "Median", value: numericStats.median },
                { label: "P75", value: numericStats.p75 },
                { label: "Max", value: numericStats.max },
                { label: "Mean", value: numericStats.mean },
                { label: "Stddev", value: numericStats.stddev },
              ]}
              rowKey={(row) => row.label}
              columns={[
                {
                  id: "metric",
                  header: "Metric",
                  cell: (row) => row.label,
                },
                {
                  id: "value",
                  header: "Value",
                  align: "right",
                  cell: (row) => (row.value == null ? "n/a" : row.value.toFixed(3)),
                },
              ]}
            />
          ) : (
            <p className="section-subtitle">No numeric values available.</p>
          )}
        </div>
      ) : (
        <div>
          <p className="mono-label">Top Values</p>
          <DataTable
            rows={categoryRows}
            rowKey={(row) => row.value}
            columns={[
              {
                id: "value",
                header: "Value",
                cell: (row) => formatValueWithLabel(row.value, column.valueLabels),
              },
              {
                id: "count",
                header: "Count",
                align: "right",
                cell: (row) => formatNumber(row.count),
              },
              {
                id: "pct",
                header: "%",
                align: "right",
                cell: (row) => formatPercent(row.percentage, 2),
              },
            ]}
            emptyMessage="No categorical values available"
          />
          {tailSize > 0 ? (
            <p className="section-subtitle">Additional values beyond top 12: {formatNumber(tailSize)}</p>
          ) : null}
        </div>
      )}

      <div>
        <p className="mono-label">Missingness Context</p>
        <div className="space-y-2">
          <p className="mono-value">Null ratio: {formatPercent(column.nullRatio * 100, 1)}</p>
          <p className="mono-value">Null meaning: <MissingnessBadge meaning={column.nullMeaning} /></p>
        </div>
      </div>

      <div>
        <p className="mono-label">Caveats</p>
        <ScrollArea className={caveatDefinitions.length > 3 ? "max-h-[320px]" : ""}>
          {caveatDefinitions.map((definition) => (
            <article key={definition.key} className="caveat-item">
              <p className="caveat-title">{definition.title}</p>
              <p className="caveat-description">{definition.description}</p>
              <p className="caveat-guidance">{definition.guidance}</p>
            </article>
          ))}
        </ScrollArea>
      </div>

      <div>
        <p className="mono-label">Explore With</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a className="editorial-button" href={exploreHref}>
            Cross-tab
          </a>
          <a className="editorial-button" href={sqlHref}>
            Open in SQL
          </a>
          {column.tags.includes("demographic") ? (
            <a className="editorial-button" href="/profile">
              View in Profile
            </a>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
