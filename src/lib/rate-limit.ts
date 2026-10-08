import type { NextRequest } from 'next/server';

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Adequate for single-instance deployments (the current setup). If the app is
 * ever scaled to multiple instances, move the counters to a shared store
 * (e.g. Redis).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as unknown as {
  __gahRateLimitBuckets: Map<string, Bucket> | undefined;
};

const buckets: Map<string, Bucket> =
  globalForRateLimit.__gahRateLimitBuckets ?? new Map<string, Bucket>();
globalForRateLimit.__gahRateLimitBuckets = buckets;

// Opportunistic cleanup so the map cannot grow without bound.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets (only meaningful when `ok` is false). */
  retryAfterSec: number;
}

/**
 * Consume one unit from the bucket identified by `key`.
 * Returns `ok: false` when the caller is over the limit.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { ok: true, retryAfterSec: 0 };
}

/** Best-effort client IP for rate-limit keying (proxy headers first). */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

/** Standard 429 response for over-limit requests. */
export function tooManyRequests(retryAfterSec: number) {
  return Response.json(
    { success: false, error: 'Too many requests. Please try again shortly.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
  );
}
