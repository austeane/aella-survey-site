import { createFileRoute } from "@tanstack/react-router";

import { getSchemaMetadata, listColumns } from "@/lib/schema/metadata";

const CACHE_SECONDS = 3_600;
const APP_BASE_URL_FALLBACK = "https://bks-explorer-production.up.railway.app";
const MCP_URL =
  process.env.BKS_MCP_URL ?? "https://bks-mcp-server-production.up.railway.app/mcp";

const MCP_TOOLS = [
  {
    name: "get_schema",
    description: "Returns row count, column metadata, and dataset-level details.",
  },
  {
    name: "get_stats",
    description: "Computes typed stats for a single column.",
  },
  {
    name: "cross_tabulate",
    description: "Builds a bounded cross-tab matrix for two columns.",
  },
  {
    name: "query_data",
    description: "Executes a bounded read-only DuckDB SQL query.",
  },
  {
    name: "search_columns",
    description: "Finds columns by case-insensitive substring match.",
  },
  {
    name: "query_analytics",
    description: "Queries event analytics through the authenticated `/api/analytics` proxy.",
  },
] as const;

function getAppBaseUrl(request: Request): string {
  try {
    const origin = new URL(request.url).origin;
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
    return `${origin}${base}`;
  } catch {
    return APP_BASE_URL_FALLBACK;
  }
}

function buildDocument(request: Request): string {
  const { dataset } = getSchemaMetadata();
  const columns = listColumns();
  const appBaseUrl = getAppBaseUrl(request);

  const columnLines = columns.map((column) => {
    const tags = column.tags.map((tag) => `\`${tag}\``).join(", ");
    return `- \`${column.name}\` | type: \`${column.logicalType}\` | tags: ${tags}`;
  });

  return [
    "# Big Kink Survey Explorer",
    "",
    "> AI-facing access docs for the BKS dataset via MCP and REST.",
    "",
    "## Dataset",
    `- Rows: ${dataset.rowCount.toLocaleString("en-US")}`,
    `- Columns (full schema): ${dataset.columnCount.toLocaleString("en-US")}`,
    `- Columns (visible in docs): ${columns.length.toLocaleString("en-US")}`,
    "- Table name: `data`",
    "- Read-only SQL: `SELECT`, `WITH`, `DESCRIBE`, `EXPLAIN`",
    "- Query limits: default `1000`, hard cap `10000`",
    "- Timeout: default `5000ms`, max `30000ms`",
    "- Envelope format:",
    "  - success: `{ ok: true, data, meta? }`",
    "  - error: `{ ok: false, error: { code, message, details? } }`",
    "",
    "## MCP Server",
    `- URL: ${MCP_URL}`,
    "- Transport: `streamable-http`",
    "- Tools:",
    ...MCP_TOOLS.map((tool) => `  - \`${tool.name}\`: ${tool.description}`),
    "",
    "### Claude Desktop",
    "```json",
    "{",
    '  "mcpServers": {',
    '    "bks": {',
    '      "type": "streamable-http",',
    `      "url": "${MCP_URL}"`,
    "    }",
    "  }",
    "}",
    "```",
    "",
    "### Cursor",
    "```json",
    "{",
    '  "mcpServers": {',
    '    "bks": {',
    '      "transport": "streamable-http",',
    `      "url": "${MCP_URL}"`,
    "    }",
    "  }",
    "}",
    "```",
    "",
    "## REST API",
    `- Base URL: ${appBaseUrl}`,
    "- `GET /api/health` -> health status + timestamp envelope",
    "- `GET /api/schema` -> dataset metadata + visible columns + caveat definitions",
    "- `POST /api/query` body: `{ sql: string, limit?: number }`",
    "- `GET /api/stats/:column` params: `column` path segment",
    "- `GET /api/crosstab` query: `x`, `y`, optional `limit`, optional `filters` (JSON)",
    "- `POST /api/events` body: `{ events: AnalyticsEvent[] }` (max 20 events)",
    "- `POST /api/analytics` body: `{ sql: string, limit?: number }` + header `x-bks-analytics-key`",
    "",
    "## Columns",
    ...columnLines,
    "",
    "## Optional",
    `- Web app: ${appBaseUrl}/`,
    `- About page: ${appBaseUrl}/about`,
    `- This file: ${appBaseUrl}/llms.txt`,
    "- Dataset source: https://zenodo.org/records/18625249",
    "",
  ].join("\n");
}

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return new Response(buildDocument(request), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
          },
        });
      },
    },
  },
});
