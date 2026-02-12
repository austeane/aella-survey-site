import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import type { SchemaData } from "@/lib/api/contracts";
import { getSchema, getStats, runQuery } from "@/lib/client/api";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

interface ProfileSummary {
  totalSize: number;
  cohortSize: number;
  cohortSharePercent: number;
  uniquenessPercentile: number;
  percentileCards: Array<{
    metric: string;
    cohortMedian: number | null;
    globalPercentile: number | null;
  }>;
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function numberOrNull(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function ProfilePage() {
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [valueOptionsByColumn, setValueOptionsByColumn] = useState<Record<string, string[]>>({});

  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getSchema()
      .then((response) => {
        if (cancelled) {
          return;
        }

        setSchema(response.data);

        const demographicColumns = response.data.columns
          .filter((column) => column.tags.includes("demographic") && column.logicalType === "categorical")
          .slice(0, 3)
          .map((column) => column.name);

        setSelectedColumns(demographicColumns);
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setSchemaError(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedColumns.length === 0) {
      return;
    }

    let cancelled = false;

    void Promise.all(
      selectedColumns.map(async (column) => {
        const response = await getStats(column);
        if (response.data.stats.kind !== "categorical") {
          return [column, [] as string[]] as const;
        }

        return [
          column,
          response.data.stats.topValues.map((item) => String(item.value ?? "NULL")),
        ] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) {
          return;
        }

        const nextOptions: Record<string, string[]> = {};
        for (const [column, options] of entries) {
          nextOptions[column] = options;
        }

        setValueOptionsByColumn(nextOptions);
        setSelectedValues((current) => {
          const next: Record<string, string> = {};
          for (const column of selectedColumns) {
            const existing = current[column];
            if (existing && nextOptions[column]?.includes(existing)) {
              next[column] = existing;
            }
          }
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) {
          setValueOptionsByColumn({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedColumns]);

  const availableDemographicColumns = useMemo(() => {
    if (!schema) {
      return [];
    }

    return schema.columns.filter(
      (column) => column.tags.includes("demographic") && column.logicalType === "categorical",
    );
  }, [schema]);

  const filterPairs = useMemo(() => {
    return selectedColumns
      .map((column) => ({ column, value: selectedValues[column] }))
      .filter((item) => Boolean(item.column && item.value));
  }, [selectedColumns, selectedValues]);

  const canRun = filterPairs.length > 0 && !running;

  async function runProfile() {
    if (filterPairs.length === 0) {
      setRunError("Select at least one demographic value before running profile analysis.");
      return;
    }

    setRunning(true);
    setRunError(null);

    const whereClause = `WHERE ${filterPairs
      .map((pair) => `${quoteIdentifier(pair.column)} = ${quoteLiteral(pair.value)}`)
      .join(" AND ")}`;

    try {
      const totalResult = await runQuery({
        sql: "SELECT count(*)::BIGINT AS total_size FROM data",
        limit: 1,
      });
      const cohortResult = await runQuery({
        sql: `SELECT count(*)::BIGINT AS cohort_size FROM data ${whereClause}`,
        limit: 1,
      });

      const totalSize = numberOrNull(totalResult.data.rows[0]?.[0]) ?? 0;
      const cohortSize = numberOrNull(cohortResult.data.rows[0]?.[0]) ?? 0;
      const cohortSharePercent = totalSize > 0 ? (cohortSize / totalSize) * 100 : 0;
      const uniquenessPercentile = Math.max(0, Math.min(100, 100 - cohortSharePercent));

      const metricCandidates = [
        "totalfetishcategory",
        "powerlessnessvariable",
        "opennessvariable",
        "extroversionvariable",
        "neuroticismvariable",
      ].filter((metric) => schema?.columns.some((column) => column.name === metric));

      const percentileCards = await Promise.all(
        metricCandidates.map(async (metric) => {
          const metricSql = `
            WITH cohort AS (
              SELECT quantile_cont(${quoteIdentifier(metric)}, 0.5)::DOUBLE AS cohort_median
              FROM data
              ${whereClause} AND ${quoteIdentifier(metric)} IS NOT NULL
            )
            SELECT
              (SELECT cohort_median FROM cohort) AS cohort_median,
              CASE
                WHEN (SELECT cohort_median FROM cohort) IS NULL THEN NULL
                ELSE (
                  SELECT 100.0 *
                    SUM(CASE WHEN ${quoteIdentifier(metric)} <= (SELECT cohort_median FROM cohort) THEN 1 ELSE 0 END)::DOUBLE /
                    COUNT(*)::DOUBLE
                  FROM data
                  WHERE ${quoteIdentifier(metric)} IS NOT NULL
                )
              END AS percentile
          `;

          const metricResult = await runQuery({
            sql: metricSql,
            limit: 1,
          });

          return {
            metric,
            cohortMedian: numberOrNull(metricResult.data.rows[0]?.[0]),
            globalPercentile: numberOrNull(metricResult.data.rows[0]?.[1]),
          };
        }),
      );

      setSummary({
        totalSize,
        cohortSize,
        cohortSharePercent,
        uniquenessPercentile,
        percentileCards,
      });
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Failed to run profile analysis.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile Builder</h1>
        <p className="text-slate-300">
          Choose demographic answers and compute a people-like-you cohort with percentile summaries.
        </p>
      </header>

      {schemaError ? (
        <section className="rounded-lg border border-red-500/40 bg-red-900/20 p-4 text-red-200">
          Failed to load schema: {schemaError}
        </section>
      ) : null}

      {schema ? (
        <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-lg font-semibold">Profile Inputs</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((slot) => {
              const column = selectedColumns[slot] ?? "";
              const options = valueOptionsByColumn[column] ?? [];

              return (
                <div key={`slot-${slot}`} className="space-y-2 rounded border border-slate-800 bg-slate-950 p-3">
                  <label className="block text-sm text-slate-300">
                    Field {slot + 1}
                    <select
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2"
                      value={column}
                      onChange={(event) => {
                        const next = [...selectedColumns];
                        next[slot] = event.target.value;
                        setSelectedColumns(next.filter(Boolean));
                      }}
                    >
                      <option value="">Select a column</option>
                      {availableDemographicColumns.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm text-slate-300">
                    Value
                    <select
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-2"
                      value={selectedValues[column] ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setSelectedValues((current) => ({
                          ...current,
                          [column]: value,
                        }));
                      }}
                      disabled={!column || options.length === 0}
                    >
                      <option value="">Select a value</option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              void runProfile();
            }}
            disabled={!canRun}
            className="mt-4 rounded border border-slate-700 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? "Running..." : "Build profile"}
          </button>

          {runError ? (
            <p className="mt-4 rounded border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-200">
              {runError}
            </p>
          ) : null}
        </section>
      ) : (
        <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">
          Loading schema metadata...
        </section>
      )}

      {summary ? (
        <section className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-lg font-semibold">People-Like-You Summary</h2>

          <div className="grid gap-3 md:grid-cols-4">
            <SummaryCard label="Dataset Size" value={summary.totalSize.toLocaleString("en-US")} />
            <SummaryCard label="Cohort Size" value={summary.cohortSize.toLocaleString("en-US")} />
            <SummaryCard label="Cohort Share" value={`${summary.cohortSharePercent.toFixed(2)}%`} />
            <SummaryCard
              label="Uniqueness Percentile"
              value={`${summary.uniquenessPercentile.toFixed(2)}%`}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {summary.percentileCards.map((card) => (
              <div key={card.metric} className="rounded border border-slate-800 bg-slate-950 p-3 text-sm">
                <p className="font-medium text-slate-100">{card.metric}</p>
                <p className="mt-2 text-slate-300">
                  Cohort median: {card.cohortMedian == null ? "n/a" : card.cohortMedian.toFixed(3)}
                </p>
                <p className="text-slate-400">
                  Global percentile: {card.globalPercentile == null ? "n/a" : `${card.globalPercentile.toFixed(2)}%`}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-base font-medium text-slate-100">{value}</p>
    </div>
  );
}
