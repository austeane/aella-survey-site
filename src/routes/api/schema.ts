import { createFileRoute } from "@tanstack/react-router";
import { SchemaDataSchema } from "@/lib/api/contracts";
import { okResponse } from "@/lib/server/api-response";
import {
  CAVEAT_DEFINITIONS,
  GLOBAL_CAVEAT_KEYS,
} from "@/lib/schema/caveats";
import { getSchemaMetadata, listColumnsWithCaveats } from "@/lib/schema/metadata";

export const Route = createFileRoute("/api/schema")({
  server: {
    handlers: {
      GET: async () => {
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

        return okResponse(data, {
          cacheTtlSeconds: 3_600,
        });
      },
    },
  },
});
