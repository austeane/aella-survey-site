import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DataTable } from "@/components/data-table";
import { SectionHeader } from "@/components/section-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SchemaData } from "@/lib/api/contracts";
import { getSchema } from "@/lib/client/api";

import { useDuckDB } from "@/lib/duckdb/provider";
import { quoteIdentifier, quoteLiteral } from "@/lib/duckdb/sql-helpers";
import { asNumber, formatNumber, formatPercent } from "@/lib/format";
import { addNotebookEntry } from "@/lib/notebook-store";

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
  overIndexing: Array<{
    columnName: string;
    value: string;
    cohortCount: number;
    globalCount: number;
    cohortPct: number;
    globalPct: number;
    ratio: number;
  }>;
}

interface ComparisonResult {
  a: ProfileSummary;
  b: ProfileSummary;
}

interface ComparisonPercentileRow {
  metric: string;
  medianA: number | null;
  medianB: number | null;
  delta: number | null;
}

type Mode = "single" | "compare";

const NONE = "__none__";

type FilterPair = { column: string; value: string };

function getWarning(cohortSize: number) {
  if (cohortSize < 30) {
    return {
      kind: "critical" as const,
      message: "N < 30: Too small for reliable comparisons.",
    };
  }
  if (cohortSize < 100) {
    return {
      kind: "warn" as const,
      message: "N < 100: Treat patterns as unstable.",
    };
  }
  return null;
}

function ProfilePage() {
  const { db } = useDuckDB();
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>("single");

  // Single-cohort state
  const [selectedColumns, setSelectedColumns] = useState<[string, string, string]>(["", "", ""]);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
  const [valueOptionsByColumn, setValueOptionsByColumn] = useState<Record<string, string[]>>({});

  // Compare-cohort state
  const [columnsA, setColumnsA] = useState<[string, string, string]>(["", "", ""]);
  const [valuesA, setValuesA] = useState<Record<string, string>>({});
  const [valueOptionsA, setValueOptionsA] = useState<Record<string, string[]>>({});

  const [columnsB, setColumnsB] = useState<[string, string, string]>(["", "", ""]);
  const [valuesB, setValuesB] = useState<Record<string, string>>({});
  const [valueOptionsB, setValueOptionsB] = useState<Record<string, string[]>>({});

  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [notebookSaved, setNotebookSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getSchema()
      .then((response) => {
        if (cancelled) return;
        setSchema(response.data);

        const demographicColumns = response.data.columns
          .filter((c) => c.tags.includes("demographic") && c.logicalType === "categorical")
          .slice(0, 3)
          .map((c) => c.name);

        const defaults: [string, string, string] = [
          demographicColumns[0] ?? "",
          demographicColumns[1] ?? "",
          demographicColumns[2] ?? "",
        ];

        setSelectedColumns(defaults);
        setColumnsA([...defaults]);
        setColumnsB([...defaults]);
      })
      .catch((error: Error) => {
        if (!cancelled) setSchemaError(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Load value options for single-cohort columns
  useEffect(() => {
    if (!db) return;

    const activeColumns = selectedColumns.filter((column) => Boolean(column));
    if (activeColumns.length === 0) return;

    let cancelled = false;

    void loadValueOptions(activeColumns)
      .then((next) => {
        if (!cancelled) setValueOptionsByColumn(next);
      })
      .catch(() => {
        if (!cancelled) setValueOptionsByColumn({});
      });

    return () => {
      cancelled = true;
    };
  }, [selectedColumns, db]);

  // Load value options for cohort A columns
  useEffect(() => {
    if (!db) return;

    const activeColumns = columnsA.filter((column) => Boolean(column));
    if (activeColumns.length === 0) return;

    let cancelled = false;

    void loadValueOptions(activeColumns)
      .then((next) => {
        if (!cancelled) setValueOptionsA(next);
      })
      .catch(() => {
        if (!cancelled) setValueOptionsA({});
      });

    return () => {
      cancelled = true;
    };
  }, [columnsA, db]);

  // Load value options for cohort B columns
  useEffect(() => {
    if (!db) return;

    const activeColumns = columnsB.filter((column) => Boolean(column));
    if (activeColumns.length === 0) return;

    let cancelled = false;

    void loadValueOptions(activeColumns)
      .then((next) => {
        if (!cancelled) setValueOptionsB(next);
      })
      .catch(() => {
        if (!cancelled) setValueOptionsB({});
      });

    return () => {
      cancelled = true;
    };
  }, [columnsB, db]);

  const loadValueOptions = useCallback(
    async (activeColumns: string[]): Promise<Record<string, string[]>> => {
      if (!db) return {};

      const entries = await Promise.all(
        activeColumns.map(async (column) => {
          const quoted = quoteIdentifier(column);
          const sql = `
            SELECT cast(${quoted} AS VARCHAR) AS value, count(*)::BIGINT AS cnt
            FROM data
            WHERE ${quoted} IS NOT NULL
            GROUP BY 1
            ORDER BY cnt DESC
            LIMIT 20
          `;

          const conn = await db.connect();
          try {
            const result = await conn.query(sql);
            const values: string[] = [];
            for (let i = 0; i < result.numRows; i++) {
              values.push(String(result.getChildAt(0)?.get(i) ?? "NULL"));
            }
            return [column, values] as const;
          } finally {
            await conn.close();
          }
        }),
      );

      const next: Record<string, string[]> = {};
      for (const [column, options] of entries) {
        next[column] = options;
      }
      return next;
    },
    [db],
  );

  const availableDemographicColumns = useMemo(() => {
    if (!schema) return [];
    return schema.columns.filter(
      (c) => c.tags.includes("demographic") && c.logicalType === "categorical",
    );
  }, [schema]);

  const filterPairs = useMemo(() => {
    return selectedColumns
      .map((column) => ({ column, value: selectedValues[column] }))
      .filter((item): item is FilterPair => Boolean(item.column && item.value));
  }, [selectedColumns, selectedValues]);

  const filterPairsA = useMemo(() => {
    return columnsA
      .map((column) => ({ column, value: valuesA[column] }))
      .filter((item): item is FilterPair => Boolean(item.column && item.value));
  }, [columnsA, valuesA]);

  const filterPairsB = useMemo(() => {
    return columnsB
      .map((column) => ({ column, value: valuesB[column] }))
      .filter((item): item is FilterPair => Boolean(item.column && item.value));
  }, [columnsB, valuesB]);

  const canRun = mode === "single"
    ? filterPairs.length > 0 && !running && !!db
    : filterPairsA.length > 0 && filterPairsB.length > 0 && !running && !!db;

  const buildCondition = useCallback((pairs: FilterPair[]) => {
    return pairs
      .map((pair) => `${quoteIdentifier(pair.column)} = ${quoteLiteral(pair.value)}`)
      .join(" AND ");
  }, []);

  const runSingleCohort = useCallback(
    async (condition: string): Promise<ProfileSummary> => {
      if (!db) throw new Error("DuckDB not available");

      const conn = await db.connect();
      try {
        const runSql = async (sql: string) => {
          const result = await conn.query(sql);
          const rows: unknown[][] = [];
          for (let i = 0; i < result.numRows; i++) {
            const row: unknown[] = [];
            for (let c = 0; c < result.schema.fields.length; c++) {
              let val = result.getChildAt(c)?.get(i);
              if (typeof val === "bigint") val = Number(val);
              row.push(val ?? null);
            }
            rows.push(row);
          }
          return rows;
        };

        const sizeRows = await runSql(`
          SELECT
            count(*)::BIGINT AS total_size,
            count(*) FILTER (WHERE ${condition})::BIGINT AS cohort_size
          FROM data
        `);

        const totalSize = asNumber(sizeRows[0]?.[0]);
        const cohortSize = asNumber(sizeRows[0]?.[1]);
        const cohortSharePercent = totalSize > 0 ? (cohortSize / totalSize) * 100 : 0;
        const uniquenessPercentile = Math.max(0, Math.min(100, 100 - cohortSharePercent));

        const metricCandidates = [
          "totalfetishcategory",
          "powerlessnessvariable",
          "opennessvariable",
          "extroversionvariable",
          "neuroticismvariable",
        ].filter((metric) => schema?.columns.some((c) => c.name === metric));

        const percentileCards = await Promise.all(
          metricCandidates.map(async (metric) => {
            const rows = await runSql(`
              WITH cohort AS (
                SELECT quantile_cont(${quoteIdentifier(metric)}, 0.5)::DOUBLE AS cohort_median
                FROM data
                WHERE ${condition} AND ${quoteIdentifier(metric)} IS NOT NULL
              )
              SELECT
                (SELECT cohort_median FROM cohort) AS cohort_median,
                CASE
                  WHEN (SELECT cohort_median FROM cohort) IS NULL THEN NULL
                  ELSE (
                    SELECT
                      100.0 *
                      SUM(CASE WHEN ${quoteIdentifier(metric)} <= (SELECT cohort_median FROM cohort) THEN 1 ELSE 0 END)::DOUBLE /
                      COUNT(*)::DOUBLE
                    FROM data
                    WHERE ${quoteIdentifier(metric)} IS NOT NULL
                  )
                END AS percentile
            `);

            return {
              metric,
              cohortMedian: rows[0]?.[0] == null ? null : Number(rows[0][0]),
              globalPercentile: rows[0]?.[1] == null ? null : Number(rows[0][1]),
            };
          }),
        );

        const candidateCategoricalColumns =
          schema?.columns
            .filter(
              (column) =>
                column.logicalType === "categorical" &&
                (column.tags.includes("demographic") || column.tags.includes("ocean")),
            )
            .slice(0, 30)
            .map((column) => column.name) ?? [];

        const overIndexingRows =
          candidateCategoricalColumns.length === 0
            ? []
            : await runSql(`
                WITH counts AS (
                  ${candidateCategoricalColumns
                    .map((columnName) => {
                      const quoted = quoteIdentifier(columnName);
                      return `
                        SELECT
                          ${quoteLiteral(columnName)} AS column_name,
                          cast(${quoted} AS VARCHAR) AS value,
                          SUM(CASE WHEN ${condition} THEN 1 ELSE 0 END)::DOUBLE AS cohort_count,
                          COUNT(*)::DOUBLE AS global_count
                        FROM data
                        WHERE ${quoted} IS NOT NULL
                        GROUP BY 1, 2
                      `;
                    })
                    .join(" UNION ALL ")}
                ),
                sizes AS (
                  SELECT
                    count(*) FILTER (WHERE ${condition})::DOUBLE AS cohort_size,
                    count(*)::DOUBLE AS global_size
                  FROM data
                ),
                scored AS (
                  SELECT
                    counts.column_name,
                    counts.value,
                    counts.cohort_count,
                    counts.global_count,
                    CASE WHEN sizes.cohort_size = 0 THEN 0 ELSE counts.cohort_count / sizes.cohort_size END AS cohort_pct,
                    CASE WHEN sizes.global_size = 0 THEN 0 ELSE counts.global_count / sizes.global_size END AS global_pct
                  FROM counts
                  CROSS JOIN sizes
                ),
                ranked AS (
                  SELECT
                    column_name,
                    value,
                    cohort_count,
                    global_count,
                    cohort_pct,
                    global_pct,
                    CASE WHEN global_pct <= 0 THEN NULL ELSE cohort_pct / global_pct END AS ratio
                  FROM scored
                )
                SELECT
                  column_name,
                  value,
                  cohort_count,
                  global_count,
                  cohort_pct,
                  global_pct,
                  ratio
                FROM ranked
                WHERE cohort_count >= 30
                  AND global_count >= 30
                  AND ratio IS NOT NULL
                ORDER BY ratio DESC, cohort_count DESC
                LIMIT 8
              `);

        const overIndexing = overIndexingRows.map((row) => ({
          columnName: String(row[0] ?? ""),
          value: String(row[1] ?? ""),
          cohortCount: asNumber(row[2]),
          globalCount: asNumber(row[3]),
          cohortPct: asNumber(row[4]) * 100,
          globalPct: asNumber(row[5]) * 100,
          ratio: asNumber(row[6]),
        }));

        return {
          totalSize,
          cohortSize,
          cohortSharePercent,
          uniquenessPercentile,
          percentileCards,
          overIndexing,
        };
      } finally {
        await conn.close();
      }
    },
    [db, schema],
  );

  const runProfile = useCallback(async () => {
    if (mode === "single") {
      if (filterPairs.length === 0 || !db) {
        setRunError("Select at least one demographic value before running profile analysis.");
        return;
      }

      setRunning(true);
      setRunError(null);
      setComparison(null);

      try {
        const condition = buildCondition(filterPairs);
        const result = await runSingleCohort(condition);
        setSummary(result);
      } catch (error) {
        setRunError(error instanceof Error ? error.message : "Failed to run profile analysis.");
      } finally {
        setRunning(false);
      }
    } else {
      if (filterPairsA.length === 0 || filterPairsB.length === 0 || !db) {
        setRunError("Select at least one demographic value for each cohort.");
        return;
      }

      setRunning(true);
      setRunError(null);
      setSummary(null);

      try {
        const conditionA = buildCondition(filterPairsA);
        const conditionB = buildCondition(filterPairsB);
        const [a, b] = await Promise.all([
          runSingleCohort(conditionA),
          runSingleCohort(conditionB),
        ]);
        setComparison({ a, b });
      } catch (error) {
        setRunError(error instanceof Error ? error.message : "Failed to run comparison analysis.");
      } finally {
        setRunning(false);
      }
    }
  }, [mode, db, filterPairs, filterPairsA, filterPairsB, buildCondition, runSingleCohort]);

  const warning = useMemo(() => {
    if (!summary) return null;
    return getWarning(summary.cohortSize);
  }, [summary]);

  const comparisonPercentileRows = useMemo((): ComparisonPercentileRow[] => {
    if (!comparison) return [];
    const { a, b } = comparison;

    const metricsSet = new Set([
      ...a.percentileCards.map((c) => c.metric),
      ...b.percentileCards.map((c) => c.metric),
    ]);

    return Array.from(metricsSet).map((metric) => {
      const cardA = a.percentileCards.find((c) => c.metric === metric);
      const cardB = b.percentileCards.find((c) => c.metric === metric);
      const medianA = cardA?.cohortMedian ?? null;
      const medianB = cardB?.cohortMedian ?? null;
      const delta = medianA != null && medianB != null ? medianB - medianA : null;
      return { metric, medianA, medianB, delta };
    });
  }, [comparison]);

  const renderFilterSlots = (
    columns: [string, string, string],
    setColumns: React.Dispatch<React.SetStateAction<[string, string, string]>>,
    values: Record<string, string>,
    setValues: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    valueOptions: Record<string, string[]>,
  ) => (
    <div className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((slot) => {
        const column = columns[slot] ?? "";
        const options = valueOptions[column] ?? [];

        return (
          <div key={`slot-${slot}`} className="space-y-2 border border-[var(--rule)] bg-[var(--paper)] p-3">
            <label className="editorial-label">
              Field {slot + 1}
              <Select
                value={column || NONE}
                onValueChange={(value) => {
                  const resolved = value === NONE ? "" : value;
                  const next = [...columns] as [string, string, string];
                  next[slot] = resolved;
                  setColumns(next);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {availableDemographicColumns.map((item) => (
                    <SelectItem key={item.name} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="editorial-label">
              Value
              <Select
                value={values[column] || NONE}
                onValueChange={(value) => {
                  const resolved = value === NONE ? "" : value;
                  setValues((current) => ({
                    ...current,
                    [column]: resolved,
                  }));
                }}
                disabled={!column || options.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>
        );
      })}
    </div>
  );

  const renderWarningBanner = (cohortSize: number) => {
    const w = getWarning(cohortSize);
    if (!w) return null;
    return (
      <p className={`alert ${w.kind === "critical" ? "alert--critical" : "alert--warn"}`}>
        {w.message}
      </p>
    );
  };

  const saveToNotebook = useCallback(() => {
    const activeSummary = mode === "single" ? summary : null;
    const activeComparison = mode === "compare" ? comparison : null;

    if (!activeSummary && !activeComparison) return;

    const filters = mode === "single" ? filterPairs : [...filterPairsA, ...filterPairsB];
    const filterDesc = filters.map((f) => `${f.column}=${f.value}`).join(", ");

    addNotebookEntry({
      title: `Profile: ${filterDesc}`,
      queryDefinition: {
        type: "profile",
        params: {
          mode,
          ...(mode === "single" ? { filters: filterPairs } : { filtersA: filterPairsA, filtersB: filterPairsB }),
        },
      },
      resultsSnapshot: {
        summary: activeSummary
          ? {
              cohortSize: activeSummary.cohortSize,
              cohortShare: activeSummary.cohortSharePercent,
              topOverIndexing: activeSummary.overIndexing.slice(0, 5).map((o) => `${o.columnName}=${o.value} (${o.ratio.toFixed(1)}x)`),
            }
          : activeComparison
            ? {
                cohortA: activeComparison.a.cohortSize,
                cohortB: activeComparison.b.cohortSize,
              }
            : {},
      },
      notes: "",
    });

    setNotebookSaved(true);
    setTimeout(() => setNotebookSaved(false), 2000);
  }, [mode, summary, comparison, filterPairs, filterPairsA, filterPairsB]);

  const deltaDirection = (delta: number): string => {
    if (delta > 0) return "higher";
    if (delta < 0) return "lower";
    return "equal";
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">Profile Builder</h1>
        <p className="page-subtitle">Define a demographic cohort and see what over-indexes against the full dataset.</p>
      </header>

      {schemaError ? <section className="alert alert--error">Failed to load schema: {schemaError}</section> : null}

      {schema ? (
        <section className="raised-panel space-y-4">
          <SectionHeader number="01" title="Profile Inputs" />

          <div className="flex gap-0 border border-[var(--rule)]" style={{ width: "fit-content" }}>
            <button
              type="button"
              className={`px-4 py-2 text-[0.75rem] tracking-[0.08em] uppercase font-['JetBrains_Mono',ui-monospace,monospace] border-r border-[var(--rule)] transition-colors ${
                mode === "single"
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "bg-[var(--paper)] text-[var(--ink)] hover:text-[var(--accent-hover)]"
              }`}
              onClick={() => {
                setMode("single");
                setComparison(null);
                setRunError(null);
              }}
            >
              Single Cohort
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-[0.75rem] tracking-[0.08em] uppercase font-['JetBrains_Mono',ui-monospace,monospace] transition-colors ${
                mode === "compare"
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "bg-[var(--paper)] text-[var(--ink)] hover:text-[var(--accent-hover)]"
              }`}
              onClick={() => {
                setMode("compare");
                setSummary(null);
                setRunError(null);
              }}
            >
              Compare Cohorts
            </button>
          </div>

          {mode === "single" ? (
            renderFilterSlots(
              selectedColumns,
              setSelectedColumns,
              selectedValues,
              setSelectedValues,
              valueOptionsByColumn,
            )
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3 border border-[var(--rule)] p-4">
                <p className="mono-label" style={{ fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Cohort A
                </p>
                {renderFilterSlots(columnsA, setColumnsA, valuesA, setValuesA, valueOptionsA)}
              </div>
              <div className="space-y-3 border border-[var(--rule)] p-4">
                <p className="mono-label" style={{ fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Cohort B
                </p>
                {renderFilterSlots(columnsB, setColumnsB, valuesB, setValuesB, valueOptionsB)}
              </div>
            </div>
          )}

          <Button
            type="button"
            onClick={() => {
              void runProfile();
            }}
            disabled={!canRun}
            variant="default"
          >
            {running
              ? "Running..."
              : mode === "single"
                ? "Build Profile"
                : "Compare"}
          </Button>

          {runError ? <p className="alert alert--error">{runError}</p> : null}
        </section>
      ) : (
        <section className="editorial-panel">Loading schema metadata...</section>
      )}

      {/* --- Single cohort results --- */}
      {summary ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader number="02" title="People-Like-You Summary" />
            <button type="button" className="editorial-button" onClick={saveToNotebook}>
              {notebookSaved ? "Saved!" : "Add to Notebook"}
            </button>
          </div>

          <div className="stat-grid grid-cols-1 md:grid-cols-4">
            <StatCard label="Dataset Size" value={formatNumber(summary.totalSize)} />
            <StatCard label="Cohort Size" value={formatNumber(summary.cohortSize)} />
            <StatCard
              label="Cohort Share"
              value={formatPercent(summary.cohortSharePercent, 2)}
              note={`N = ${formatNumber(summary.cohortSize)}`}
            />
            <StatCard
              label="Uniqueness Percentile"
              value={formatPercent(summary.uniquenessPercentile, 2)}
              note={`N = ${formatNumber(summary.cohortSize)}`}
            />
          </div>

          {warning ? (
            <p className={`alert ${warning.kind === "critical" ? "alert--critical" : "alert--warn"}`}>
              {warning.message}
            </p>
          ) : null}

          <div className="raised-panel space-y-3">
            <SectionHeader number="03" title="Percentile Metrics" />
            <DataTable
              rows={summary.percentileCards}
              rowKey={(row) => row.metric}
              columns={[
                { id: "metric", header: "Metric", cell: (row) => row.metric },
                {
                  id: "cohort",
                  header: "Cohort Median",
                  align: "right",
                  cell: (row) => row.cohortMedian == null ? "n/a" : row.cohortMedian.toFixed(3),
                },
                {
                  id: "global",
                  header: "Global Percentile",
                  align: "right",
                  cell: (row) => row.globalPercentile == null ? "n/a" : formatPercent(row.globalPercentile, 2),
                },
                {
                  id: "n",
                  header: "N",
                  align: "right",
                  cell: () => formatNumber(summary.cohortSize),
                },
              ]}
            />
          </div>

          <div className="raised-panel space-y-3">
            <SectionHeader number="04" title="Top Over-Indexing Signals" />
            <DataTable
              rows={summary.overIndexing}
              rowKey={(row, index) => `${row.columnName}-${row.value}-${index}`}
              columns={[
                { id: "column", header: "Column", cell: (row) => row.columnName },
                { id: "value", header: "Value", cell: (row) => row.value },
                {
                  id: "ratio",
                  header: "Lift",
                  align: "right",
                  cell: (row) => `${row.ratio.toFixed(2)}x`,
                },
                {
                  id: "cohort",
                  header: "Cohort % (N)",
                  align: "right",
                  cell: (row) =>
                    `${formatPercent(row.cohortPct, 2)} (N=${formatNumber(row.cohortCount)})`,
                },
                {
                  id: "global",
                  header: "Global % (N)",
                  align: "right",
                  cell: (row) =>
                    `${formatPercent(row.globalPct, 2)} (N=${formatNumber(row.globalCount)})`,
                },
              ]}
              emptyMessage="No over-indexing values met the N >= 30 thresholds"
            />
          </div>
        </section>
      ) : null}

      {/* --- Comparison results --- */}
      {comparison ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader number="02" title="Cohort Comparison" />
            <button type="button" className="editorial-button" onClick={saveToNotebook}>
              {notebookSaved ? "Saved!" : "Add to Notebook"}
            </button>
          </div>

          {/* Side-by-side cohort Ns */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="mono-label" style={{ fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Cohort A
              </p>
              <div className="stat-grid grid-cols-1 md:grid-cols-3">
                <StatCard label="Dataset Size" value={formatNumber(comparison.a.totalSize)} />
                <StatCard label="Cohort Size" value={formatNumber(comparison.a.cohortSize)} />
                <StatCard
                  label="Cohort Share"
                  value={formatPercent(comparison.a.cohortSharePercent, 2)}
                  note={`N = ${formatNumber(comparison.a.cohortSize)}`}
                />
              </div>
              {renderWarningBanner(comparison.a.cohortSize)}
            </div>
            <div className="space-y-2">
              <p className="mono-label" style={{ fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Cohort B
              </p>
              <div className="stat-grid grid-cols-1 md:grid-cols-3">
                <StatCard label="Dataset Size" value={formatNumber(comparison.b.totalSize)} />
                <StatCard label="Cohort Size" value={formatNumber(comparison.b.cohortSize)} />
                <StatCard
                  label="Cohort Share"
                  value={formatPercent(comparison.b.cohortSharePercent, 2)}
                  note={`N = ${formatNumber(comparison.b.cohortSize)}`}
                />
              </div>
              {renderWarningBanner(comparison.b.cohortSize)}
            </div>
          </div>

          {/* Percentile comparison with deltas */}
          <div className="raised-panel space-y-3">
            <SectionHeader number="03" title="Median Comparison" />
            {comparison.a.cohortSize < 30 || comparison.b.cohortSize < 30 ? (
              <p className="alert alert--critical">
                One or both cohorts have N &lt; 30. Delta values are unreliable at this sample size.
              </p>
            ) : null}
            <DataTable
              rows={comparisonPercentileRows}
              rowKey={(row) => row.metric}
              columns={[
                { id: "metric", header: "Metric", cell: (row) => row.metric },
                {
                  id: "medianA",
                  header: "Cohort A Median",
                  align: "right",
                  cell: (row) => row.medianA == null ? "n/a" : row.medianA.toFixed(3),
                },
                {
                  id: "medianB",
                  header: "Cohort B Median",
                  align: "right",
                  cell: (row) => row.medianB == null ? "n/a" : row.medianB.toFixed(3),
                },
                {
                  id: "delta",
                  header: "Delta (B - A)",
                  align: "right",
                  cell: (row) => {
                    if (comparison.a.cohortSize < 30 || comparison.b.cohortSize < 30) {
                      return "n/a (N<30)";
                    }
                    if (row.delta == null) return "n/a";
                    const sign = row.delta > 0 ? "+" : "";
                    return `${sign}${row.delta.toFixed(3)} (${deltaDirection(row.delta)})`;
                  },
                },
                {
                  id: "nA",
                  header: "N (A)",
                  align: "right",
                  cell: () => formatNumber(comparison.a.cohortSize),
                },
                {
                  id: "nB",
                  header: "N (B)",
                  align: "right",
                  cell: () => formatNumber(comparison.b.cohortSize),
                },
              ]}
            />
          </div>

          {/* Over-indexing side by side */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="raised-panel space-y-3">
              <SectionHeader number="04a" title="Cohort A Over-Indexing" />
              <DataTable
                rows={comparison.a.overIndexing}
                rowKey={(row, index) => `a-${row.columnName}-${row.value}-${index}`}
                columns={[
                  { id: "column", header: "Column", cell: (row) => row.columnName },
                  { id: "value", header: "Value", cell: (row) => row.value },
                  {
                    id: "ratio",
                    header: "Lift",
                    align: "right",
                    cell: (row) => `${row.ratio.toFixed(2)}x`,
                  },
                  {
                    id: "cohort",
                    header: "Cohort % (N)",
                    align: "right",
                    cell: (row) =>
                      `${formatPercent(row.cohortPct, 2)} (N=${formatNumber(row.cohortCount)})`,
                  },
                ]}
                emptyMessage="No over-indexing values met the N >= 30 thresholds"
              />
            </div>
            <div className="raised-panel space-y-3">
              <SectionHeader number="04b" title="Cohort B Over-Indexing" />
              <DataTable
                rows={comparison.b.overIndexing}
                rowKey={(row, index) => `b-${row.columnName}-${row.value}-${index}`}
                columns={[
                  { id: "column", header: "Column", cell: (row) => row.columnName },
                  { id: "value", header: "Value", cell: (row) => row.value },
                  {
                    id: "ratio",
                    header: "Lift",
                    align: "right",
                    cell: (row) => `${row.ratio.toFixed(2)}x`,
                  },
                  {
                    id: "cohort",
                    header: "Cohort % (N)",
                    align: "right",
                    cell: (row) =>
                      `${formatPercent(row.cohortPct, 2)} (N=${formatNumber(row.cohortCount)})`,
                  },
                ]}
                emptyMessage="No over-indexing values met the N >= 30 thresholds"
              />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
