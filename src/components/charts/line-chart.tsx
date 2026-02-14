import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_STYLE, CHART_COLORS, GRID_STYLE, TOOLTIP_STYLE } from "./chart-config";

interface LineChartProps {
  /** Data with `name` (x-axis) and `value` (y-axis) */
  data: Array<{ name: string | number; value: number }>;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  height?: number;
}

export function SimpleLineChart({
  data,
  xLabel,
  yLabel,
  color = CHART_COLORS.accent,
  height = 360,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={data}
        margin={{ top: 8, right: 12, bottom: xLabel ? 32 : 8, left: yLabel ? 48 : 8 }}
      >
        <CartesianGrid {...GRID_STYLE} />
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
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{
            fill: color,
            stroke: CHART_COLORS.paper,
            strokeWidth: 2,
            r: 4,
          }}
          activeDot={{
            fill: color,
            stroke: CHART_COLORS.ink,
            strokeWidth: 2,
            r: 6,
          }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
