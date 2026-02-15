import { scaleLinear } from "d3-scale";

/** Ink & Paper chart styling tokens */
export const CHART_COLORS = {
  ink: "#1a1612",
  inkLight: "#4a4238",
  inkFaded: "#8a7e70",
  paper: "#f5f0e8",
  paperWarm: "#ede6d8",
  accent: "#b8432f",
  accentHover: "#9a3625",
  rule: "#c8bfb0",
  ruleLight: "#ddd5c8",
  highlight: "#e8d5a0",
} as const;

export const CHART_FONT = {
  display: "'Fraunces', Georgia, serif",
  body: "'Source Serif 4', Georgia, serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

/** Compare-mode color helpers */
export const COMPARE_COLORS = {
  groupA: CHART_COLORS.accent,
  groupB: CHART_COLORS.ink,
  groupAFill: "color-mix(in srgb, var(--accent) 22%, transparent)",
  groupBFill: "color-mix(in srgb, var(--ink) 16%, transparent)",
} as const;

/** Common Recharts style props */
export const AXIS_STYLE = {
  tick: {
    fontFamily: CHART_FONT.mono,
    fontSize: 11,
    fill: CHART_COLORS.inkLight,
  },
  axisLine: {
    stroke: CHART_COLORS.ink,
    strokeWidth: 1,
  },
  tickLine: {
    stroke: CHART_COLORS.rule,
  },
} as const;

export const GRID_STYLE = {
  stroke: CHART_COLORS.ruleLight,
  strokeDasharray: "3 3",
} as const;

export const TOOLTIP_STYLE = {
  contentStyle: {
    background: CHART_COLORS.paper,
    border: `1px solid ${CHART_COLORS.ink}`,
    borderRadius: 0,
    fontFamily: CHART_FONT.mono,
    fontSize: 12,
    padding: "8px 12px",
  },
  labelStyle: {
    fontFamily: CHART_FONT.mono,
    fontSize: 11,
    fontWeight: 600,
    color: CHART_COLORS.ink,
    marginBottom: 4,
  },
  itemStyle: {
    fontFamily: CHART_FONT.mono,
    fontSize: 11,
    color: CHART_COLORS.inkLight,
    padding: 0,
  },
} as const;

/** Color palette for series in multi-series charts */
export const SERIES_COLORS = [
  CHART_COLORS.accent,
  CHART_COLORS.ink,
  CHART_COLORS.inkLight,
  CHART_COLORS.highlight,
  CHART_COLORS.rule,
] as const;

export function createPercentScale(range: [number, number]) {
  return scaleLinear().domain([0, 100]).range(range).clamp(true);
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}
