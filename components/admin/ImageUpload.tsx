"use client";

import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reduz e recomprime a foto no próprio aparelho antes de enviar.
 * Uma foto de celular de 3–12 MB vira algo em torno de 150–400 KB.
 */
async function compress(file: File, maxSide: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.82));
  // WebP quando o navegador suporta; senão (Safari antigo) cai para JPEG.
  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await toBlob("image/jpeg");
  if (!jpeg) throw new Error("Não foi possível processar a imagem");
  return jpeg;
}

export function ImageUpload({
  value,
  onChange,
  kind,
  label,
  shape = "wide",
}: {
  value: string;
  onChange: (url: string) => void;
  kind: "project" | "avatar";
  label: string;
  shape?: "wide" | "square";
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const blob = await compress(file, kind === "avatar" ? 800 : 1600);
      const form = new FormData();
      form.append("file", blob, `imagem.${blob.type === "image/webp" ? "webp" : "jpg"}`);
      form.append("kind", kind);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) window.location.href = "/admin/login";
      if (!res.ok) throw new Error(json.error ?? "Falha no envio");
      onChange(json.url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <span className="mb-1.5 block text-sm text-zinc-300">{label}</span>
      <div className={cn("flex gap-4", shape === "wide" ? "flex-col" : "items-center")}>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className={cn(
            "group relative grid shrink-0 place-items-center overflow-hidden border border-dashed border-line bg-ink-800/60 text-muted transition hover:border-accent/50 hover:text-accent",
            shape === "wide" ? "aspect-[16/9] w-full rounded-2xl" : "size-28 rounded-2xl",
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 p-4 text-center text-sm">
              <ImagePlus className="size-6" />
              Toque para escolher uma foto
            </span>
          )}
          {busy && (
            <span className="absolute inset-0 grid place-items-center bg-ink-950/70 text-white">
              <LoaderCircle className="size-6 animate-spin" />
            </span>
          )}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="rounded-full border border-line px-4 py-2 text-sm transition hover:bg-white/5 disabled:opacity-50"
          >
            {busy ? "Enviando..." : value ? "Trocar imagem" : "Escolher imagem"}
          </button>
          {value && !busy && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted transition hover:text-red-400"
            >
              <Trash2 className="size-4" /> Remover
            </button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />
    </div>
  );
}
