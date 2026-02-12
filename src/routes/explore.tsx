import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import type { SchemaData, StatsData } from "@/lib/api/contracts";
import { getCrosstab, getSchema, getStats } from "@/lib/client/api";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
});

function ExplorePage() {
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const [xColumn, setXColumn] = useState("");
  const [yColumn, setYColumn] = useState("");
  const [limit, setLimit] = useState(50);

  const [filterColumn, setFilterColumn] = useState("");
  const [filterOptions, setFilterOptions] = useState<Array<{ value: string; count: number }>>([]);
  const [selectedFilterValues, setSelectedFilterValues] = useState<string[]>([]);

  const [result, setResult] = useState<
    | {
        x: string;
        y: string;
        rows: Array<{ x: string | number | boolean | null; y: string | number | boolean | null; count: number }>;
      }
    | null
  >(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [resultLoading, setResultLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getSchema()
      .then((response) => {
        if (cancelled) {
          return;
        }

        setSchema(response.data);

        const preferredX = response.data.columns.find((column) => column.name === "straightness");
        const preferredY = response.data.columns.find((column) => column.name === "politics");

        setXColumn(preferredX?.name ?? response.data.columns[0]?.name ?? "");
        setYColumn(preferredY?.name ?? response.data.columns[1]?.name ?? "");

        const firstDemographicFilter = response.data.columns.find(
          (column) => column.tags.includes("demographic") && column.logicalType === "categorical",
        );
        setFilterColumn(firstDemographicFilter?.name ?? "");
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
    if (!filterColumn) {
      setFilterOptions([]);
      setSelectedFilterValues([]);
      return;
    }

    let cancelled = false;

    void getStats(filterColumn)
      .then((response) => {
        if (cancelled) {
          return;
        }

        const stats = response.data as StatsData;
        if (stats.stats.kind !== "categorical") {
          setFilterOptions([]);
          setSelectedFilterValues([]);
          return;
        }

        const options = stats.stats.topValues.map((item) => ({
          value: String(item.value ?? "NULL"),
          count: item.count,
        }));

        setFilterOptions(options);
        setSelectedFilterValues([]);
      })
      .catch(() => {
        if (!cancelled) {
          setFilterOptions([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filterColumn]);

  const queryFilters = useMemo(() => {
    if (!filterColumn || selectedFilterValues.length === 0) {
      return undefined;
    }

    return {
      [filterColumn]: selectedFilterValues.map((value) => (value === "NULL" ? null : value)),
    };
  }, [filterColumn, selectedFilterValues]);

  useEffect(() => {
    if (!xColumn || !yColumn) {
      return;
    }

    let cancelled = false;
    setResultLoading(true);
    setResultError(null);

    void getCrosstab({
      x: xColumn,
      y: yColumn,
      limit,
      filters: queryFilters,
    })
      .then((response) => {
        if (!cancelled) {
          setResult(response.data);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setResultError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setResultLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [xColumn, yColumn, limit, queryFilters]);

  const demographicColumns = useMemo(() => {
    if (!schema) {
      return [];
    }

    return schema.columns.filter(
      (column) => column.tags.includes("demographic") && column.logicalType === "categorical",
    );
  }, [schema]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Cross-Tab Explorer</h1>
        <p className="text-slate-300">Choose two variables and optional demographic filters.</p>
      </header>

      {schemaError ? (
        <section className="rounded-lg border border-red-500/40 bg-red-900/20 p-4 text-red-200">
          Failed to load schema: {schemaError}
        </section>
      ) : null}

      {schema ? (
        <section className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900/70 p-4 lg:grid-cols-2">
          <label className="text-sm text-slate-300">
            X column
            <select
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2"
              value={xColumn}
              onChange={(event) => setXColumn(event.target.value)}
            >
              {schema.columns.map((column) => (
                <option key={column.name} value={column.name}>
                  {column.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-300">
            Y column
            <select
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2"
              value={yColumn}
              onChange={(event) => setYColumn(event.target.value)}
            >
              {schema.columns.map((column) => (
                <option key={column.name} value={column.name}>
                  {column.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-slate-300">
            Result row limit
            <input
              type="number"
              min={1}
              max={1000}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2"
              value={limit}
              onChange={(event) => setLimit(Math.max(1, Math.min(1000, Number(event.target.value) || 1)))}
            />
          </label>

          <label className="text-sm text-slate-300">
            Optional demographic filter
            <select
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2"
              value={filterColumn}
              onChange={(event) => setFilterColumn(event.target.value)}
            >
              <option value="">None</option>
              {demographicColumns.map((column) => (
                <option key={column.name} value={column.name}>
                  {column.name}
                </option>
              ))}
            </select>
          </label>

          {filterColumn && filterOptions.length > 0 ? (
            <div className="lg:col-span-2">
              <p className="mb-2 text-sm text-slate-300">Filter values</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {filterOptions.map((option) => {
                  const checked = selectedFilterValues.includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className="flex items-center justify-between rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                    >
                      <span className="truncate pr-2">{option.value}</span>
                      <span className="ml-2 shrink-0 text-xs text-slate-400">{option.count}</span>
                      <input
                        className="ml-3"
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          if (event.target.checked) {
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
        <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-400">
          Loading schema metadata...
        </section>
      )}

      <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
        <h2 className="text-lg font-semibold">Results</h2>
        {resultLoading ? <p className="mt-3 text-sm text-slate-400">Running crosstab query...</p> : null}
        {resultError ? (
          <p className="mt-3 rounded border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-200">
            {resultError}
          </p>
        ) : null}

        {result && !resultLoading ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-2">{result.x}</th>
                  <th className="pb-2">{result.y}</th>
                  <th className="pb-2">Count</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, index) => (
                  <tr key={`${String(row.x)}-${String(row.y)}-${index}`} className="border-t border-slate-800/80">
                    <td className="py-2 text-slate-200">{String(row.x ?? "NULL")}</td>
                    <td className="py-2 text-slate-200">{String(row.y ?? "NULL")}</td>
                    <td className="py-2 text-slate-300">{row.count.toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
