import { createFileRoute } from "@tanstack/react-router";
import { CrosstabDataSchema, CrosstabRequestSchema } from "@/lib/api/contracts";
import { errorResponse, okResponse } from "@/lib/server/api-response";
import { QueryExecutionError, runQuery } from "@/lib/server/db";
import {
  buildWhereClause,
  clampLimit,
  quoteIdentifier,
} from "@/lib/server/sql-guards";
import { getColumnMetadata } from "@/lib/schema/metadata";

export const Route = createFileRoute("/api/crosstab")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);

        const rawLimit = url.searchParams.get("limit");
        const rawFilters = url.searchParams.get("filters");

        let parsedFilters: unknown;
        if (rawFilters) {
          try {
            parsedFilters = JSON.parse(rawFilters);
          } catch {
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

          return okResponse(data, {
            limit,
            rowCount: rows.length,
          });
        } catch (error) {
          if (error instanceof QueryExecutionError) {
            return errorResponse(error.code === "QUERY_TIMEOUT" ? 408 : 400, {
              code: error.code,
              message: error.message,
            });
          }

          return errorResponse(500, {
            code: "CROSSTAB_FAILED",
            message: "Failed to execute crosstab query.",
          });
        }
      },
    },
  },
});
