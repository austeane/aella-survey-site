import type { DuckDBInitPhase } from "@/lib/duckdb/init";

type LoadingSkeletonVariant = "stat-grid" | "table" | "panel";

interface LoadingSkeletonProps {
  variant?: LoadingSkeletonVariant;
  phase: DuckDBInitPhase;
  title?: string;
}

const phaseLabel: Record<DuckDBInitPhase, string> = {
  idle: "Waiting to initialize DuckDB",
  "downloading-wasm": "Downloading DuckDB WASM",
  initializing: "Initializing DuckDB runtime",
  "loading-parquet": "Loading parquet dataset",
  ready: "Ready",
};

export function LoadingSkeleton({
  variant = "panel",
  phase,
  title = "Loading...",
}: LoadingSkeletonProps) {
  if (variant === "stat-grid") {
    return (
      <div className="space-y-3">
        <p className="mono-label">{title}</p>
        <div className="stat-grid grid-cols-1 md:grid-cols-3 animate-pulse">
          {[0, 1, 2].map((index) => (
            <div key={index} className="stat-cell">
              <div className="h-3 w-24 bg-[var(--rule-light)]" />
              <div className="mt-3 h-8 w-20 bg-[var(--rule)]" />
              <div className="mt-2 h-3 w-28 bg-[var(--rule-light)]" />
            </div>
          ))}
        </div>
        <p className="section-subtitle">{phaseLabel[phase]}</p>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="space-y-3">
        <p className="mono-label">{title}</p>
        <div className="border border-[var(--rule)] bg-[var(--paper)] p-3 animate-pulse">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="mb-2 h-4 w-full bg-[var(--rule-light)] last:mb-0" />
          ))}
        </div>
        <p className="section-subtitle">{phaseLabel[phase]}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="mono-label">{title}</p>
      <div className="border border-[var(--rule)] bg-[var(--paper)] p-4 animate-pulse">
        <div className="h-4 w-1/3 bg-[var(--rule-light)]" />
        <div className="mt-3 h-3 w-full bg-[var(--rule-light)]" />
        <div className="mt-2 h-3 w-5/6 bg-[var(--rule-light)]" />
        <div className="mt-2 h-3 w-2/3 bg-[var(--rule-light)]" />
      </div>
      <p className="section-subtitle">{phaseLabel[phase]}</p>
    </div>
  );
}
