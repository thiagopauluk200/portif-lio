import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { badRequest, unauthorized } from "@/lib/http";
import { MAX_UPLOAD_BYTES, saveImage, uploadsAvailable, type UploadKind } from "@/lib/uploads";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!(await requireAdmin(req))) return unauthorized();
  if (!uploadsAvailable()) {
    return NextResponse.json(
      { error: "Upload não configurado. Crie um Blob Store no painel da Vercel (Storage → Blob)." },
      { status: 503 },
    );
  }
  if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 64 * 1024) {
    return badRequest("Imagem muito grande (máx. 3 MB)");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("Envio inválido");
  }
  const file = form.get("file");
  const kind = form.get("kind");
  if (!(file instanceof File)) return badRequest("Nenhuma imagem enviada");
  if (kind !== "project" && kind !== "avatar") return badRequest("Tipo inválido");

  const result = await saveImage(file, kind as UploadKind, req.nextUrl.origin);
  if (!result.ok) return badRequest(result.error);
  return NextResponse.json({ url: result.url }, { status: 201 });
}
