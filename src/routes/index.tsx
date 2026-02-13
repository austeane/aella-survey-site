import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/data-table";
import { MissingnessBadge } from "@/components/missingness-badge";
import { SampleSizeDisplay } from "@/components/sample-size-display";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SchemaData } from "@/lib/api/contracts";
import { getSchema } from "@/lib/client/api";
import { formatNumber, formatPercent, asNumber, asNullableNumber } from "@/lib/format";
import { quoteIdentifier } from "@/lib/duckdb/sql-helpers";
import { useDuckDBQuery } from "@/lib/duckdb/use-query";
import { shouldSuppressCell } from "@/lib/cell-hygiene";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

interface MissingnessBucket {
  label: string;
  min: number;
  max: number;
}

const MISSINGNESS_BUCKETS: MissingnessBucket[] = [
  { label: "0-10%", min: 0, max: 0.1 },
  { label: "10-25%", min: 0.1, max: 0.25 },
  { label: "25-50%", min: 0.25, max: 0.5 },
  { label: "50-75%", min: 0.5, max: 0.75 },
  { label: "75-100%", min: 0.75, max: 1.01 },
];

function DashboardPage() {
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    void getSchema()
      .then((response) => {
        if (cancelled) return;
        setSchema(response.data);
        const preferred = response.data.columns.find((column) => column.name === "straightness");
        setSelectedColumn(preferred?.name ?? response.data.columns[0]?.name ?? "");
      })
      .catch((error: Error) => {
        if (!cancelled) setSchemaError(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedMeta = useMemo(() => {
    if (!schema || !selectedColumn) return null;
    return schema.columns.find((c) => c.name === selectedColumn) ?? null;
  }, [schema, selectedColumn]);

  const isNumeric = selectedMeta?.logicalType === "numeric";
  const quoted = selectedColumn ? quoteIdentifier(selectedColumn) : "";

  const countsSql = useMemo(() => {
    if (!selectedColumn) return null;
    return `
      SELECT
        count(*)::BIGINT AS total_count,
        count(${quoted})::BIGINT AS non_null_count,
        (count(*) - count(${quoted}))::BIGINT AS null_count
      FROM data
    `;
  }, [selectedColumn, quoted]);

  const numericSql = useMemo(() => {
    if (!selectedColumn || !isNumeric) return null;
    return `
      SELECT
        avg(${quoted})::DOUBLE AS mean,
        stddev_samp(${quoted})::DOUBLE AS stddev,
        min(${quoted})::DOUBLE AS min_val,
        quantile_cont(${quoted}, 0.25)::DOUBLE AS p25,
        median(${quoted})::DOUBLE AS median_val,
        quantile_cont(${quoted}, 0.75)::DOUBLE AS p75,
        max(${quoted})::DOUBLE AS max_val
      FROM data
      WHERE ${quoted} IS NOT NULL
    `;
  }, [selectedColumn, isNumeric, quoted]);

  const categoricalSql = useMemo(() => {
    if (!selectedColumn || isNumeric) return null;
    return `
      SELECT
        cast(${quoted} AS VARCHAR) AS value,
        count(*)::BIGINT AS cnt
      FROM data
      WHERE ${quoted} IS NOT NULL
      GROUP BY 1
      ORDER BY cnt DESC
      LIMIT 12
    `;
  }, [selectedColumn, isNumeric, quoted]);

  const countsQuery = useDuckDBQuery(countsSql);
  const numericQuery = useDuckDBQuery(numericSql);
  const categoricalQuery = useDuckDBQuery(categoricalSql);

  const statsLoading = countsQuery.loading || (isNumeric ? numericQuery.loading : categoricalQuery.loading);
  const statsError = countsQuery.error ?? (isNumeric ? numericQuery.error : categoricalQuery.error);

  const stats = useMemo(() => {
    if (!countsQuery.data) return null;
    const row = countsQuery.data.rows[0];
    if (!row) return null;

    const totalCount = asNumber(row[0]);
    const nonNullCount = asNumber(row[1]);
    const nullCount = asNumber(row[2]);
    const logicalType = selectedMeta?.logicalType ?? "unknown";

    if (isNumeric && numericQuery.data?.rows[0]) {
      const nr = numericQuery.data.rows[0];
      return {
        logicalType,
        totalCount,
        nonNullCount,
        nullCount,
        kind: "numeric" as const,
        mean: asNullableNumber(nr[0]),
        stddev: asNullableNumber(nr[1]),
        min: asNullableNumber(nr[2]),
        p25: asNullableNumber(nr[3]),
        median: asNullableNumber(nr[4]),
        p75: asNullableNumber(nr[5]),
        max: asNullableNumber(nr[6]),
      };
    }

    if (!isNumeric && categoricalQuery.data) {
      const topValues = categoricalQuery.data.rows.map((r) => {
        const count = asNumber(r[1]);
        return {
          value: (r[0] ?? null) as string | number | boolean | null,
          count,
          percentage: nonNullCount > 0 ? (count / nonNullCount) * 100 : 0,
        };
      });

      return {
        logicalType,
        totalCount,
        nonNullCount,
        nullCount,
        kind: "categorical" as const,
        topValues,
      };
    }

    return null;
  }, [countsQuery.data, numericQuery.data, categoricalQuery.data, isNumeric, selectedMeta]);

  const topMissingColumns = useMemo(() => {
    if (!schema) return [];
    return [...schema.columns].sort((a, b) => b.nullRatio - a.nullRatio).slice(0, 8);
  }, [schema]);

  const tagBreakdown = useMemo(() => {
    if (!schema) return [];

    const counts = new Map<string, number>();
    for (const column of schema.columns) {
      for (const tag of column.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [schema]);

  const missingnessHistogram = useMemo(() => {
    if (!schema) return [];
    return MISSINGNESS_BUCKETS.map((bucket) => {
      const count = schema.columns.filter(
        (column) => column.nullRatio >= bucket.min && column.nullRatio < bucket.max,
      ).length;
      return {
        bucket: bucket.label,
        count,
      };
    });
  }, [schema]);

  const analysisFriendlyColumns = useMemo(() => {
    if (!schema) return [];
    return [...schema.columns]
      .sort((left, right) => {
        if (left.nullRatio !== right.nullRatio) {
          return left.nullRatio - right.nullRatio;
        }
        return left.approxCardinality - right.approxCardinality;
      })
      .slice(0, 10);
  }, [schema]);

  const gatedColumns = useMemo(() => {
    if (!schema) return [];
    return schema.columns
      .filter((column) => column.caveatKeys.includes("gated_missingness"))
      .sort((left, right) => right.nullRatio - left.nullRatio)
      .slice(0, 10);
  }, [schema]);

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Dataset Dashboard</h1>
        <p className="page-subtitle">
          Dataset shape, caveats, missingness, and high-signal variables.
        </p>
        <p className="dateline">Updated {new Date().toLocaleDateString("en-US")}</p>
      </header>

      {schemaError ? <section className="alert alert--error">Failed to load schema: {schemaError}</section> : null}

      {schema ? (
        <>
          <section className="stat-grid grid-cols-1 md:grid-cols-3">
            <StatCard label="Rows" value={formatNumber(schema.dataset.rowCount)} />
            <StatCard label="Columns" value={formatNumber(schema.dataset.columnCount)} />
            <StatCard
              label="Generated"
              value={new Date(schema.dataset.generatedAt).toLocaleDateString("en-US")}
              note={new Date(schema.dataset.generatedAt).toLocaleTimeString("en-US")}
            />
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div>
              <SectionHeader number="01" title="Global Caveats" />
              <div className="mt-3">
                {schema.caveats.global.map((key) => {
                  const definition = schema.caveats.definitions.find((item) => item.key === key);
                  if (!definition) return null;

                  return (
                    <article key={key} className="caveat-item">
                      <p className="caveat-title">{definition.title}</p>
                      <p className="caveat-description">{definition.description}</p>
                      <p className="caveat-guidance">{definition.guidance}</p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionHeader number="02" title="Highest Missingness Columns" />
              <div className="mt-3">
                <DataTable
                  rows={topMissingColumns}
                  rowKey={(row) => row.name}
                  columns={[
                    {
                      id: "column",
                      header: "Column",
                      cell: (row) => (
                        <div className="space-y-1">
                          <span>{row.name}</span>
                          <div>
                            <MissingnessBadge meaning={row.nullMeaning} />
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "null",
                      header: "Null Ratio",
                      align: "right",
                      cell: (row) => formatPercent(row.nullRatio * 100, 1),
                    },
                  ]}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div>
              <SectionHeader number="03" title="Tag Breakdown" />
              <div className="mt-3">
                <DataTable
                  rows={tagBreakdown}
                  rowKey={(row) => row.tag}
                  columns={[
                    { id: "tag", header: "Tag", cell: (row) => row.tag },
                    { id: "count", header: "Columns", align: "right", cell: (row) => formatNumber(row.count) },
                  ]}
                />
              </div>
            </div>

            <div>
              <SectionHeader number="04" title="Missingness Histogram" />
              <div className="mt-3">
                <DataTable
                  rows={missingnessHistogram}
                  rowKey={(row) => row.bucket}
                  columns={[
                    { id: "bucket", header: "Bucket", cell: (row) => row.bucket },
                    { id: "count", header: "Columns", align: "right", cell: (row) => formatNumber(row.count) },
                  ]}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div>
              <SectionHeader number="05" title="Most Analysis-Friendly Columns" />
              <div className="mt-3">
                <DataTable
                  rows={analysisFriendlyColumns}
                  rowKey={(row) => row.name}
                  columns={[
                    { id: "name", header: "Column", cell: (row) => row.name },
                    {
                      id: "null",
                      header: "Null %",
                      align: "right",
                      cell: (row) => formatPercent(row.nullRatio * 100, 1),
                    },
                    {
                      id: "cardinality",
                      header: "Cardinality",
                      align: "right",
                      cell: (row) => formatNumber(row.approxCardinality),
                    },
                  ]}
                />
              </div>
            </div>

            <div>
              <SectionHeader number="06" title="Most Gated Columns" />
              <div className="mt-3">
                <DataTable
                  rows={gatedColumns}
                  rowKey={(row) => row.name}
                  columns={[
                    {
                      id: "name",
                      header: "Column",
                      cell: (row) => (
                        <div className="space-y-1">
                          <span>{row.name}</span>
                          <div>
                            <MissingnessBadge meaning={row.nullMeaning} />
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "null",
                      header: "Null %",
                      align: "right",
                      cell: (row) => formatPercent(row.nullRatio * 100, 1),
                    },
                  ]}
                />
              </div>
            </div>
          </section>

          <section className="raised-panel space-y-4">
            <SectionHeader number="07" title="Column Inspector (Inline)" />

            <label className="editorial-label max-w-[460px]">
              Column
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
                <SelectContent>
                  {schema.columns.map((column) => (
                    <SelectItem key={column.name} value={column.name}>
                      {column.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            {selectedMeta ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono-value">{selectedMeta.name}</span>
                  <span className="null-badge">{selectedMeta.logicalType}</span>
                  <MissingnessBadge meaning={selectedMeta.nullMeaning} />
                </div>
                {stats ? (
                  <SampleSizeDisplay total={stats.totalCount} nonNull={stats.nonNullCount} used={stats.nonNullCount} />
                ) : null}
              </div>
            ) : null}

            {statsLoading ? <p className="section-subtitle">Loading stats...</p> : null}
            {statsError ? <p className="alert alert--error">{statsError}</p> : null}

            {stats && !statsLoading ? (
              <>
                {stats.kind === "numeric" ? (
                  <DataTable
                    rows={[
                      { metric: "Mean", value: stats.mean },
                      { metric: "Stddev", value: stats.stddev },
                      { metric: "Min", value: stats.min },
                      { metric: "P25", value: stats.p25 },
                      { metric: "Median", value: stats.median },
                      { metric: "P75", value: stats.p75 },
                      { metric: "Max", value: stats.max },
                    ]}
                    rowKey={(row) => row.metric}
                    columns={[
                      { id: "metric", header: "Metric", cell: (row) => row.metric },
                      {
                        id: "value",
                        header: "Value",
                        align: "right",
                        cell: (row) => (row.value == null ? "n/a" : row.value.toFixed(3)),
                      },
                    ]}
                  />
                ) : (
                  <DataTable
                    rows={stats.topValues}
                    rowKey={(row) => String(row.value ?? "NULL")}
                    columns={[
                      { id: "value", header: "Value", cell: (row) => String(row.value ?? "NULL") },
                      {
                        id: "count",
                        header: "Count",
                        align: "right",
                        cell: (row) =>
                          shouldSuppressCell(row.count) ? "[suppressed]" : formatNumber(row.count),
                      },
                      {
                        id: "pct",
                        header: "%",
                        align: "right",
                        cell: (row) =>
                          shouldSuppressCell(row.count) ? "[suppressed]" : formatPercent(row.percentage, 2),
                      },
                    ]}
                  />
                )}
              </>
            ) : null}
          </section>
        </>
      ) : (
        <section className="editorial-panel">Loading schema metadata...</section>
      )}
    </div>
  );
}
