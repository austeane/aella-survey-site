import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { ColumnCombobox } from "@/components/column-combobox";
import { DataTable } from "@/components/data-table";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { MissingnessBadge } from "@/components/missingness-badge";
import { SampleSizeDisplay } from "@/components/sample-size-display";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import type { SchemaData } from "@/lib/api/contracts";
import { getSchema } from "@/lib/client/api";
import { useDuckDB } from "@/lib/duckdb/provider";
import { ColumnNameTooltip } from "@/components/column-name-tooltip";
import { formatValueWithLabel, getColumnDisplayName, stripHashSuffix } from "@/lib/format-labels";
import { formatNumber, formatPercent, asNumber, asNullableNumber } from "@/lib/format";
import { quoteIdentifier } from "@/lib/duckdb/sql-helpers";
import { useDuckDBQuery } from "@/lib/duckdb/use-query";


export const Route = createFileRoute("/data-quality")({
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

const TAG_LABELS: Record<string, string> = {
  demographic: "Demographics",
  ocean: "Personality (Big Five)",
  fetish: "Kinks and interests",
  derived: "Computed scores",
  other: "Other",
};

const LOGICAL_TYPE_LABELS: Record<string, string> = {
  categorical: "Multiple choice",
  numeric: "Number",
  boolean: "Yes/No",
  text: "Text",
  unknown: "Unspecified",
};

function DashboardPage() {
  const { phase } = useDuckDB();
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
        <h1 className="page-title">Data Quality Dashboard</h1>
        <p className="page-subtitle">
          Coverage, missing answers, and question details.
        </p>
        {schema ? (
          <p className="dateline">
            Updated {new Date(schema.dataset.generatedAt).toLocaleDateString("en-US")}
          </p>
        ) : null}
      </header>

      {schemaError ? <section className="alert alert--error">Failed to load schema: {schemaError}</section> : null}

      {schema ? (
        <>
          <section className="stat-grid grid-cols-1 md:grid-cols-3">
            <StatCard label="Respondents" value={formatNumber(schema.dataset.rowCount)} />
            <StatCard label="Questions" value={formatNumber(schema.dataset.columnCount)} />
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
              <SectionHeader number="02" title="Most Missing-Answer Questions" />
              <div className="mt-3">
                <DataTable
                  rows={topMissingColumns}
                  rowKey={(row) => row.name}
                  columns={[
                    {
                      id: "column",
                      header: "Question",
                      cell: (row) => (
                        <div className="space-y-1">
                          <ColumnNameTooltip column={row}>
                            <span>{getColumnDisplayName(row)}</span>
                          </ColumnNameTooltip>
                          {row.displayName ? (
                            <p className="mono-value text-[var(--ink-faded)]">{stripHashSuffix(row.name)}</p>
                          ) : null}
                          <div>
                            <MissingnessBadge meaning={row.nullMeaning} />
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "null",
                      header: "Missing answers",
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
                    { id: "tag", header: "Tag", cell: (row) => TAG_LABELS[row.tag] ?? row.tag },
                    { id: "count", header: "Questions", align: "right", cell: (row) => formatNumber(row.count) },
                  ]}
                />
              </div>
            </div>

            <div>
              <SectionHeader number="04" title="Missing-Answer Distribution" />
              <div className="mt-3">
                <DataTable
                  rows={missingnessHistogram}
                  rowKey={(row) => row.bucket}
                  columns={[
                    { id: "bucket", header: "Range", cell: (row) => row.bucket },
                    { id: "count", header: "Questions", align: "right", cell: (row) => formatNumber(row.count) },
                  ]}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div>
              <SectionHeader number="05" title="Best-Answered Questions" />
              <div className="mt-3">
                <DataTable
                  rows={analysisFriendlyColumns}
                  rowKey={(row) => row.name}
                  columns={[
                    {
                      id: "name",
                      header: "Question",
                      cell: (row) => (
                        <ColumnNameTooltip column={row}>
                          <Link
                            to="/explore"
                            search={{ x: row.name }}
                            className="mono-value"
                            style={{
                              color: "var(--accent)",
                              borderBottom: "1px solid var(--rule-light)",
                            }}
                          >
                            {getColumnDisplayName(row)}
                          </Link>
                        </ColumnNameTooltip>
                      ),
                    },
                    {
                      id: "null",
                      header: "Missing %",
                      align: "right",
                      cell: (row) => formatPercent(row.nullRatio * 100, 1),
                    },
                    {
                      id: "cardinality",
                      header: "Answer choices",
                      align: "right",
                      cell: (row) => formatNumber(row.approxCardinality),
                    },
                  ]}
                />
              </div>
            </div>

            <div>
              <SectionHeader number="06" title="Most-Skipped Questions" />
              <div className="mt-3">
                <DataTable
                  rows={gatedColumns}
                  rowKey={(row) => row.name}
                  columns={[
                    {
                      id: "name",
                      header: "Question",
                      cell: (row) => (
                        <div className="space-y-1">
                          <ColumnNameTooltip column={row}>
                            <span>{getColumnDisplayName(row)}</span>
                          </ColumnNameTooltip>
                          {row.displayName ? (
                            <p className="mono-value text-[var(--ink-faded)]">{stripHashSuffix(row.name)}</p>
                          ) : null}
                          <div>
                            <MissingnessBadge meaning={row.nullMeaning} />
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "null",
                      header: "Missing %",
                      align: "right",
                      cell: (row) => formatPercent(row.nullRatio * 100, 1),
                    },
                  ]}
                />
              </div>
            </div>
          </section>

          <section className="raised-panel space-y-4">
            <SectionHeader number="07" title="Inspect a Question" />

            <label className="editorial-label max-w-[460px]">
              Question
              <ColumnCombobox
                columns={schema.columns}
                value={selectedColumn}
                onValueChange={setSelectedColumn}
                placeholder="Select a column"
              />
            </label>

            {selectedMeta ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ColumnNameTooltip column={selectedMeta}>
                    <span className="mono-value">{getColumnDisplayName(selectedMeta)}</span>
                  </ColumnNameTooltip>
                  {selectedMeta.displayName ? (
                    <span className="mono-value text-[var(--ink-faded)]">({stripHashSuffix(selectedMeta.name)})</span>
                  ) : null}
                  <span className="null-badge">
                    {LOGICAL_TYPE_LABELS[selectedMeta.logicalType] ?? selectedMeta.logicalType}
                  </span>
                  {selectedMeta.nullMeaning && selectedMeta.nullMeaning !== "UNKNOWN" ? (
                    <MissingnessBadge meaning={selectedMeta.nullMeaning} />
                  ) : null}
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
                      { metric: "Spread", value: stats.stddev },
                      { metric: "Min", value: stats.min },
                      { metric: "25th percentile", value: stats.p25 },
                      { metric: "Median", value: stats.median },
                      { metric: "75th percentile", value: stats.p75 },
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
                      {
                        id: "value",
                        header: "Value",
                        cell: (row) =>
                          formatValueWithLabel(
                            String(row.value ?? "NULL"),
                            selectedMeta?.valueLabels,
                            true,
                          ),
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
                  />
                )}
              </>
            ) : null}
          </section>
        </>
      ) : (
        <section className="editorial-panel">
          <LoadingSkeleton variant="panel" phase={phase} title="Loading schema metadata..." />
        </section>
      )}
    </div>
  );
}
