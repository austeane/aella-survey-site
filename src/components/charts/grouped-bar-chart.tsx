import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_STYLE, CHART_COLORS, CHART_FONT, GRID_STYLE, SERIES_COLORS, TOOLTIP_STYLE } from "./chart-config";

interface SeriesConfig {
  key: string;
  label: string;
  color: string;
}

interface GroupedBarChartProps {
  /** Data rows. Each row must have a `group_key` field plus numeric fields for each series. */
  data: Array<Record<string, unknown>>;
  /** Series definitions: which keys to render as bars, their labels and colors. */
  series: SeriesConfig[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
}

export function GroupedBarChart({
  data,
  series,
  xLabel,
  yLabel,
  height = 360,
}: GroupedBarChartProps) {
  const resolvedSeries = series.map((s, i) => ({
    ...s,
    color: s.color || SERIES_COLORS[i % SERIES_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{ top: 8, right: 12, bottom: xLabel ? 32 : 8, left: yLabel ? 48 : 8 }}
      >
        <CartesianGrid vertical={false} {...GRID_STYLE} />
        <XAxis
          dataKey="group_key"
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
        <Legend
          iconType="square"
          wrapperStyle={{
            fontFamily: CHART_FONT.body,
            fontSize: 12,
            paddingTop: 8,
            lineHeight: "1.2",
          }}
        />
        {resolvedSeries.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={0} maxBarSize={48} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
