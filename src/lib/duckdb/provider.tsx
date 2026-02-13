import { createContext, useContext, useEffect, useState } from "react";
import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";

import { getDuckDB } from "./init";

interface DuckDBContextValue {
  db: AsyncDuckDB | null;
  loading: boolean;
  error: string | null;
}

const DuckDBContext = createContext<DuckDBContextValue>({
  db: null,
  loading: true,
  error: null,
});

export function DuckDBProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<AsyncDuckDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getDuckDB()
      .then((instance) => {
        if (!cancelled) {
          setDb(instance);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to initialize DuckDB-WASM");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DuckDBContext value={{ db, loading, error }}>
      {children}
    </DuckDBContext>
  );
}

export function useDuckDB(): DuckDBContextValue {
  return useContext(DuckDBContext);
}
