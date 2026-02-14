import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { errorResponse, okResponse } from "@/lib/server/api-response";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { sendFeedbackEmail } from "@/lib/server/ses";

const FeedbackSchema = z.object({
  message: z.string().min(1, "Message is required").max(5000, "Message too long"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  page: z.string().max(500).optional(),
});

export const Route = createFileRoute("/api/feedback")({
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

        const parsed = FeedbackSchema.safeParse(rawBody);
        if (!parsed.success) {
          return errorResponse(400, {
            code: "INVALID_REQUEST",
            message: "Validation failed.",
            details: parsed.error.flatten(),
          });
        }

        const ip =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip") ??
          "unknown";

        const { allowed } = checkRateLimit(ip);
        if (!allowed) {
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
          return okResponse({ sent: true });
        } catch {
          return errorResponse(500, {
            code: "SEND_FAILED",
            message: "Failed to send feedback. Please try again later.",
          });
        }
      },
    },
  },
});
