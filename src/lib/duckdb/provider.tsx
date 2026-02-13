import { createContext, useContext, useEffect, useState } from "react";
import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";

import { getDuckDB, subscribeDuckDBPhase, type DuckDBInitPhase } from "./init";

interface DuckDBContextValue {
  db: AsyncDuckDB | null;
  loading: boolean;
  error: string | null;
  phase: DuckDBInitPhase;
}

const DuckDBContext = createContext<DuckDBContextValue>({
  db: null,
  loading: true,
  error: null,
  phase: "idle",
});

export function DuckDBProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<AsyncDuckDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<DuckDBInitPhase>("idle");

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribeDuckDBPhase((nextPhase) => {
      if (!cancelled) {
        setPhase(nextPhase);
      }
    });

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
      unsubscribe();
    };
  }, []);

  return (
    <DuckDBContext value={{ db, loading, error, phase }}>
      {children}
    </DuckDBContext>
  );
}

export function useDuckDB(): DuckDBContextValue {
  return useContext(DuckDBContext);
}
