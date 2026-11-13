import { redis } from "./redis";

/**
 * Rate limit de janela fixa.
 * Com Redis (produção), o contador é compartilhado entre todas as instâncias serverless.
 * Sem Redis (local), usa memória do processo.
 */
const buckets = new Map<string, { count: number; reset: number }>();

export async function rateLimit(key: string, limit: number, windowMs: number) {
  if (redis) {
    const k = `portfolio:rl:${key}`;
    const count = await redis.incr(k);
    if (count === 1) await redis.pexpire(k, windowMs);
    const ttl = await redis.pttl(k);
    return { ok: count <= limit, retryAfter: Math.max(1, Math.ceil(ttl / 1000)) };
  }

  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.reset <= now) {
    bucket = { count: 0, reset: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count++;
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.reset <= now) buckets.delete(k);
  }
  return { ok: bucket.count <= limit, retryAfter: Math.ceil((bucket.reset - now) / 1000) };
}

export function clientIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
