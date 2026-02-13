import { useCallback, useEffect, useRef, useState } from "react";

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

  const execute = useCallback(async () => {
    if (!db || !sql) {
      return;
    }

    const generation = ++generationRef.current;
    setLoading(true);
    setError(null);

    let conn;
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

      setData({ columns, rows });
      setLoading(false);
    } catch (err: unknown) {
      if (generation !== generationRef.current) return;
      setError(err instanceof Error ? err.message : "Query execution failed");
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
