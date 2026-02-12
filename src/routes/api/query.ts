import { createFileRoute } from "@tanstack/react-router";
import { QueryRequestSchema } from "@/lib/api/contracts";
import { errorResponse, okResponse } from "@/lib/server/api-response";
import { QueryExecutionError, runQuery } from "@/lib/server/db";
import {
  applyLimitToQuery,
  clampLimit,
  ensureReadOnlySql,
  SqlGuardError,
} from "@/lib/server/sql-guards";

export const Route = createFileRoute("/api/query")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let rawBody: unknown;
        try {
          rawBody = await request.json();
        } catch {
          return errorResponse(400, {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON.",
          });
        }

        const parsedBody = QueryRequestSchema.safeParse(rawBody);
        if (!parsedBody.success) {
          return errorResponse(400, {
            code: "INVALID_REQUEST",
            message: "Request payload failed validation.",
            details: parsedBody.error.flatten(),
          });
        }

        const requestData = parsedBody.data;
        const limit = clampLimit(requestData.limit);

        let readOnlySql: string;
        try {
          readOnlySql = ensureReadOnlySql(requestData.sql);
        } catch (error) {
          if (error instanceof SqlGuardError) {
            return errorResponse(400, {
              code: error.code,
              message: error.message,
            });
          }

          return errorResponse(400, {
            code: "INVALID_SQL",
            message: "SQL validation failed.",
          });
        }

        const boundedSql = applyLimitToQuery(readOnlySql, limit);

        try {
          const result = await runQuery(boundedSql);

          return okResponse(
            {
              columns: result.columns,
              rows: result.rows,
            },
            {
              limit,
              rowCount: result.rows.length,
              queryKind: readOnlySql.split(/\s+/)[0]?.toUpperCase() ?? "UNKNOWN",
            },
          );
        } catch (error) {
          if (error instanceof QueryExecutionError) {
            const status = error.code === "QUERY_TIMEOUT" ? 408 : 400;
            return errorResponse(status, {
              code: error.code,
              message: error.message,
            });
          }

          return errorResponse(500, {
            code: "QUERY_FAILED",
            message: "Query execution failed.",
          });
        }
      },
    },
  },
});
