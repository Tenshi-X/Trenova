// Best-effort per-client limiter for public endpoints. State lives in the serverless instance's memory, so it
// slows down floods from one client without being a hard global cap; it never needs a database.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-nf-client-connection-ip') || request.headers.get('x-forwarded-for') || '';
  return forwarded.split(',')[0].trim().slice(0, 64) || 'unknown';
}

/** Returns true when the request is allowed. `now` is injectable for tests. */
export function allowRequest(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  if (buckets.size > MAX_BUCKETS) {
    for (const [name, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(name);
    if (buckets.size > MAX_BUCKETS) buckets.clear();
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

export function resetRateLimits() { buckets.clear(); }
