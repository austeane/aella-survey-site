import { AnalyticsEventInputSchema, type AnalyticsEventInput } from "@/lib/api/contracts";

const SESSION_STORAGE_KEY = "bks.analytics.session_id.v1";
const MAX_BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 2_000;

export type TrackEventName = AnalyticsEventInput["event"];

export interface TrackEvent {
  event: TrackEventName;
  page?: string;
  action?: string;
  label?: string;
  value?: number;
  error_code?: string;
}

let queue: AnalyticsEventInput[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;
let lifecycleHooksAttached = false;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function apiEndpoint(): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalized = base.replace(/^\/+|\/+$/g, "");
  const prefix = normalized.length > 0 ? `/${normalized}` : "";
  return `${prefix}/api/events`;
}

function fallbackSessionId(): string {
  return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionId(): string {
  if (!isBrowser()) {
    return "server";
  }

  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const next =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : fallbackSessionId();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, next);
  return next;
}

function toEventPayload(event: TrackEvent): AnalyticsEventInput | null {
  if (!isBrowser()) {
    return null;
  }

  const candidate = {
    event: event.event,
    page: (event.page ?? window.location.pathname).slice(0, 500),
    action: event.action?.slice(0, 120),
    label: event.label?.slice(0, 200),
    value: event.value,
    error_code: event.error_code?.slice(0, 120),
    session_id: getSessionId(),
    ts: new Date().toISOString(),
  };

  const parsed = AnalyticsEventInputSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

async function sendBatch(batch: AnalyticsEventInput[], useBeacon: boolean): Promise<boolean> {
  if (!isBrowser() || batch.length === 0) {
    return true;
  }

  const payload = JSON.stringify({ events: batch });

  if (useBeacon && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon(apiEndpoint(), blob)) {
      return true;
    }
  }

  try {
    await fetch(apiEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
      keepalive: useBeacon,
    });
    return true;
  } catch {
    return false;
  }
}

function scheduleFlush(): void {
  if (!isBrowser() || flushTimer) {
    return;
  }

  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushTrackedEvents();
  }, FLUSH_INTERVAL_MS);
}

function attachLifecycleHooks(): void {
  if (!isBrowser() || lifecycleHooksAttached) {
    return;
  }

  lifecycleHooksAttached = true;

  window.addEventListener("pagehide", () => {
    void flushTrackedEvents({ useBeacon: true });
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void flushTrackedEvents({ useBeacon: true });
    }
  });
}

export async function flushTrackedEvents({ useBeacon = false }: { useBeacon?: boolean } = {}): Promise<void> {
  if (!isBrowser() || flushing || queue.length === 0) {
    return;
  }

  flushing = true;

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  try {
    while (queue.length > 0) {
      const batch = queue.slice(0, MAX_BATCH_SIZE);
      queue = queue.slice(batch.length);

      const sent = await sendBatch(batch, useBeacon);
      if (!sent) {
        queue = [...batch, ...queue];
        break;
      }
    }
  } finally {
    flushing = false;
    if (queue.length > 0 && !useBeacon) {
      scheduleFlush();
    }
  }
}

export function track(event: TrackEvent): void {
  const payload = toEventPayload(event);
  if (!payload) {
    return;
  }

  attachLifecycleHooks();
  queue.push(payload);

  if (queue.length >= MAX_BATCH_SIZE) {
    void flushTrackedEvents();
    return;
  }

  scheduleFlush();
}
