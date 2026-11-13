import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { unauthorized } from "@/lib/http";
import { redis, redisSource } from "@/lib/redis";

export const dynamic = "force-dynamic";

/** Diagnóstico (somente admin): mostra NOMES de variáveis, nunca valores. */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return unauthorized();

  let ping: string | null = null;
  if (redis) {
    try {
      ping = await redis.ping();
    } catch (err) {
      ping = `falhou: ${(err as Error).message}`;
    }
  }

  return NextResponse.json({
    armazenamento: redis ? "redis" : "arquivos",
    credenciaisRedis: redisSource,
    pingRedis: ping,
    vercel: Boolean(process.env.VERCEL),
    ambiente: process.env.VERCEL_ENV ?? "local",
    variaveisRelacionadas: Object.keys(process.env)
      .filter((k) => /KV|REDIS|UPSTASH/i.test(k))
      .sort(),
  });
}
