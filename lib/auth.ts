/**
 * Autenticação do painel admin — compatível com Edge Runtime (middleware) e Node.
 *
 * Modelo:
 *  1. A ÚNICA credencial é ADMIN_SECRET_KEY (variável de ambiente, nunca no código).
 *  2. O admin troca a chave por um cookie de sessão `httpOnly` + `SameSite=Strict`,
 *     assinado com HMAC-SHA256 (a própria chave é o segredo de assinatura).
 *     → trocar a chave invalida todas as sessões imediatamente.
 *  3. Automação/CLI pode usar `Authorization: Bearer <ADMIN_SECRET_KEY>`.
 *  4. Comparações em tempo constante; requisições mutáveis com cookie exigem mesma origem (anti-CSRF).
 */
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas
const MIN_KEY_LENGTH = 32;

const encoder = new TextEncoder();

function getSecret(): string | null {
  const key = process.env.ADMIN_SECRET_KEY;
  return key && key.length >= MIN_KEY_LENGTH ? key : null;
}

export function isAuthConfigured() {
  return getSecret() !== null;
}

async function hmac(key: string, data: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data)));
}

function toBase64Url(bytes: Uint8Array) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Compara a chave candidata com ADMIN_SECRET_KEY em tempo constante. */
export async function verifyAdminKey(candidate: string): Promise<boolean> {
  const secret = getSecret();
  if (!secret || !candidate) return false;
  // HMAC normaliza o tamanho → a comparação não vaza o comprimento da chave.
  const [a, b] = await Promise.all([hmac("key-compare", candidate), hmac("key-compare", secret)]);
  return timingSafeEqual(a, b);
}

/** Token: v1.<expiraEm>.<nonce>.<assinatura> */
export async function createSessionToken(): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error("ADMIN_SECRET_KEY não configurada");
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = toBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const payload = `v1.${exp}.${nonce}`;
  const sig = toBase64Url(await hmac(secret, `session:${payload}`));
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  const secret = getSecret();
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const payload = parts.slice(0, 3).join(".");
  const expected = toBase64Url(await hmac(secret, `session:${payload}`));
  return timingSafeEqual(encoder.encode(expected), encoder.encode(parts[3]));
}

/** Requisições mutáveis autenticadas por cookie precisam vir da mesma origem. */
export function isSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true; // clientes não-browser (curl) não enviam Origin e não sofrem CSRF
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Verificação completa usada no middleware E novamente em cada route handler (defesa em profundidade). */
export async function requireAdmin(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return verifyAdminKey(auth.slice(7).trim());
  }
  const valid = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!valid) return false;
  return SAFE_METHODS.has(req.method) || isSameOrigin(req);
}
