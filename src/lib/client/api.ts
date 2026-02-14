import type { CrosstabData, QueryData, SchemaData, StatsData } from "@/lib/api/contracts";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
}

interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

async function fetchEnvelope<T>(url: string, init?: RequestInit): Promise<ApiSuccess<T>> {
  const response = await fetch(url, init);
  const envelope = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok || !envelope.ok) {
    const errorMessage = envelope.ok
      ? `Request failed with status ${response.status}`
      : `${envelope.error.code}: ${envelope.error.message}`;

    throw new Error(errorMessage);
  }

  return envelope;
}

export async function getSchema() {
  return fetchEnvelope<SchemaData>(`${API_BASE}/api/schema`, {
    method: "GET",
  });
}

export async function getStats(column: string) {
  return fetchEnvelope<StatsData>(`${API_BASE}/api/stats/${encodeURIComponent(column)}`, {
    method: "GET",
  });
}

export interface CrosstabParams {
  x: string;
  y: string;
  limit?: number;
  filters?: Record<
    string,
    string | number | boolean | null | Array<string | number | boolean | null>
  >;
}

export async function getCrosstab(params: CrosstabParams) {
  const url = new URL(`${API_BASE}/api/crosstab`, window.location.origin);
  url.searchParams.set("x", params.x);
  url.searchParams.set("y", params.y);

  if (params.limit) {
    url.searchParams.set("limit", String(params.limit));
  }

  if (params.filters && Object.keys(params.filters).length > 0) {
    url.searchParams.set("filters", JSON.stringify(params.filters));
  }

  return fetchEnvelope<CrosstabData>(url.toString(), {
    method: "GET",
  });
}

export interface QueryParams {
  sql: string;
  limit?: number;
}

export async function runQuery(params: QueryParams) {
  return fetchEnvelope<QueryData>(`${API_BASE}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
}
