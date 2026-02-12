import { createFileRoute } from "@tanstack/react-router";
import { okResponse } from "@/lib/server/api-response";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        return okResponse(
          {
            status: "healthy",
            timestamp: new Date().toISOString(),
          },
          undefined,
          200,
        );
      },
    },
  },
});
