import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_STYLE, CHART_COLORS, GRID_STYLE, TOOLTIP_STYLE } from "./chart-config";

interface BarChartProps {
  /** Data with `name` (x-axis label) and `value` (bar height) */
  data: Array<{ name: string; value: number }>;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  height?: number;
}

export function SimpleBarChart({
  data,
  xLabel,
  yLabel,
  color = CHART_COLORS.accent,
  height = 360,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{ top: 8, right: 12, bottom: xLabel ? 32 : 8, left: yLabel ? 48 : 8 }}
      >
        <CartesianGrid vertical={false} {...GRID_STYLE} />
        <XAxis
          dataKey="name"
          {...AXIS_STYLE}
          label={
            xLabel
              ? {
                  value: xLabel,
                  position: "insideBottom",
                  offset: -20,
                  style: { ...AXIS_STYLE.tick, fontSize: 10 },
                }
              : undefined
          }
        />
        <YAxis
          {...AXIS_STYLE}
          label={
            yLabel
              ? {
                  value: yLabel,
                  angle: -90,
                  position: "insideLeft",
                  offset: -32,
                  style: { ...AXIS_STYLE.tick, fontSize: 10, textAnchor: "middle" },
                }
              : undefined
          }
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE.contentStyle}
          labelStyle={TOOLTIP_STYLE.labelStyle}
          itemStyle={TOOLTIP_STYLE.itemStyle}
          cursor={{ fill: CHART_COLORS.ruleLight }}
        />
        <Bar dataKey="value" name={yLabel ?? "Value"} fill={color} radius={0} maxBarSize={64} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
