import { useMemo } from "react";

import { formatNumber, formatPercent } from "@/lib/format";
import { formatValueWithLabel } from "@/lib/format-labels";
import { sortByOrdinalOrder } from "@/lib/schema/value-labels";

type PrimitiveValue = string | number | boolean | null;

export type PivotNormalization = "count" | "row" | "column" | "overall";

export interface PivotInputRow {
  x: PrimitiveValue;
  y: PrimitiveValue;
  count: number;
}

export interface PivotCellDetail {
  x: string;
  y: string;
  xIsOther: boolean;
  yIsOther: boolean;
  topXValues: string[];
  topYValues: string[];
  count: number;
  rowPercent: number;
  columnPercent: number;
  overallPercent: number;
  rowTotal: number;
  columnTotal: number;
  grandTotal: number;
}

interface PivotMatrixProps {
  rows: PivotInputRow[];
  topN: number;
  normalization: PivotNormalization;
  xColumnName?: string;
  yColumnName?: string;
  xValueLabels?: Record<string, string>;
  yValueLabels?: Record<string, string>;
  heatmap?: boolean;
  onCellClick?: (detail: PivotCellDetail) => void;
}

function label(value: PrimitiveValue): string {
  return value == null ? "NULL" : String(value);
}

/** Pick the top N keys by count, then sort them in ordinal/numeric order. */
function sortedTopKeys(totals: Map<string, number>, topN: number, columnName?: string): string[] {
  const topByCount = [...totals.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, topN)
    .map(([key]) => key);

  return sortByOrdinalOrder(columnName ?? "", topByCount);
}

/** Interpolate between paper cream and accent red for heatmap cells. */
function heatmapBg(intensity: number): string {
  // intensity 0..1 → cream to soft red
  const t = Math.max(0, Math.min(1, intensity));
  if (t < 0.01) return "transparent";
  // Paper: #f5f0e8 → Accent light: mix toward #b8432f
  const r = Math.round(245 + (184 - 245) * t);
  const g = Math.round(240 + (67 - 240) * t);
  const b = Math.round(232 + (47 - 232) * t);
  return `rgba(${r}, ${g}, ${b}, ${0.15 + t * 0.55})`;
}

function displayCellValue(
  normalization: PivotNormalization,
  count: number,
  rowTotal: number,
  columnTotal: number,
  grandTotal: number,
): string {
  if (normalization === "count") {
    return formatNumber(count);
  }

  if (normalization === "row") {
    return formatPercent(rowTotal > 0 ? (count / rowTotal) * 100 : 0, 1);
  }

  if (normalization === "column") {
    return formatPercent(columnTotal > 0 ? (count / columnTotal) * 100 : 0, 1);
  }

  return formatPercent(grandTotal > 0 ? (count / grandTotal) * 100 : 0, 1);
}

export function PivotMatrix({
  rows,
  topN,
  normalization,
  xColumnName,
  yColumnName,
  xValueLabels,
  yValueLabels,
  heatmap,
  onCellClick,
}: PivotMatrixProps) {
  const matrix = useMemo(() => {
    const xTotals = new Map<string, number>();
    const yTotals = new Map<string, number>();

    for (const row of rows) {
      const xValue = label(row.x);
      const yValue = label(row.y);
      xTotals.set(xValue, (xTotals.get(xValue) ?? 0) + row.count);
      yTotals.set(yValue, (yTotals.get(yValue) ?? 0) + row.count);
    }

    const topX = sortedTopKeys(xTotals, topN, xColumnName);
    const topY = sortedTopKeys(yTotals, topN, yColumnName);

    const topXSet = new Set(topX);
    const topYSet = new Set(topY);

    const hasOtherX = xTotals.size > topX.length;
    const hasOtherY = yTotals.size > topY.length;

    const xLabels = hasOtherX ? [...topX, "Other"] : topX;
    const yLabels = hasOtherY ? [...topY, "Other"] : topY;

    const cellCounts = new Map<string, number>();

    const resolveX = (value: string) => {
      if (topXSet.has(value)) return value;
      return hasOtherX ? "Other" : value;
    };

    const resolveY = (value: string) => {
      if (topYSet.has(value)) return value;
      return hasOtherY ? "Other" : value;
    };

    for (const row of rows) {
      const xValue = resolveX(label(row.x));
      const yValue = resolveY(label(row.y));
      const key = `${yValue}\u0000${xValue}`;
      cellCounts.set(key, (cellCounts.get(key) ?? 0) + row.count);
    }

    const rowTotals = new Map<string, number>();
    const columnTotals = new Map<string, number>();

    for (const yValue of yLabels) {
      let rowTotal = 0;
      for (const xValue of xLabels) {
        const count = cellCounts.get(`${yValue}\u0000${xValue}`) ?? 0;
        rowTotal += count;
        columnTotals.set(xValue, (columnTotals.get(xValue) ?? 0) + count);
      }
      rowTotals.set(yValue, rowTotal);
    }

    const grandTotal = [...rowTotals.values()].reduce((sum, value) => sum + value, 0);

    let maxCount = 0;
    for (const count of cellCounts.values()) {
      if (count > maxCount) maxCount = count;
    }

    return {
      xLabels,
      yLabels,
      topX,
      topY,
      cellCounts,
      rowTotals,
      columnTotals,
      grandTotal,
      maxCount,
    };
  }, [rows, topN, xColumnName, yColumnName]);

  if (matrix.grandTotal === 0) {
    return <p className="section-subtitle">No non-null rows are available for this pivot.</p>;
  }

  return (
    <div className="editorial-table-wrap">
      <table className="editorial-table">
        <thead>
          <tr>
            <th>Y \ X</th>
            {matrix.xLabels.map((xValue) => (
              <th key={xValue} className="numeric">
                {formatValueWithLabel(xValue, xValueLabels)}
              </th>
            ))}
            <th className="numeric">Row Total</th>
          </tr>
        </thead>
        <tbody>
          {matrix.yLabels.map((yValue) => {
            const rowTotal = matrix.rowTotals.get(yValue) ?? 0;

            return (
              <tr key={yValue}>
                <td>{formatValueWithLabel(yValue, yValueLabels)}</td>
                {matrix.xLabels.map((xValue) => {
                  const count = matrix.cellCounts.get(`${yValue}\u0000${xValue}`) ?? 0;
                  const columnTotal = matrix.columnTotals.get(xValue) ?? 0;
                  const detail: PivotCellDetail = {
                    x: xValue,
                    y: yValue,
                    xIsOther: xValue === "Other",
                    yIsOther: yValue === "Other",
                    topXValues: matrix.topX,
                    topYValues: matrix.topY,
                    count,
                    rowPercent: rowTotal > 0 ? (count / rowTotal) * 100 : 0,
                    columnPercent: columnTotal > 0 ? (count / columnTotal) * 100 : 0,
                    overallPercent: matrix.grandTotal > 0 ? (count / matrix.grandTotal) * 100 : 0,
                    rowTotal,
                    columnTotal,
                    grandTotal: matrix.grandTotal,
                  };

                  const cellBg = heatmap && matrix.maxCount > 0
                    ? heatmapBg(count / matrix.maxCount)
                    : undefined;

                  return (
                    <td
                      key={`${yValue}-${xValue}`}
                      className="numeric"
                      style={cellBg ? { backgroundColor: cellBg } : undefined}
                    >
                      <button
                        type="button"
                        className="mono-value cursor-pointer border-0 bg-transparent p-0 text-right hover:text-[var(--accent)]"
                        onClick={() => onCellClick?.(detail)}
                      >
                        {displayCellValue(
                          normalization,
                          count,
                          rowTotal,
                          columnTotal,
                          matrix.grandTotal,
                        )}
                      </button>
                    </td>
                  );
                })}
                <td className="numeric">{formatNumber(rowTotal)}</td>
              </tr>
            );
          })}
          <tr>
            <td>Total</td>
            {matrix.xLabels.map((xValue) => (
              <td key={`total-${xValue}`} className="numeric">
                {formatNumber(matrix.columnTotals.get(xValue) ?? 0)}
              </td>
            ))}
            <td className="numeric">{formatNumber(matrix.grandTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
