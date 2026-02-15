import { createFileRoute } from "@tanstack/react-router";

import { AnalyticsQueryRequestSchema } from "@/lib/api/contracts";
import { errorResponse, okResponse } from "@/lib/server/api-response";
import { analyticsGlobPath, hasAnalyticsFiles } from "@/lib/server/event-store";
import { QueryExecutionError, runQueryWithSetup } from "@/lib/server/db";
import { getClientIp, getUserAgent, logApiRequest } from "@/lib/server/logger";
import {
  applyLimitToQuery,
  clampLimit,
  ensureReadOnlySql,
  SqlGuardError,
} from "@/lib/server/sql-guards";

function durationMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

function sqlLiteral(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "''");
}

export const Route = createFileRoute("/api/analytics")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const startedAt = performance.now();
        const route = "/api/analytics";
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

        const expectedKey = process.env.BKS_ANALYTICS_KEY;
        if (!expectedKey) {
          log(503, "ANALYTICS_KEY_MISSING");
          return errorResponse(503, {
            code: "ANALYTICS_KEY_MISSING",
            message: "Analytics query API is not configured.",
          });
        }

        const providedKey = request.headers.get("x-bks-analytics-key");
        if (!providedKey || providedKey !== expectedKey) {
          log(401, "UNAUTHORIZED");
          return errorResponse(401, {
            code: "UNAUTHORIZED",
            message: "Missing or invalid analytics API key.",
          });
        }

        let rawBody: unknown;
        try {
          rawBody = await request.json();
        } catch {
          log(400, "INVALID_JSON");
          return errorResponse(400, {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON.",
          });
        }

        const parsedBody = AnalyticsQueryRequestSchema.safeParse(rawBody);
        if (!parsedBody.success) {
          log(400, "INVALID_REQUEST");
          return errorResponse(400, {
            code: "INVALID_REQUEST",
            message: "Request payload failed validation.",
            details: parsedBody.error.flatten(),
          });
        }

        const { sql, limit: requestedLimit } = parsedBody.data;
        const limit = clampLimit(requestedLimit);

        let readOnlySql: string;
        try {
          readOnlySql = ensureReadOnlySql(sql);
        } catch (error) {
          if (error instanceof SqlGuardError) {
            log(400, error.code);
            return errorResponse(400, {
              code: error.code,
              message: error.message,
            });
          }

          log(400, "INVALID_SQL");
          return errorResponse(400, {
            code: "INVALID_SQL",
            message: "SQL validation failed.",
          });
        }

        const boundedSql = applyLimitToQuery(readOnlySql, limit);

        const hasEvents = await hasAnalyticsFiles();
        if (!hasEvents) {
          log(200, undefined, {
            limit,
            rowCount: 0,
            noFiles: true,
          });
          return okResponse(
            {
              columns: [],
              rows: [],
            },
            {
              limit,
              rowCount: 0,
              noFiles: true,
            },
          );
        }

        const eventsViewStatement = `
          CREATE OR REPLACE TEMP VIEW events AS
          SELECT * FROM read_json_auto('${sqlLiteral(analyticsGlobPath())}')
        `;

        try {
          const result = await runQueryWithSetup(boundedSql, {
            setupStatements: [eventsViewStatement],
          });

          log(200, undefined, {
            limit,
            rowCount: result.rows.length,
            queryKind: readOnlySql.split(/\s+/)[0]?.toUpperCase() ?? "UNKNOWN",
          });

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
            log(status, error.code);
            return errorResponse(status, {
              code: error.code,
              message: error.message,
            });
          }

          log(500, "ANALYTICS_QUERY_FAILED");
          return errorResponse(500, {
            code: "ANALYTICS_QUERY_FAILED",
            message: "Failed to execute analytics query.",
          });
        }
      },
    },
  },
});
