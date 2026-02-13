import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DataTable } from "@/components/data-table";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { SchemaData } from "@/lib/api/contracts";
import { getSchema } from "@/lib/client/api";
import { useDuckDB } from "@/lib/duckdb/provider";
import { addNotebookEntry } from "@/lib/notebook-store";
import { quoteIdentifier } from "@/lib/duckdb/sql-helpers";
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/sql")({
  validateSearch: (search) => ({
    sql: typeof search.sql === "string" ? search.sql : undefined,
  }),
  component: SqlConsolePage,
});

interface QueryResult {
  columns: string[];
  rows: unknown[][];
}

const TEMPLATE_SQL: Array<{ name: string; sql: string }> = [
  {
    name: "Distribution (categorical)",
    sql: `SELECT
  {{column}},
  COUNT(*)::BIGINT AS respondents
FROM data
WHERE {{column}} IS NOT NULL
GROUP BY 1
ORDER BY respondents DESC
LIMIT 50`,
  },
  {
    name: "Distribution (numeric)",
    sql: `SELECT
  MIN({{column}})::DOUBLE AS min_value,
  QUANTILE_CONT({{column}}, 0.25)::DOUBLE AS p25,
  MEDIAN({{column}})::DOUBLE AS median_value,
  QUANTILE_CONT({{column}}, 0.75)::DOUBLE AS p75,
  MAX({{column}})::DOUBLE AS max_value,
  AVG({{column}})::DOUBLE AS avg_value
FROM data
WHERE {{column}} IS NOT NULL`,
  },
  {
    name: "Cross-tab",
    sql: `SELECT
  {{x_column}} AS x,
  {{y_column}} AS y,
  COUNT(*)::BIGINT AS respondents
FROM data
WHERE {{x_column}} IS NOT NULL
  AND {{y_column}} IS NOT NULL
GROUP BY 1, 2
ORDER BY respondents DESC
LIMIT 250`,
  },
  {
    name: "Cohort filter",
    sql: `SELECT *
FROM data
WHERE {{column}} = '{{value}}'
LIMIT 250`,
  },
  {
    name: "Correlation",
    sql: `SELECT
  CORR({{x_column}}, {{y_column}}) AS correlation,
  COUNT(*)::BIGINT AS n_used
FROM data
WHERE {{x_column}} IS NOT NULL
  AND {{y_column}} IS NOT NULL`,
  },
];

const starterSql = `SELECT
  straightness,
  politics,
  COUNT(*)::BIGINT AS respondents
FROM data
GROUP BY 1, 2
ORDER BY respondents DESC`;

function SqlConsolePage() {
  const search = Route.useSearch();
  const { db } = useDuckDB();
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [sql, setSql] = useState(search.sql ?? starterSql);
  const [limit, setLimit] = useState(1000);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [rowCount, setRowCount] = useState<number | undefined>();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (search.sql) {
      setSql(search.sql);
    }
  }, [search.sql]);

  useEffect(() => {
    let cancelled = false;

    void getSchema()
      .then((response) => {
        if (!cancelled) setSchema(response.data);
      })
      .catch(() => {
        if (!cancelled) setSchema(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredColumns = useMemo(() => {
    if (!schema) return [];
    if (!searchTerm.trim()) return schema.columns.slice(0, 240);

    const term = searchTerm.toLowerCase();
    return schema.columns.filter((column) => column.name.toLowerCase().includes(term)).slice(0, 240);
  }, [schema, searchTerm]);

  const execute = useCallback(async () => {
    if (!db) return;

    setRunning(true);
    setError(null);

    const conn = await db.connect();

    try {
      const limitedSql = `SELECT * FROM (${sql.trim().replace(/;+$/g, "")}) AS bounded_query LIMIT ${limit}`;
      const arrowResult = await conn.query(limitedSql);

      const columns = arrowResult.schema.fields.map((f) => f.name);
      const rows: unknown[][] = [];

      for (let i = 0; i < arrowResult.numRows; i++) {
        const row: unknown[] = [];
        for (let c = 0; c < columns.length; c++) {
          let val = arrowResult.getChildAt(c)?.get(i);
          if (typeof val === "bigint") val = Number(val);
          row.push(val ?? null);
        }
        rows.push(row);
      }

      setResult({ columns, rows });
      setRowCount(rows.length);
    } catch (executionError) {
      setError(executionError instanceof Error ? executionError.message : "Query failed");
      setResult(null);
      setRowCount(undefined);
    } finally {
      await conn.close();
      setRunning(false);
    }
  }, [db, sql, limit]);

  const insertQuotedIdentifier = useCallback((identifier: string) => {
    const quoted = quoteIdentifier(identifier);
    const textarea = textareaRef.current;

    if (!textarea) {
      setSql((current) => `${current}${current.endsWith("\n") ? "" : "\n"}${quoted}`);
      return;
    }

    const start = textarea.selectionStart ?? sql.length;
    const end = textarea.selectionEnd ?? start;

    setSql((current) => `${current.slice(0, start)}${quoted}${current.slice(end)}`);

    requestAnimationFrame(() => {
      const caret = start + quoted.length;
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  }, [sql.length]);

  const [notebookSaved, setNotebookSaved] = useState(false);

  function saveToNotebook() {
    if (!result) return;

    addNotebookEntry({
      title: `SQL: ${sql.trim().slice(0, 60)}${sql.trim().length > 60 ? "..." : ""}`,
      queryDefinition: {
        type: "sql",
        params: { sql },
      },
      resultsSnapshot: {
        columns: result.columns,
        rows: result.rows.slice(0, 50),
      },
      notes: "",
    });

    setNotebookSaved(true);
    setTimeout(() => setNotebookSaved(false), 2000);
  }

  function exportCsv() {
    if (!result) return;

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
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">SQL Console</h1>
        <p className="page-subtitle">Write DuckDB SQL against the dataset. Templates, click-to-insert column names, CSV export.</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[340px,1fr]">
        <aside className="raised-panel space-y-4">
          <SectionHeader number="01" title="Schema & Templates" />

          <div>
            <p className="mono-label">Templates</p>
            <div className="mt-2 space-y-2">
              {TEMPLATE_SQL.map((template) => (
                <Button
                  key={template.name}
                  type="button"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setSql(template.sql)}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          <label className="editorial-label">
            Search Columns
            <Input
              name="schema_search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Filter by name"
            />
          </label>

          <ScrollArea className="max-h-[calc(100vh-520px)] min-h-[200px] border border-[var(--rule)] bg-[var(--paper)] p-1">
            {filteredColumns.map((column) => (
              <Button
                key={column.name}
                type="button"
                variant="ghost"
                className="w-full justify-start truncate px-2 py-1 text-[0.72rem] normal-case tracking-normal"
                onClick={() => insertQuotedIdentifier(column.name)}
                title={column.name}
              >
                {column.name}
              </Button>
            ))}
          </ScrollArea>
        </aside>

        <section className="editorial-panel space-y-4">
          <SectionHeader number="02" title="Editor" />

          <Textarea
            ref={textareaRef}
            className="h-64"
            value={sql}
            onChange={(event) => setSql(event.target.value)}
          />

          <div className="flex flex-wrap items-center gap-3">
            <label className="editorial-label w-[150px]">
              Limit
              <Input
                type="number"
                name="query_limit"
                min={1}
                max={10000}
                value={limit}
                onChange={(event) =>
                  setLimit(Math.max(1, Math.min(10000, Number(event.target.value) || 1)))
                }
              />
            </label>

            <Button
              type="button"
              onClick={() => {
                void execute();
              }}
              disabled={running || !db}
              variant="filled"
            >
              {running ? "Running..." : "Run Query"}
            </Button>

            <Button type="button" onClick={exportCsv} disabled={!result} variant="accent">
              Export CSV
            </Button>

            <Button type="button" onClick={saveToNotebook} disabled={!result} variant="ghost">
              {notebookSaved ? "Saved!" : "Add to Notebook"}
            </Button>
          </div>

          {error ? <p className="alert alert--error">{error}</p> : null}
        </section>
      </div>

      {result ? (
        <section className="editorial-panel space-y-3">
          <SectionHeader number="03" title="Results" />

          <div className="sample-size">
            <span className="sample-size-item">Rows returned: {formatNumber(rowCount ?? 0)}</span>
            <span className="sample-size-item">Limit applied: {formatNumber(limit)}</span>
            {rowCount === limit ? (
              <span className="sample-size-item text-[var(--accent)]">Results may be truncated</span>
            ) : null}
          </div>

          <DataTable
            rows={result.rows}
            rowKey={(_, index) => `row-${index}`}
            columns={result.columns.map((column, columnIndex) => ({
              id: column,
              header: column,
              cell: (row: unknown[]) => String(row[columnIndex] ?? "NULL"),
            }))}
          />
        </section>
      ) : null}
    </div>
  );
}
