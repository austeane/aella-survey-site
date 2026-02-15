import { createFileRoute } from "@tanstack/react-router";

import { okResponse } from "@/lib/server/api-response";
import { getClientIp, getUserAgent, logger } from "@/lib/server/logger";

function durationMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const startedAt = performance.now();

        const response = okResponse(
          {
            status: "healthy",
            timestamp: new Date().toISOString(),
          },
          undefined,
          200,
        );

        logger.debug(
          {
            route: "/api/health",
            method: request.method,
            status: 200,
            durationMs: durationMs(startedAt),
            ip: getClientIp(request),
            userAgent: getUserAgent(request),
          },
          "api_request",
        );

        return response;
      },
    },
  },
});
