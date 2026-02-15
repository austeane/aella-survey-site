import { lineRadial } from "d3-shape";
import { scaleLinear } from "d3-scale";

import { CHART_COLORS, CHART_FONT } from "./chart-config";

export interface FingerprintAxisPoint {
  axis: string;
  value: number;
}

interface CohortFingerprintProps {
  points: FingerprintAxisPoint[];
  comparePoints?: FingerprintAxisPoint[];
  labelA?: string;
  labelB?: string;
  size?: number;
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function CohortFingerprint({
  points,
  comparePoints,
  labelA = "Group",
  labelB = "Comparison",
  size = 220,
}: CohortFingerprintProps) {
  const safePoints = points.length > 0 ? points : [];
  const radius = size / 2 - 26;
  const center = size / 2;
  const angleStep = (Math.PI * 2) / Math.max(1, safePoints.length);
  const radialScale = scaleLinear().domain([0, 100]).range([0, radius]);

  const toRadialPath = (values: FingerprintAxisPoint[]) => {
    const pathBuilder = lineRadial<FingerprintAxisPoint>()
      .radius((point) => radialScale(clamp(point.value)))
      .angle((_, index) => index * angleStep);

    const closedPath = pathBuilder(values);
    return closedPath ? `${closedPath}Z` : "";
  };

  const mainPath = toRadialPath(safePoints);
  const comparePath = comparePoints ? toRadialPath(comparePoints) : "";

  const ringLevels = [25, 50, 75, 100];

  return (
    <div className="border border-[var(--rule)] bg-[var(--paper)] px-10 py-2">
      <svg
        width={size}
        height={size}
        role="img"
        aria-label="Cohort fingerprint radar chart"
        style={{ overflow: "visible" }}
      >
        <g transform={`translate(${center}, ${center})`}>
          {ringLevels.map((level) => {
            const ringR = radialScale(level);
            const pointsForRing = safePoints.map((_, index) => {
              const angle = index * angleStep - Math.PI / 2;
              return `${Math.cos(angle) * ringR},${Math.sin(angle) * ringR}`;
            });

            return (
              <polygon
                key={level}
                points={pointsForRing.join(" ")}
                fill="none"
                stroke={level === 50 ? CHART_COLORS.rule : CHART_COLORS.ruleLight}
                strokeWidth={level === 50 ? 1.6 : 1}
              />
            );
          })}

          {safePoints.map((point, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <g key={point.axis}>
                <line x1={0} y1={0} x2={x} y2={y} stroke={CHART_COLORS.ruleLight} strokeWidth={1} />
                <text
                  x={Math.cos(angle) * (radius + 16)}
                  y={Math.sin(angle) * (radius + 16)}
                  textAnchor={Math.cos(angle) > 0.2 ? "start" : Math.cos(angle) < -0.2 ? "end" : "middle"}
                  dominantBaseline={Math.sin(angle) > 0.4 ? "hanging" : Math.sin(angle) < -0.4 ? "auto" : "middle"}
                  style={{
                    fontFamily: CHART_FONT.mono,
                    fontSize: 9,
                    fill: CHART_COLORS.inkLight,
                  }}
                >
                  {point.axis}
                </text>
              </g>
            );
          })}

          {mainPath ? (
            <path
              d={mainPath}
              fill={"color-mix(in srgb, var(--accent) 20%, transparent)"}
              stroke={CHART_COLORS.accent}
              strokeWidth={1.8}
            />
          ) : null}

          {comparePath ? (
            <path
              d={comparePath}
              fill={"color-mix(in srgb, var(--ink) 15%, transparent)"}
              stroke={CHART_COLORS.ink}
              strokeWidth={1.5}
            />
          ) : null}
        </g>
      </svg>

      <div className="mt-1 flex items-center gap-3 text-[0.64rem] font-['JetBrains_Mono',ui-monospace,monospace] uppercase tracking-[0.08em] text-[var(--ink-faded)]">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 bg-[var(--accent)]" />
          {labelA}
        </span>
        {comparePoints ? (
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 border border-[var(--ink)] bg-[var(--paper)]" />
            {labelB}
          </span>
        ) : null}
      </div>
    </div>
  );
}
