import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { errorResponse, okResponse } from "@/lib/server/api-response";
import { getClientIp, getUserAgent, logApiRequest } from "@/lib/server/logger";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { sendFeedbackEmail } from "@/lib/server/ses";

const FeedbackSchema = z.object({
  message: z.string().min(1, "Message is required").max(5000, "Message too long"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  page: z.string().max(500).optional(),
});

function durationMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}

export const Route = createFileRoute("/api/feedback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const startedAt = performance.now();
        const route = "/api/feedback";
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

        const parsed = FeedbackSchema.safeParse(rawBody);
        if (!parsed.success) {
          log(400, "INVALID_REQUEST");
          return errorResponse(400, {
            code: "INVALID_REQUEST",
            message: "Validation failed.",
            details: parsed.error.flatten(),
          });
        }

        const { allowed } = checkRateLimit(ip);
        if (!allowed) {
          log(429, "RATE_LIMITED");
          return errorResponse(429, {
            code: "RATE_LIMITED",
            message: "Too many feedback submissions. Please try again later.",
          });
        }

        try {
          await sendFeedbackEmail({
            message: parsed.data.message,
            email: parsed.data.email || undefined,
            page: parsed.data.page,
          });

          log(200, undefined, {
            hasEmail: Boolean(parsed.data.email),
          });
          return okResponse({ sent: true });
        } catch {
          log(500, "SEND_FAILED");
          return errorResponse(500, {
            code: "SEND_FAILED",
            message: "Failed to send feedback. Please try again later.",
          });
        }
      },
    },
  },
});
