import { scaleLinear } from "d3-scale";
import { useMemo } from "react";

import { formatPercent } from "@/lib/format";
import { getConfidenceStyle } from "@/lib/statistics/confidence";

import { CHART_FONT } from "./chart-config";

export interface DumbbellRow {
  key: string;
  label: string;
  /** Optional separate question portion (displayed without truncation) */
  questionLabel?: string;
  /** Optional separate answer portion (displayed with subtle distinction) */
  answerLabel?: string;
  valueA: number;
  valueB: number;
  nA: number;
  nB: number;
}

interface DumbbellChartProps {
  rows: DumbbellRow[];
  groupALabel: string;
  groupBLabel: string;
}

export function DumbbellChart({ rows, groupALabel, groupBLabel }: DumbbellChartProps) {
  const domain = useMemo(() => {
    const values = rows.flatMap((row) => [row.valueA, row.valueB]).filter(Number.isFinite);
    if (values.length === 0) return [0, 100] as const;

    const min = Math.max(0, Math.min(...values) - 5);
    const max = Math.min(100, Math.max(...values) + 5);
    return [min, max] as const;
  }, [rows]);

  const x = scaleLinear().domain(domain).range([0, 100]).clamp(true);

  return (
    <div className="space-y-2 border border-[var(--rule)] bg-[var(--paper)] p-3">
      <div className="flex items-center gap-4 text-[0.68rem] font-['JetBrains_Mono',ui-monospace,monospace] uppercase tracking-[0.08em] text-[var(--ink-faded)]">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 bg-[var(--accent)]" />
          {groupALabel}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 border border-[var(--ink)] bg-[var(--paper)]" />
          {groupBLabel}
        </span>
      </div>

      {rows.map((row) => {
        const left = Math.min(row.valueA, row.valueB);
        const right = Math.max(row.valueA, row.valueB);
        const lowConfidence = row.nA < 100 || row.nB < 100;
        const styleA = getConfidenceStyle(row.nA);
        const styleB = getConfidenceStyle(row.nB);

        return (
          <div
            key={row.key}
            className="grid gap-2 border-b border-[var(--rule-light)] pb-2 last:border-b-0 last:pb-0 md:grid-cols-[minmax(220px,1fr)_minmax(180px,240px)_90px]"
          >
            <p className="font-['Source_Serif_4',Georgia,serif] text-[0.86rem] text-[var(--ink)]">
              {row.questionLabel ? (
                <>
                  {row.questionLabel}
                  {row.answerLabel ? (
                    <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[0.78rem] text-[var(--ink-faded)]">
                      {" "}{row.answerLabel}
                    </span>
                  ) : null}
                </>
              ) : (
                row.label
              )}
            </p>

            <div className="relative h-5">
              <span
                className="absolute top-1/2 h-[2px] -translate-y-1/2 bg-[var(--rule)]"
                style={{
                  left: `${x(left)}%`,
                  width: `${Math.max(1, x(right) - x(left))}%`,
                  borderTop: lowConfidence ? "1px dashed var(--ink-faded)" : undefined,
                }}
              />
              <span
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-[var(--accent)]"
                style={{
                  left: `${x(row.valueA)}%`,
                  opacity: styleA.opacity,
                }}
              />
              <span
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--ink)] bg-[var(--paper)]"
                style={{
                  left: `${x(row.valueB)}%`,
                  opacity: styleB.opacity,
                }}
              />
            </div>

            <p className="text-right font-['JetBrains_Mono',ui-monospace,monospace] text-[0.7rem] text-[var(--ink-faded)]">
              {formatPercent(row.valueA, 1)} / {formatPercent(row.valueB, 1)}
            </p>
          </div>
        );
      })}

      <div className="flex justify-between text-[0.62rem] uppercase tracking-[0.08em] text-[var(--ink-faded)]" style={{ fontFamily: CHART_FONT.mono }}>
        <span>{domain[0].toFixed(0)}%</span>
        <span>{domain[1].toFixed(0)}%</span>
      </div>
    </div>
  );
}
