/**
 * Rate limiter em memória (janela fixa). Suficiente para uma instância única.
 * Em ambientes serverless com várias instâncias, troque por Upstash Redis / KV.
 */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
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
