/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach per IP address.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 60 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60_000);

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request from the given identifier is allowed.
 * @param identifier - Unique key for the client (e.g., IP + route)
 * @param config - Rate limit configuration
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    // New window
    const resetAt = now + config.windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Get the client IP from a Next.js request.
 */
export function getClientIP(request: Request): string {
  const headers = request.headers;
  // X-Forwarded-For is set by most reverse proxies
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return '127.0.0.1';
}

/** Pre-configured rate limiters for common use cases */
export const RATE_LIMITS = {
  /** Standard API: 60 requests per minute */
  standard: { maxRequests: 60, windowMs: 60_000 },
  /** General API: 100 requests per minute */
  api: { maxRequests: 100, windowMs: 60_000 },
  /** Write operations: 30 requests per minute */
  write: { maxRequests: 30, windowMs: 60_000 },
  /** Webhook endpoints: 30 requests per minute */
  webhook: { maxRequests: 30, windowMs: 60_000 },
  /** File operations: 20 requests per minute */
  fileOps: { maxRequests: 20, windowMs: 60_000 },
  /** Auth-sensitive: 10 requests per minute */
  strict: { maxRequests: 10, windowMs: 60_000 },
  /** SSE connections: 5 per minute */
  sse: { maxRequests: 5, windowMs: 60_000 },
} as const;
