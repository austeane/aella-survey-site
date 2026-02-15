import { scaleLinear } from "d3-scale";

import { formatNumber, formatPercent } from "@/lib/format";
import { getConfidenceStyle, wilsonCI } from "@/lib/statistics/confidence";

export interface OverIndexChartRow {
  key: string;
  label: string;
  columnName: string;
  value: string;
  cohortPct: number;
  globalPct: number;
  ratio: number;
  cohortCount: number;
  globalCount: number;
  isGated?: boolean;
}

interface OverIndexChartProps {
  rows: OverIndexChartRow[];
  cohortSize: number;
  title?: string;
  emptyMessage?: string;
}

function truncateLabel(label: string, maxLength = 45): string {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 1)}…`;
}

export function OverIndexChart({
  rows,
  cohortSize,
  title,
  emptyMessage = "No standout traits met the sample-size threshold.",
}: OverIndexChartProps) {
  const maxPct = Math.max(
    1,
    ...rows.flatMap((row) => [Math.max(0, row.cohortPct), Math.max(0, row.globalPct)]),
  );
  const widthScale = scaleLinear().domain([0, maxPct]).range([0, 100]).clamp(true);

  if (cohortSize < 30) {
    return (
      <div className="border border-[var(--rule)] bg-[var(--paper)] p-4">
        <p className="alert alert--critical">Too few for reliable analysis (N &lt; 30).</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 border border-[var(--rule)] bg-[var(--paper)] p-3">
      {title ? <p className="mono-label">{title}</p> : null}
      {rows.length === 0 ? <p className="section-subtitle">{emptyMessage}</p> : null}

      {rows.map((row) => {
        const style = getConfidenceStyle(row.cohortCount);
        const ci = wilsonCI(row.cohortCount, Math.max(1, cohortSize));
        const ciHalfWidthPct = ((ci.upper - ci.lower) * 100) / 2;

        return (
          <div key={row.key} className="grid gap-2 border-b border-[var(--rule-light)] pb-2 last:border-b-0 last:pb-0 md:grid-cols-[minmax(220px,1fr)_minmax(180px,220px)_90px]">
            <div className="min-w-0">
              <p
                className="truncate font-['Source_Serif_4',Georgia,serif] text-[0.87rem] text-[var(--ink)]"
                title={row.label}
              >
                {truncateLabel(row.label)}
                {row.isGated ? (
                  <span className="ml-2 inline-flex h-4 w-4 items-center justify-center border border-[var(--rule)] text-[0.62rem] font-['JetBrains_Mono',ui-monospace,monospace] text-[var(--ink-faded)]" title="Comparison is among people who answered this question.">
                    g
                  </span>
                ) : null}
              </p>
              <p className="mono-value text-[0.66rem] text-[var(--ink-faded)]">
                {formatPercent(row.cohortPct, 1)} vs {formatPercent(row.globalPct, 1)}
                {ciHalfWidthPct > 0 ? ` · ±${ciHalfWidthPct.toFixed(1)}pp` : ""}
              </p>
            </div>

            <div className="space-y-1">
              <div className="relative h-3 w-full bg-[var(--rule-light)]">
                <span
                  className="absolute left-0 top-0 h-full bg-[var(--accent)]"
                  style={{
                    width: `${widthScale(Math.max(0, row.cohortPct))}%`,
                    opacity: style.opacity,
                  }}
                />
              </div>
              <div className="relative h-2 w-full bg-[color:var(--paper-warm)]">
                <span
                  className="absolute left-0 top-0 h-full bg-[var(--ink-faded)]"
                  style={{
                    width: `${widthScale(Math.max(0, row.globalPct))}%`,
                    opacity: Math.max(0.45, style.opacity),
                  }}
                />
              </div>
            </div>

            <div className="text-right">
              <p className="mono-value text-[0.77rem] text-[var(--ink)]">{row.ratio.toFixed(2)}x</p>
              <p className="mono-value text-[0.64rem] text-[var(--ink-faded)]">
                {formatNumber(row.cohortCount)} / {formatNumber(row.globalCount)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
