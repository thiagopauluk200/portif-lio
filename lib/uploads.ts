/**
 * Upload de imagens.
 *  • Produção (Vercel): Vercel Blob — ativado quando existe BLOB_READ_WRITE_TOKEN
 *    (criado pela integração Storage → Blob da Vercel).
 *  • Local: grava em public/uploads (servido pelo `npm run dev`).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
export type UploadKind = "project" | "avatar";

/**
 * Token do Vercel Blob. A integração pode criar a variável com prefixo personalizado
 * (ex.: IMAGENS_READ_WRITE_TOKEN), então também reconhecemos pelo formato do valor.
 */
export function blobTokenSource(): { name: string; value: string } | null {
  const direct = process.env.BLOB_READ_WRITE_TOKEN;
  if (direct) return { name: "BLOB_READ_WRITE_TOKEN", value: direct };
  for (const [k, v] of Object.entries(process.env)) {
    if (v && (k.endsWith("READ_WRITE_TOKEN") || v.startsWith("vercel_blob_rw_"))) return { name: k, value: v };
  }
  return null;
}

function blobToken(): string | undefined {
  return blobTokenSource()?.value;
}

/**
 * Modo novo da Vercel: o Blob é conectado sem token fixo. Só existe BLOB_STORE_ID
 * e a biblioteca se autentica sozinha com um token OIDC temporário gerado pela Vercel.
 */
export function blobUsesOidc() {
  return !blobToken() && Boolean(process.env.BLOB_STORE_ID) && Boolean(process.env.VERCEL);
}

function blobEnabled() {
  return Boolean(blobToken()) || blobUsesOidc();
}

export function uploadsAvailable() {
  return blobEnabled() || !process.env.VERCEL;
}

/** Identifica o formato pelos bytes iniciais — não confia no nome nem no Content-Type enviados. */
function sniff(b: Uint8Array): { ext: string; type: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", type: "image/png" };
  const ascii = (s: number, e: number) => String.fromCharCode(...b.slice(s, e));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { ext: "webp", type: "image/webp" };
  return null;
}

export async function saveImage(
  file: File,
  kind: UploadKind,
  origin: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (file.size === 0) return { ok: false, error: "Arquivo vazio" };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Imagem muito grande (máx. 3 MB)" };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = sniff(bytes);
  if (!format) return { ok: false, error: "Formato não suportado. Use JPG, PNG ou WebP." };

  const name = `${kind}/${randomUUID()}.${format.ext}`;

  if (blobEnabled()) {
    try {
      const blob = await put(`portfolio/${name}`, Buffer.from(bytes), {
        access: "public",
        contentType: format.type,
        addRandomSuffix: false,
        cacheControlMaxAge: 60 * 60 * 24 * 365,
        // Sem token explícito, a biblioteca usa OIDC + BLOB_STORE_ID.
        ...(blobToken() ? { token: blobToken() } : {}),
      });
      return { ok: true, url: blob.url };
    } catch (err) {
      const msg = (err as Error).message ?? "";
      console.error("[upload] falha no Vercel Blob:", msg);
      if (/private|access/i.test(msg)) {
        return { ok: false, error: "O Blob conectado é privado. Conecte um Blob Store com acesso Public." };
      }
      return { ok: false, error: `Falha no Vercel Blob: ${msg.slice(0, 200)}` };
    }
  }

  const dir = path.join(process.cwd(), "public", "uploads", kind);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(process.cwd(), "public", "uploads", name), bytes);
  return { ok: true, url: `${origin}/uploads/${name}` };
}
