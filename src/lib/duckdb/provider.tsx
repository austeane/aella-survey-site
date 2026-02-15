import { createContext, useContext, useEffect, useState } from "react";
import type { AsyncDuckDB } from "@duckdb/duckdb-wasm";

import { track } from "@/lib/client/track";
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

const SLOW_DUCKDB_INIT_MS = 3_000;

export function DuckDBProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<AsyncDuckDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<DuckDBInitPhase>("idle");

  useEffect(() => {
    let cancelled = false;
    const initStartedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    const currentPage = typeof window !== "undefined" ? window.location.pathname : "/";

    const unsubscribe = subscribeDuckDBPhase((nextPhase) => {
      if (!cancelled) {
        setPhase(nextPhase);
      }
    });

    getDuckDB()
      .then((instance) => {
        if (!cancelled) {
          const initDuration =
            (typeof performance !== "undefined" ? performance.now() : Date.now()) - initStartedAt;
          if (initDuration >= SLOW_DUCKDB_INIT_MS) {
            track({
              event: "slow_experience",
              page: currentPage,
              action: "duckdb_init",
              value: Math.round(initDuration),
            });
          }

          setDb(instance);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Failed to initialize DuckDB-WASM";
          track({
            event: "error",
            page: currentPage,
            action: "duckdb_init",
            error_code: "DUCKDB_INIT_ERROR",
            label: message,
          });
          setError(message);
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
