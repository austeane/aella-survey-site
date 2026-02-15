import { useEffect, useMemo, useRef, useState } from "react";

import { getConfidenceStyle } from "@/lib/statistics/confidence";

import { CHART_COLORS, CHART_FONT, clampPercent, createPercentScale } from "./chart-config";

export interface PercentileChartDatum {
  metric: string;
  label: string;
  percentile: number | null;
  cohortN: number;
  ciLower?: number | null;
  ciUpper?: number | null;
}

interface PercentileChartProps {
  data: PercentileChartDatum[];
  compareData?: PercentileChartDatum[];
  groupALabel?: string;
  groupBLabel?: string;
  height?: number;
}

export function PercentileChart({
  data,
  compareData,
  groupALabel = "Group A",
  groupBLabel = "Group B",
  height,
}: PercentileChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(720);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (!next) return;
      setWidth(Math.max(360, next));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const compareMap = useMemo(
    () => new Map((compareData ?? []).map((row) => [row.metric, row])),
    [compareData],
  );

  const rowHeight = 42;
  const chartHeight = height ?? Math.max(280, 56 + data.length * rowHeight);
  const margin = {
    top: 24,
    right: 22,
    bottom: 28,
    left: Math.min(220, Math.max(150, width * 0.3)),
  };

  const x = createPercentScale([margin.left, width - margin.right]);

  return (
    <div ref={containerRef} className="w-full border border-[var(--rule)] bg-[var(--paper)] p-3">
      <svg width={width} height={chartHeight} role="img" aria-label="Percentile profile chart">
        <line
          x1={x(50)}
          x2={x(50)}
          y1={margin.top - 8}
          y2={chartHeight - margin.bottom + 4}
          stroke={CHART_COLORS.rule}
          strokeWidth={1.5}
        />

        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line
              x1={x(tick)}
              x2={x(tick)}
              y1={chartHeight - margin.bottom + 2}
              y2={chartHeight - margin.bottom + 6}
              stroke={CHART_COLORS.inkFaded}
              strokeWidth={1}
            />
            <text
              x={x(tick)}
              y={chartHeight - margin.bottom + 20}
              textAnchor="middle"
              style={{
                fontFamily: CHART_FONT.mono,
                fontSize: 10,
                fill: CHART_COLORS.inkFaded,
              }}
            >
              {tick}
            </text>
          </g>
        ))}

        {data.map((row, index) => {
          const y = margin.top + index * rowHeight + rowHeight / 2;
          const value = row.percentile == null ? null : clampPercent(row.percentile);
          const style = getConfidenceStyle(row.cohortN);

          const compareRow = compareMap.get(row.metric);
          const compareValue =
            compareRow?.percentile == null ? null : clampPercent(compareRow.percentile);
          const compareStyle = compareRow ? getConfidenceStyle(compareRow.cohortN) : null;

          return (
            <g key={row.metric}>
              <text
                x={margin.left - 10}
                y={y + 3}
                textAnchor="end"
                style={{
                  fontFamily: CHART_FONT.body,
                  fontSize: 13,
                  fill: CHART_COLORS.ink,
                }}
              >
                {row.label}
              </text>

              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={y}
                y2={y}
                stroke={CHART_COLORS.ruleLight}
                strokeWidth={1}
              />

              {value != null ? (
                <>
                  {row.ciLower != null && row.ciUpper != null ? (
                    <rect
                      x={x(clampPercent(row.ciLower))}
                      y={y - 7}
                      width={Math.max(1.5, x(clampPercent(row.ciUpper)) - x(clampPercent(row.ciLower)))}
                      height={14}
                      fill={CHART_COLORS.accent}
                      opacity={0.14 * style.ciMultiplier + 0.06}
                    />
                  ) : null}
                  <line
                    x1={x(50)}
                    x2={x(value)}
                    y1={y}
                    y2={y}
                    stroke={CHART_COLORS.accent}
                    strokeWidth={1.5}
                    strokeDasharray={style.dashArray}
                    opacity={style.opacity}
                  />
                  <circle
                    cx={x(value)}
                    cy={y}
                    r={5.5}
                    fill={value >= 50 ? CHART_COLORS.accent : CHART_COLORS.inkLight}
                    opacity={style.opacity}
                  />
                </>
              ) : (
                <text
                  x={x(50)}
                  y={y + 4}
                  textAnchor="middle"
                  style={{
                    fontFamily: CHART_FONT.mono,
                    fontSize: 10,
                    fill: CHART_COLORS.inkFaded,
                  }}
                >
                  n/a
                </text>
              )}

              {compareValue != null ? (
                <>
                  {compareRow?.ciLower != null && compareRow?.ciUpper != null ? (
                    <rect
                      x={x(clampPercent(compareRow.ciLower))}
                      y={y - 4}
                      width={Math.max(
                        1.5,
                        x(clampPercent(compareRow.ciUpper)) - x(clampPercent(compareRow.ciLower)),
                      )}
                      height={8}
                      fill={CHART_COLORS.ink}
                      opacity={0.08 * (compareStyle?.ciMultiplier ?? 1) + 0.05}
                    />
                  ) : null}
                  <circle
                    cx={x(compareValue)}
                    cy={y}
                    r={5}
                    fill={CHART_COLORS.paper}
                    stroke={CHART_COLORS.ink}
                    strokeWidth={1.5}
                    opacity={compareStyle?.opacity ?? 1}
                  />
                </>
              ) : null}
            </g>
          );
        })}
      </svg>

      {compareData ? (
        <div className="mt-2 flex items-center gap-4 text-[0.68rem] font-['JetBrains_Mono',ui-monospace,monospace] uppercase tracking-[0.08em] text-[var(--ink-faded)]">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 bg-[var(--accent)]" />
            {groupALabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 border border-[var(--ink)] bg-[var(--paper)]" />
            {groupBLabel}
          </span>
          <span>reference: 50th percentile line</span>
        </div>
      ) : (
        <p className="mt-2 text-[0.68rem] font-['JetBrains_Mono',ui-monospace,monospace] uppercase tracking-[0.08em] text-[var(--ink-faded)]">
          Dot position = percentile rank. Stem direction shows above/below the 50th percentile baseline.
        </p>
      )}
    </div>
  );
}
