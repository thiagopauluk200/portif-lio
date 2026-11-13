import { NextResponse, type NextRequest } from "next/server";
import type { ZodError } from "zod";

const MAX_BODY_BYTES = 64 * 1024;

export const unauthorized = () => NextResponse.json({ error: "Não autorizado" }, { status: 401 });
export const notFound = () => NextResponse.json({ error: "Não encontrado" }, { status: 404 });
export const badRequest = (msg = "Requisição inválida") => NextResponse.json({ error: msg }, { status: 400 });

export function validationError(error: ZodError) {
  return NextResponse.json(
    { error: "Verifique os campos destacados", fields: error.flatten().fieldErrors },
    { status: 422 },
  );
}

export function tooManyRequests(retryAfter: number) {
  return NextResponse.json(
    { error: `Muitas tentativas. Tente novamente em ${retryAfter}s.` },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

/** Lê JSON do corpo com limite de tamanho. Retorna `undefined` se inválido. */
export async function readJson(req: NextRequest): Promise<unknown> {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return undefined;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return undefined;
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
