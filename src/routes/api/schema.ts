import { createFileRoute } from "@tanstack/react-router";

import { SchemaDataSchema } from "@/lib/api/contracts";
import { okResponse, errorResponse } from "@/lib/server/api-response";
import { getClientIp, getUserAgent, logApiRequest } from "@/lib/server/logger";
import {
  CAVEAT_DEFINITIONS,
  GLOBAL_CAVEAT_KEYS,
} from "@/lib/schema/caveats";
import { getSchemaMetadata, listColumnsWithCaveats } from "@/lib/schema/metadata";

function durationMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

export const Route = createFileRoute("/api/schema")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const startedAt = performance.now();
        const route = "/api/schema";
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

        try {
          const schemaMetadata = getSchemaMetadata();
          const payload = {
            dataset: schemaMetadata.dataset,
            columns: listColumnsWithCaveats(),
            caveats: {
              global: GLOBAL_CAVEAT_KEYS,
              definitions: Object.values(CAVEAT_DEFINITIONS),
            },
          };

          const data = SchemaDataSchema.parse(payload);

          log(200, undefined, {
            columnCount: data.columns.length,
          });

          return okResponse(data, {
            cacheTtlSeconds: 3_600,
          });
        } catch {
          log(500, "SCHEMA_FAILED");
          return errorResponse(500, {
            code: "SCHEMA_FAILED",
            message: "Failed to build schema payload.",
          });
        }
      },
    },
  },
});
