import { useMemo } from "react";

import { formatNumber, formatPercent } from "@/lib/format";

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
  minCellCount?: number;
  onCellClick?: (detail: PivotCellDetail) => void;
}

function label(value: PrimitiveValue): string {
  return value == null ? "NULL" : String(value);
}

function sortedTopKeys(totals: Map<string, number>, topN: number): string[] {
  return [...totals.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, topN)
    .map(([key]) => key);
}

function displayCellValue(
  normalization: PivotNormalization,
  count: number,
  rowTotal: number,
  columnTotal: number,
  grandTotal: number,
  minCellCount: number,
): string {
  if (count > 0 && count < minCellCount) {
    return "[suppressed]";
  }

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
  minCellCount = 10,
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

    const topX = sortedTopKeys(xTotals, topN);
    const topY = sortedTopKeys(yTotals, topN);

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

    return {
      xLabels,
      yLabels,
      cellCounts,
      rowTotals,
      columnTotals,
      grandTotal,
    };
  }, [rows, topN]);

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
                {xValue}
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
                <td>{yValue}</td>
                {matrix.xLabels.map((xValue) => {
                  const count = matrix.cellCounts.get(`${yValue}\u0000${xValue}`) ?? 0;
                  const columnTotal = matrix.columnTotals.get(xValue) ?? 0;
                  const detail: PivotCellDetail = {
                    x: xValue,
                    y: yValue,
                    count,
                    rowPercent: rowTotal > 0 ? (count / rowTotal) * 100 : 0,
                    columnPercent: columnTotal > 0 ? (count / columnTotal) * 100 : 0,
                    overallPercent: matrix.grandTotal > 0 ? (count / matrix.grandTotal) * 100 : 0,
                    rowTotal,
                    columnTotal,
                    grandTotal: matrix.grandTotal,
                  };

                  return (
                    <td key={`${yValue}-${xValue}`} className="numeric">
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
                          minCellCount,
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
