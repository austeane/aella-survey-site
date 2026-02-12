import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import type { SchemaData, StatsData } from "@/lib/api/contracts";
import { getSchema, getStats } from "@/lib/client/api";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function DashboardPage() {
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>("");

  const [stats, setStats] = useState<StatsData | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getSchema()
      .then((response) => {
        if (cancelled) {
          return;
        }

        setSchema(response.data);
        const preferred = response.data.columns.find((column) => column.name === "straightness");
        setSelectedColumn(preferred?.name ?? response.data.columns[0]?.name ?? "");
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
    if (!selectedColumn) {
      return;
    }

    let cancelled = false;
    setStatsLoading(true);
    setStatsError(null);

    void getStats(selectedColumn)
      .then((response) => {
        if (!cancelled) {
          setStats(response.data);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setStatsError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStatsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedColumn]);

  const topMissingColumns = useMemo(() => {
    if (!schema) {
      return [];
    }

    return [...schema.columns]
      .sort((a, b) => b.nullRatio - a.nullRatio)
      .slice(0, 8);
  }, [schema]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dataset Dashboard</h1>
        <p className="text-slate-300">
          Quick view of dataset shape, caveats, and single-column profile stats.
        </p>
      </header>

      {schemaError ? (
        <section className="rounded-lg border border-red-500/40 bg-red-900/20 p-4 text-red-200">
          Failed to load schema: {schemaError}
        </section>
      ) : null}

      {schema ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-sm text-slate-400">Rows</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(schema.dataset.rowCount)}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-sm text-slate-400">Columns</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(schema.dataset.columnCount)}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-sm text-slate-400">Generated</p>
              <p className="mt-2 text-sm font-medium">
                {new Date(schema.dataset.generatedAt).toLocaleString()}
              </p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
              <h2 className="text-lg font-semibold">Global Caveats</h2>
              <div className="mt-4 space-y-3 text-sm">
                {schema.caveats.global.map((key) => {
                  const definition = schema.caveats.definitions.find((item) => item.key === key);
                  if (!definition) {
                    return null;
                  }

                  return (
                    <div key={key} className="rounded-md border border-slate-700 p-3">
                      <p className="font-medium text-slate-100">{definition.title}</p>
                      <p className="mt-1 text-slate-300">{definition.description}</p>
                      <p className="mt-1 text-xs text-slate-400">{definition.guidance}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
              <h2 className="text-lg font-semibold">Highest Missingness Columns</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="pb-2">Column</th>
                      <th className="pb-2">Null Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMissingColumns.map((column) => (
                      <tr key={column.name} className="border-t border-slate-800/80">
                        <td className="py-2 pr-3 align-top text-slate-200">{column.name}</td>
                        <td className="py-2 text-slate-300">{percent(column.nullRatio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold">Column Stats</h2>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <span>Column</span>
                <select
                  className="rounded border border-slate-700 bg-slate-950 px-2 py-1"
                  value={selectedColumn}
                  onChange={(event) => setSelectedColumn(event.target.value)}
                >
                  {schema.columns.map((column) => (
                    <option key={column.name} value={column.name}>
                      {column.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {statsLoading ? <p className="mt-4 text-sm text-slate-400">Loading stats...</p> : null}
            {statsError ? (
              <p className="mt-4 rounded border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-200">
                {statsError}
              </p>
            ) : null}

            {stats && !statsLoading ? (
              <div className="mt-4 space-y-4 text-sm">
                <div className="grid gap-3 md:grid-cols-4">
                  <StatCard label="Logical Type" value={stats.logicalType} />
                  <StatCard label="Total" value={formatNumber(stats.stats.totalCount)} />
                  <StatCard label="Non-null" value={formatNumber(stats.stats.nonNullCount)} />
                  <StatCard label="Null" value={formatNumber(stats.stats.nullCount)} />
                </div>

                {stats.stats.kind === "numeric" ? (
                  <div className="grid gap-3 md:grid-cols-4">
                    <StatCard label="Mean" value={stats.stats.mean?.toFixed(3) ?? "n/a"} />
                    <StatCard label="Median" value={stats.stats.median?.toFixed(3) ?? "n/a"} />
                    <StatCard label="P25" value={stats.stats.p25?.toFixed(3) ?? "n/a"} />
                    <StatCard label="P75" value={stats.stats.p75?.toFixed(3) ?? "n/a"} />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-slate-400">
                        <tr>
                          <th className="pb-2">Value</th>
                          <th className="pb-2">Count</th>
                          <th className="pb-2">Percent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.stats.topValues.map((row) => (
                          <tr key={`${row.value ?? "null"}`} className="border-t border-slate-800/80">
                            <td className="py-2 text-slate-200">{String(row.value ?? "NULL")}</td>
                            <td className="py-2 text-slate-300">{formatNumber(row.count)}</td>
                            <td className="py-2 text-slate-300">{row.percentage.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </section>
        </>
      ) : (
        <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">
          Loading schema metadata...
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-base font-medium text-slate-100">{value}</p>
    </div>
  );
}
