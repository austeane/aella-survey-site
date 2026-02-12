import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import type { QueryData, SchemaData } from "@/lib/api/contracts";
import { getSchema, runQuery } from "@/lib/client/api";

export const Route = createFileRoute("/sql")({
  component: SqlConsolePage,
});

const starterSql = `SELECT
  straightness,
  politics,
  COUNT(*)::BIGINT AS respondents
FROM data
GROUP BY 1, 2
ORDER BY respondents DESC`;

function SqlConsolePage() {
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [search, setSearch] = useState("");

  const [sql, setSql] = useState(starterSql);
  const [limit, setLimit] = useState(1000);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryData | null>(null);
  const [resultMeta, setResultMeta] = useState<Record<string, unknown> | undefined>();

  useEffect(() => {
    let cancelled = false;

    void getSchema()
      .then((response) => {
        if (!cancelled) {
          setSchema(response.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSchema(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredColumns = useMemo(() => {
    if (!schema) {
      return [];
    }

    if (!search.trim()) {
      return schema.columns.slice(0, 200);
    }

    const term = search.toLowerCase();
    return schema.columns.filter((column) => column.name.toLowerCase().includes(term)).slice(0, 200);
  }, [schema, search]);

  async function execute() {
    setRunning(true);
    setError(null);

    try {
      const response = await runQuery({
        sql,
        limit,
      });

      setResult(response.data);
      setResultMeta(response.meta);
    } catch (executionError) {
      setError(executionError instanceof Error ? executionError.message : "Query failed");
      setResult(null);
      setResultMeta(undefined);
    } finally {
      setRunning(false);
    }
  }

  function exportCsv() {
    if (!result) {
      return;
    }

    const escaped = (value: unknown) => {
      const text = String(value ?? "");
      return `"${text.replaceAll('"', '""')}"`;
    };

    const header = result.columns.map(escaped).join(",");
    const lines = result.rows.map((row) => row.map(escaped).join(","));
    const csv = [header, ...lines].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `bks-query-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">SQL Console</h1>
        <p className="text-slate-300">Run read-only DuckDB SQL with row limits and CSV export.</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <aside className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-base font-semibold">Schema</h2>
          <input
            className="mt-3 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
            placeholder="Search columns"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="mt-3 max-h-[420px] overflow-auto pr-1 text-sm">
            {filteredColumns.map((column) => (
              <button
                key={column.name}
                type="button"
                className="block w-full truncate rounded px-2 py-1 text-left text-slate-300 hover:bg-slate-800 hover:text-white"
                onClick={() => {
                  setSql((current) => `${current}\n-- ${column.name}`);
                }}
                title={column.name}
              >
                {column.name}
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
          <label className="block text-sm text-slate-300" htmlFor="sql-editor">
            SQL
          </label>
          <textarea
            id="sql-editor"
            className="mt-2 h-56 w-full rounded border border-slate-700 bg-slate-950 p-3 font-mono text-sm"
            value={sql}
            onChange={(event) => setSql(event.target.value)}
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-300">
              Limit
              <input
                type="number"
                min={1}
                max={10000}
                className="ml-2 w-24 rounded border border-slate-700 bg-slate-950 px-2 py-1"
                value={limit}
                onChange={(event) => setLimit(Math.max(1, Math.min(10000, Number(event.target.value) || 1)))}
              />
            </label>

            <button
              type="button"
              onClick={() => {
                void execute();
              }}
              disabled={running}
              className="rounded border border-slate-700 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? "Running..." : "Run query"}
            </button>

            <button
              type="button"
              onClick={exportCsv}
              disabled={!result}
              className="rounded border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>

            {resultMeta ? (
              <span className="text-xs text-slate-400">
                Rows: {String(resultMeta.rowCount ?? result?.rows.length ?? 0)} | Limit:{" "}
                {String(resultMeta.limit ?? limit)}
              </span>
            ) : null}
          </div>

          {error ? (
            <p className="mt-4 rounded border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {result ? (
            <div className="mt-4 max-h-[420px] overflow-auto rounded border border-slate-800">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-950 text-slate-300">
                  <tr>
                    {result.columns.map((column) => (
                      <th key={column} className="border-b border-slate-800 px-3 py-2 font-medium">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`} className="border-b border-slate-800/70 text-slate-200">
                      {row.map((value, columnIndex) => (
                        <td key={`cell-${rowIndex}-${columnIndex}`} className="px-3 py-2 align-top">
                          {String(value ?? "NULL")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
