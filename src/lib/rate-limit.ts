/**
 * Simple in-memory rate limiter using a sliding window counter.
 * Designed for Edge Runtime compatibility (no Node.js-specific APIs).
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks
const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  store.forEach((entry, key) => {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  });
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Check if a request should be rate limited.
 * @param key - Unique identifier (e.g., IP address or IP + path)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed and remaining quota
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    store.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, limit: config.limit, remaining: config.limit - 1, resetTime: now + config.windowMs };
  }

  entry.count++;

  if (entry.count > config.limit) {
    return { allowed: false, limit: config.limit, remaining: 0, resetTime: entry.resetTime };
  }

  return { allowed: true, limit: config.limit, remaining: config.limit - entry.count, resetTime: entry.resetTime };
}

// Pre-configured rate limits for different endpoint categories
export const RATE_LIMITS = {
  api: { limit: 100, windowMs: 60_000 } as RateLimitConfig,        // 100 req/min
  webhook: { limit: 30, windowMs: 60_000 } as RateLimitConfig,     // 30 req/min
  upload: { limit: 10, windowMs: 60_000 } as RateLimitConfig,      // 10 req/min
  sse: { limit: 5, windowMs: 60_000 } as RateLimitConfig,          // 5 connections/min
} as const;
