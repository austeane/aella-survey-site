interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  cleanupIntervalMs: number;
}

function createRateLimiter({
  windowMs,
  maxRequests,
  cleanupIntervalMs,
}: RateLimiterOptions): (ip: string) => RateLimitResult {
  const hits = new Map<string, number[]>();

  setInterval(() => {
    const cutoff = Date.now() - windowMs;

    for (const [ip, timestamps] of hits.entries()) {
      const validTimestamps = timestamps.filter((timestamp) => timestamp > cutoff);

      if (validTimestamps.length === 0) {
        hits.delete(ip);
      } else {
        hits.set(ip, validTimestamps);
      }
    }
  }, cleanupIntervalMs).unref();

  return (ip: string): RateLimitResult => {
    const now = Date.now();
    const cutoff = now - windowMs;
    const timestamps = (hits.get(ip) ?? []).filter((timestamp) => timestamp > cutoff);

    if (timestamps.length >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
      };
    }

    timestamps.push(now);
    hits.set(ip, timestamps);

    return {
      allowed: true,
      remaining: maxRequests - timestamps.length,
    };
  };
}

const feedbackLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
  cleanupIntervalMs: 10 * 60 * 1000,
});

const eventIngestionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  cleanupIntervalMs: 60 * 1000,
});

export function checkRateLimit(ip: string): RateLimitResult {
  return feedbackLimiter(ip);
}

export function checkEventIngestionRateLimit(ip: string): RateLimitResult {
  return eventIngestionLimiter(ip);
}
