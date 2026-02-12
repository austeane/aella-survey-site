import { createFileRoute } from "@tanstack/react-router";
import { StatsDataSchema } from "@/lib/api/contracts";
import { errorResponse, okResponse } from "@/lib/server/api-response";
import { QueryExecutionError, runQuery, runSingleRow } from "@/lib/server/db";
import { quoteIdentifier } from "@/lib/server/sql-guards";
import { getCaveatKeysForColumn } from "@/lib/schema/caveats";
import { getColumnMetadata } from "@/lib/schema/metadata";

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  return fallback;
}

function asNullableNumber(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  const numeric = asNumber(value, Number.NaN);
  return Number.isNaN(numeric) ? null : numeric;
}

export const Route = createFileRoute("/api/stats/$column")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const column = decodeURIComponent(params.column);
        const metadata = getColumnMetadata(column);

        if (!metadata) {
          return errorResponse(404, {
            code: "COLUMN_NOT_FOUND",
            message: `Column '${column}' not found.`,
          });
        }

        const quotedColumn = quoteIdentifier(column);

        try {
          const counts = await runSingleRow(
            `SELECT
                 count(*)::BIGINT AS total_count,
                 count(${quotedColumn})::BIGINT AS non_null_count,
                 (count(*) - count(${quotedColumn}))::BIGINT AS null_count
               FROM data`,
          );

          const totalCount = asNumber(counts.total_count, 0);
          const nonNullCount = asNumber(counts.non_null_count, 0);
          const nullCount = asNumber(counts.null_count, 0);

          if (metadata.logicalType === "numeric") {
            const numericSummary = await runSingleRow(
              `SELECT
                   avg(${quotedColumn})::DOUBLE AS mean,
                   stddev_samp(${quotedColumn})::DOUBLE AS stddev,
                   min(${quotedColumn})::DOUBLE AS min,
                   quantile_cont(${quotedColumn}, 0.25)::DOUBLE AS p25,
                   median(${quotedColumn})::DOUBLE AS median,
                   quantile_cont(${quotedColumn}, 0.75)::DOUBLE AS p75,
                   max(${quotedColumn})::DOUBLE AS max
                 FROM data
                 WHERE ${quotedColumn} IS NOT NULL`,
            );

            const data = StatsDataSchema.parse({
              column,
              logicalType: metadata.logicalType,
              caveatKeys: getCaveatKeysForColumn(column),
              stats: {
                kind: "numeric",
                totalCount,
                nonNullCount,
                nullCount,
                mean: asNullableNumber(numericSummary.mean),
                stddev: asNullableNumber(numericSummary.stddev),
                min: asNullableNumber(numericSummary.min),
                p25: asNullableNumber(numericSummary.p25),
                median: asNullableNumber(numericSummary.median),
                p75: asNullableNumber(numericSummary.p75),
                max: asNullableNumber(numericSummary.max),
              },
            });

            return okResponse(data);
          }

          const topValuesResult = await runQuery(
            `SELECT
                 cast(${quotedColumn} AS VARCHAR) AS value,
                 count(*)::BIGINT AS count
               FROM data
               WHERE ${quotedColumn} IS NOT NULL
               GROUP BY 1
               ORDER BY count DESC
               LIMIT 12`,
          );

          const topValues = topValuesResult.rows.map((row) => {
            const count = asNumber(row[1], 0);
            return {
              value: (row[0] ?? null) as string | number | boolean | null,
              count,
              percentage:
                nonNullCount > 0
                  ? Math.round((count / nonNullCount) * 10_000) / 100
                  : 0,
            };
          });

          const data = StatsDataSchema.parse({
            column,
            logicalType: metadata.logicalType,
            caveatKeys: getCaveatKeysForColumn(column),
            stats: {
              kind: "categorical",
              totalCount,
              nonNullCount,
              nullCount,
              topValues,
            },
          });

          return okResponse(data);
        } catch (error) {
          if (error instanceof QueryExecutionError) {
            return errorResponse(error.code === "QUERY_TIMEOUT" ? 408 : 400, {
              code: error.code,
              message: error.message,
            });
          }

          return errorResponse(500, {
            code: "STATS_FAILED",
            message: "Failed to compute column statistics.",
          });
        }
      },
    },
  },
});
