import { createFileRoute } from "@tanstack/react-router";

import {
  AnalyticsEventBatchRequestSchema,
  AnalyticsEventV1Schema,
} from "@/lib/api/contracts";
import { errorResponse, okResponse } from "@/lib/server/api-response";
import { appendEvents } from "@/lib/server/event-store";
import { getClientIp, getUserAgent, logApiRequest } from "@/lib/server/logger";
import { checkEventIngestionRateLimit } from "@/lib/server/rate-limit";

const MAX_EVENTS_PAYLOAD_BYTES = 64 * 1024;

function durationMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

export const Route = createFileRoute("/api/events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const startedAt = performance.now();
        const route = "/api/events";
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

        let rawText: string;
        try {
          rawText = await request.text();
        } catch {
          log(400, "INVALID_JSON");
          return errorResponse(400, {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON.",
          });
        }

        if (Buffer.byteLength(rawText, "utf8") > MAX_EVENTS_PAYLOAD_BYTES) {
          log(413, "PAYLOAD_TOO_LARGE");
          return errorResponse(413, {
            code: "PAYLOAD_TOO_LARGE",
            message: "Analytics event payload exceeds 64KB.",
          });
        }

        let rawBody: unknown;
        try {
          rawBody = rawText.length > 0 ? JSON.parse(rawText) : {};
        } catch {
          log(400, "INVALID_JSON");
          return errorResponse(400, {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON.",
          });
        }

        const parsedBatch = AnalyticsEventBatchRequestSchema.safeParse(rawBody);
        if (!parsedBatch.success) {
          log(400, "INVALID_REQUEST");
          return errorResponse(400, {
            code: "INVALID_REQUEST",
            message: "Request payload failed validation.",
            details: parsedBatch.error.flatten(),
          });
        }

        const rateLimit = checkEventIngestionRateLimit(ip);
        if (!rateLimit.allowed) {
          log(429, "RATE_LIMITED");
          return errorResponse(429, {
            code: "RATE_LIMITED",
            message: "Too many analytics batches from this IP. Please retry shortly.",
          });
        }

        const receivedAt = new Date().toISOString();
        const trimmedUserAgent = userAgent?.slice(0, 512);

        const events = parsedBatch.data.events.map((event) =>
          AnalyticsEventV1Schema.parse({
            ...event,
            v: 1,
            received_at: receivedAt,
            user_agent: trimmedUserAgent,
          }),
        );

        try {
          await appendEvents(events);
        } catch {
          log(500, "EVENT_APPEND_FAILED");
          return errorResponse(500, {
            code: "EVENT_APPEND_FAILED",
            message: "Failed to store analytics events.",
          });
        }

        const accepted = events.length;
        log(202, undefined, {
          accepted,
          remaining: rateLimit.remaining,
        });

        return okResponse(
          { accepted },
          {
            remaining: rateLimit.remaining,
          },
          202,
        );
      },
    },
  },
});
