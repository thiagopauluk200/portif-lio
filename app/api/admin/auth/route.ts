import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionToken,
  isAuthConfigured,
  isSameOrigin,
  verifyAdminKey,
} from "@/lib/auth";
import { badRequest, readJson, tooManyRequests } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Troca a chave secreta por um cookie de sessão. */
export async function POST(req: NextRequest) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_SECRET_KEY não configurada no servidor (mínimo 32 caracteres)." },
      { status: 503 },
    );
  }
  if (!isSameOrigin(req)) return badRequest("Origem inválida");

  const limit = await rateLimit(`login:${clientIp(req)}`, 5, 15 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const body = (await readJson(req)) as { key?: unknown } | undefined;
  const key = body?.key;
  if (typeof key !== "string" || key.length === 0 || key.length > 512) return badRequest("Informe a chave");

  if (!(await verifyAdminKey(key))) {
    await new Promise((r) => setTimeout(r, 600)); // desacelera tentativas automatizadas
    return NextResponse.json({ error: "Chave inválida" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}

/** Logout. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  return res;
}
