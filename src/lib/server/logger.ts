/**
 * Lightweight structured JSON logger for Nitro server routes.
 *
 * We avoid pino because Nitro bundles server code and pino's worker-thread
 * transport breaks when bundled.  Plain `console.log` with JSON is sufficient
 * since Railway captures stdout and supports JSON field search.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const configuredLevel: LogLevel =
  (process.env.BKS_LOG_LEVEL as LogLevel | undefined) ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[configuredLevel];
}

function emit(level: LogLevel, data: Record<string, unknown>, msg?: string): void {
  if (!shouldLog(level)) return;

  const entry = {
    level: LEVEL_ORDER[level],
    time: new Date().toISOString(),
    ...data,
    ...(msg ? { msg } : {}),
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (data: Record<string, unknown>, msg?: string) => emit("debug", data, msg),
  info: (data: Record<string, unknown>, msg?: string) => emit("info", data, msg),
  warn: (data: Record<string, unknown>, msg?: string) => emit("warn", data, msg),
  error: (data: Record<string, unknown>, msg?: string) => emit("error", data, msg),
};

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
