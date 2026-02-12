import type { ApiError } from "@/lib/api/contracts";

const defaultHeaders = {
  "Content-Type": "application/json",
};

export function jsonResponse(payload: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  });
}

export function okResponse(data: unknown, meta?: Record<string, unknown>, status = 200) {
  return jsonResponse(
    {
      ok: true,
      data,
      ...(meta ? { meta } : {}),
    },
    status,
  );
}

export function errorResponse(status: number, error: ApiError) {
  return jsonResponse(
    {
      ok: false,
      error,
    },
    status,
  );
}
