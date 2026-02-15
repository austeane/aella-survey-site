import { line } from "d3-shape";
import { scaleLinear } from "d3-scale";
import { useEffect, useMemo, useRef, useState } from "react";

import { medianCI } from "@/lib/statistics/confidence";

import { CHART_COLORS, CHART_FONT } from "./chart-config";

export interface DistributionBin {
  bin: number;
  globalCount: number;
  cohortCount: number;
}

interface DistributionStripProps {
  label: string;
  bins: DistributionBin[];
  min: number;
  max: number;
  cohortMedian: number | null;
  cohortSD: number | null;
  cohortN: number;
  globalMedian: number | null;
  compareBins?: DistributionBin[];
  compareMedian?: number | null;
}

export function DistributionStrip({
  label,
  bins,
  min,
  max,
  cohortMedian,
  cohortSD,
  cohortN,
  globalMedian,
  compareBins,
  compareMedian,
}: DistributionStripProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(680);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width;
      if (!nextWidth) return;
      setWidth(Math.max(320, nextWidth));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const stripHeight = 58;
  const margin = { top: 8, right: 6, bottom: 20, left: 6 };
  const usableHeight = stripHeight - margin.top - margin.bottom;

  const safeBins = bins.length > 0 ? bins : [{ bin: 1, globalCount: 0, cohortCount: 0 }];
  const x = scaleLinear().domain([0, Math.max(1, safeBins.length)]).range([margin.left, width - margin.right]);

  const globalMax = Math.max(1, ...safeBins.map((entry) => entry.globalCount));
  const cohortMax = Math.max(1, ...safeBins.map((entry) => entry.cohortCount));
  const compareMax = Math.max(1, ...(compareBins ?? []).map((entry) => entry.cohortCount));

  const globalDensityLine = useMemo(() => {
    const y = scaleLinear().domain([0, globalMax]).range([margin.top + usableHeight, margin.top]);
    const pathBuilder = line<DistributionBin>()
      .x((_, index) => x(index + 0.5))
      .y((entry) => y(entry.globalCount));
    return pathBuilder(safeBins) ?? "";
  }, [globalMax, margin.top, safeBins, usableHeight, x]);

  const cohortDensityLine = useMemo(() => {
    const y = scaleLinear().domain([0, cohortMax]).range([margin.top + usableHeight, margin.top]);
    const pathBuilder = line<DistributionBin>()
      .x((_, index) => x(index + 0.5))
      .y((entry) => y(entry.cohortCount));
    return pathBuilder(safeBins) ?? "";
  }, [cohortMax, margin.top, safeBins, usableHeight, x]);

  const compareDensityLine = useMemo(() => {
    if (!compareBins || compareBins.length === 0) return "";
    const y = scaleLinear().domain([0, compareMax]).range([margin.top + usableHeight, margin.top]);
    const pathBuilder = line<DistributionBin>()
      .x((_, index) => x(index + 0.5))
      .y((entry) => y(entry.cohortCount));
    return pathBuilder(compareBins) ?? "";
  }, [compareBins, compareMax, margin.top, usableHeight, x]);

  const valueToX = (value: number) => {
    if (!Number.isFinite(value) || max <= min) return x(safeBins.length / 2);
    const ratio = (value - min) / (max - min);
    return x(Math.max(0, Math.min(safeBins.length, ratio * safeBins.length)));
  };

  const cohortCI =
    cohortMedian != null && cohortSD != null ? medianCI(cohortSD, cohortN, cohortMedian) : null;

  return (
    <div ref={containerRef} className="space-y-1 border border-[var(--rule-light)] bg-[var(--paper)] p-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-['Source_Serif_4',Georgia,serif] text-[0.86rem] text-[var(--ink)]">{label}</p>
        <p className="mono-value text-[0.63rem] text-[var(--ink-faded)]">N = {cohortN}</p>
      </div>

      <svg width={width} height={stripHeight} role="img" aria-label={`${label} distribution strip`}>
        {safeBins.map((entry, index) => {
          const x0 = x(index);
          const x1 = x(index + 1);
          const alpha = Math.max(0.05, Math.min(0.8, entry.globalCount / globalMax));

          return (
            <rect
              key={`${entry.bin}-${index}`}
              x={x0}
              y={margin.top}
              width={Math.max(1, x1 - x0)}
              height={usableHeight}
              fill={CHART_COLORS.ink}
              opacity={alpha * 0.26}
            />
          );
        })}

        <path d={globalDensityLine} fill="none" stroke={CHART_COLORS.inkFaded} strokeDasharray="4 3" strokeWidth={1.1} opacity={0.8} />
        <path d={cohortDensityLine} fill="none" stroke={CHART_COLORS.accent} strokeWidth={1.6} />

        {compareDensityLine ? (
          <path
            d={compareDensityLine}
            fill="none"
            stroke={CHART_COLORS.ink}
            strokeWidth={1.2}
            opacity={0.9}
          />
        ) : null}

        {globalMedian != null ? (
          <line
            x1={valueToX(globalMedian)}
            x2={valueToX(globalMedian)}
            y1={margin.top}
            y2={margin.top + usableHeight}
            stroke={CHART_COLORS.inkFaded}
            strokeDasharray="3 3"
            strokeWidth={1}
          />
        ) : null}

        {cohortMedian != null ? (
          <>
            <polygon
              points={`${valueToX(cohortMedian)},${margin.top + usableHeight + 2} ${valueToX(cohortMedian) - 5},${margin.top + usableHeight + 10} ${valueToX(cohortMedian) + 5},${margin.top + usableHeight + 10}`}
              fill={CHART_COLORS.accent}
            />
            {cohortCI ? (
              <line
                x1={valueToX(cohortCI.lower)}
                x2={valueToX(cohortCI.upper)}
                y1={margin.top + usableHeight + 13}
                y2={margin.top + usableHeight + 13}
                stroke={CHART_COLORS.accent}
                strokeWidth={1.5}
              />
            ) : null}
          </>
        ) : null}

        {compareMedian != null ? (
          <>
            <circle
              cx={valueToX(compareMedian)}
              cy={margin.top + usableHeight + 8}
              r={3.2}
              fill={CHART_COLORS.paper}
              stroke={CHART_COLORS.ink}
              strokeWidth={1.2}
            />
            {cohortMedian != null ? (
              <line
                x1={valueToX(cohortMedian)}
                x2={valueToX(compareMedian)}
                y1={margin.top + usableHeight + 8}
                y2={margin.top + usableHeight + 8}
                stroke={CHART_COLORS.rule}
                strokeWidth={1.2}
              />
            ) : null}
          </>
        ) : null}

        <text
          x={margin.left}
          y={stripHeight - 4}
          textAnchor="start"
          style={{
            fontFamily: CHART_FONT.mono,
            fontSize: 9,
            fill: CHART_COLORS.inkFaded,
          }}
        >
          min {Number.isFinite(min) ? min.toFixed(2) : "n/a"}
        </text>
        <text
          x={width - margin.right}
          y={stripHeight - 4}
          textAnchor="end"
          style={{
            fontFamily: CHART_FONT.mono,
            fontSize: 9,
            fill: CHART_COLORS.inkFaded,
          }}
        >
          max {Number.isFinite(max) ? max.toFixed(2) : "n/a"}
        </text>
      </svg>
    </div>
  );
}
