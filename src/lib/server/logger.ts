import pino from "pino";

const DEFAULT_LOG_LEVEL = process.env.BKS_LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug");

export const logger = pino({
  level: DEFAULT_LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export interface ApiRequestLog {
  route: string;
  method: string;
  status: number;
  durationMs: number;
  errorCode?: string;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function getUserAgent(request: Request): string | undefined {
  return request.headers.get("user-agent") ?? undefined;
}

export function logApiRequest({ status, ...rest }: ApiRequestLog): void {
  const level: "error" | "warn" | "info" = status >= 500 ? "error" : status >= 400 ? "warn" : "info";

  logger[level](
    {
      status,
      ...rest,
    },
    "api_request",
  );
}
