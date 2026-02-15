import { useCallback, useEffect, useRef, useState } from "react";

import { track } from "@/lib/client/track";
import { useDuckDB } from "./provider";

export interface DuckDBQueryResult {
  columns: string[];
  rows: unknown[][];
}

interface UseDuckDBQueryReturn {
  data: DuckDBQueryResult | null;
  loading: boolean;
  error: string | null;
  /** Re-run the query manually. */
  refetch: () => void;
}

const SLOW_DUCKDB_QUERY_MS = 1_500;

function queryKind(sql: string): string {
  return sql.trim().split(/\s+/)[0]?.toUpperCase() ?? "UNKNOWN";
}

function normalizeValue(value: unknown): unknown {
  if (value == null) return null;
  if (typeof value === "bigint") {
    const n = Number(value);
    return Number.isSafeInteger(n) ? n : value.toString();
  }
  return value;
}

/**
 * Run a SQL query against the in-browser DuckDB-WASM instance.
 *
 * The query is re-executed whenever `sql` changes (referential equality).
 * Pass `null` or `""` for `sql` to skip execution.
 */
export function useDuckDBQuery(sql: string | null): UseDuckDBQueryReturn {
  const { db, loading: dbLoading, error: dbError } = useDuckDB();

  const [data, setData] = useState<DuckDBQueryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generationRef = useRef(0);
  const lastErrorSignatureRef = useRef<string | null>(null);

  const execute = useCallback(async () => {
    if (!db || !sql) {
      return;
    }

    const generation = ++generationRef.current;
    setLoading(true);
    setError(null);

    let conn;
    const queryStartedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    const page = typeof window !== "undefined" ? window.location.pathname : "/";

    try {
      conn = await db.connect();
      const arrowResult = await conn.query(sql);

      if (generation !== generationRef.current) return;

      const columns = arrowResult.schema.fields.map((f) => f.name);
      const rows: unknown[][] = [];

      for (let rowIdx = 0; rowIdx < arrowResult.numRows; rowIdx++) {
        const row: unknown[] = [];
        for (let colIdx = 0; colIdx < columns.length; colIdx++) {
          row.push(normalizeValue(arrowResult.getChildAt(colIdx)?.get(rowIdx)));
        }
        rows.push(row);
      }

      const elapsedMs =
        (typeof performance !== "undefined" ? performance.now() : Date.now()) - queryStartedAt;
      if (elapsedMs >= SLOW_DUCKDB_QUERY_MS) {
        track({
          event: "slow_experience",
          page,
          action: "duckdb_query",
          label: queryKind(sql),
          value: Math.round(elapsedMs),
        });
      }

      setData({ columns, rows });
      setLoading(false);
      lastErrorSignatureRef.current = null;
    } catch (err: unknown) {
      if (generation !== generationRef.current) return;
      const message = err instanceof Error ? err.message : "Query execution failed";
      const signature = `${queryKind(sql)}::${message}`;
      if (lastErrorSignatureRef.current !== signature) {
        track({
          event: "error",
          page,
          action: "duckdb_query",
          error_code: "DUCKDB_QUERY_ERROR",
          label: `${queryKind(sql)}: ${message}`,
        });
        lastErrorSignatureRef.current = signature;
      }

      setError(message);
      setData(null);
      setLoading(false);
    } finally {
      if (conn) {
        await conn.close();
      }
    }
  }, [db, sql]);

  useEffect(() => {
    if (dbError) {
      setError(dbError);
      setLoading(false);
      return;
    }

    if (dbLoading) {
      setLoading(true);
      return;
    }

    if (!sql) {
      setData(null);
      setLoading(false);
      return;
    }

    void execute();
  }, [sql, dbLoading, dbError, execute]);

  const refetch = useCallback(() => {
    void execute();
  }, [execute]);

  return { data, loading, error, refetch };
}
