import { createFileRoute } from "@tanstack/react-router";

import { CrosstabDataSchema, CrosstabRequestSchema } from "@/lib/api/contracts";
import { errorResponse, okResponse } from "@/lib/server/api-response";
import { QueryExecutionError, runQuery } from "@/lib/server/db";
import { getClientIp, getUserAgent, logApiRequest } from "@/lib/server/logger";
import {
  buildWhereClause,
  clampLimit,
  quoteIdentifier,
} from "@/lib/server/sql-guards";
import { getColumnMetadata } from "@/lib/schema/metadata";

function durationMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

export const Route = createFileRoute("/api/crosstab")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const startedAt = performance.now();
        const route = "/api/crosstab";
        const method = request.method;
        const ip = getClientIp(request);
        const userAgent = getUserAgent(request);

        const log = (status: number, errorCode?: string, meta?: Record<string, unknown>) => {
          logApiRequest({
            route,
            method,
            status,
            durationMs: durationMs(startedAt),
            errorCode,
            ip,
            userAgent,
            meta,
          });
        };

        const url = new URL(request.url);

        const rawLimit = url.searchParams.get("limit");
        const rawFilters = url.searchParams.get("filters");

        let parsedFilters: unknown;
        if (rawFilters) {
          try {
            parsedFilters = JSON.parse(rawFilters);
          } catch {
            log(400, "INVALID_FILTERS");
            return errorResponse(400, {
              code: "INVALID_FILTERS",
              message: "filters must be valid JSON.",
            });
          }
        }

        const requestParams = CrosstabRequestSchema.safeParse({
          x: url.searchParams.get("x") ?? "",
          y: url.searchParams.get("y") ?? "",
          limit: rawLimit ? Number(rawLimit) : undefined,
          filters: parsedFilters,
        });

        if (!requestParams.success) {
          log(400, "INVALID_REQUEST");
          return errorResponse(400, {
            code: "INVALID_REQUEST",
            message: "Query parameters failed validation.",
            details: requestParams.error.flatten(),
          });
        }

        const { x, y, filters } = requestParams.data;
        const limit = clampLimit(requestParams.data.limit, 200);

        const xMeta = getColumnMetadata(x);
        const yMeta = getColumnMetadata(y);

        if (!xMeta || !yMeta) {
          log(404, "COLUMN_NOT_FOUND");
          return errorResponse(404, {
            code: "COLUMN_NOT_FOUND",
            message: "x or y column was not found in schema metadata.",
          });
        }

        const whereClause = buildWhereClause(filters);
        const sql = `
          SELECT
            ${quoteIdentifier(x)} AS x,
            ${quoteIdentifier(y)} AS y,
            count(*)::BIGINT AS count
          FROM data
          ${whereClause}
          GROUP BY 1, 2
          ORDER BY count DESC
          LIMIT ${limit}
        `;

        try {
          const result = await runQuery(sql);
          const rows = result.rows.map((row) => ({
            x: (row[0] ?? null) as string | number | boolean | null,
            y: (row[1] ?? null) as string | number | boolean | null,
            count: Number(row[2] ?? 0),
          }));

          const data = CrosstabDataSchema.parse({
            x,
            y,
            rows,
          });

          log(200, undefined, {
            limit,
            rowCount: rows.length,
          });

          return okResponse(data, {
            limit,
            rowCount: rows.length,
          });
        } catch (error) {
          if (error instanceof QueryExecutionError) {
            const status = error.code === "QUERY_TIMEOUT" ? 408 : 400;
            log(status, error.code);
            return errorResponse(status, {
              code: error.code,
              message: error.message,
            });
          }

          log(500, "CROSSTAB_FAILED");
          return errorResponse(500, {
            code: "CROSSTAB_FAILED",
            message: "Failed to execute crosstab query.",
          });
        }
      },
    },
  },
});
