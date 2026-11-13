"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputCls =
  "w-full rounded-xl border border-line bg-ink-800/60 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-zinc-600 focus:border-accent/60 focus:ring-4 focus:ring-accent/10 aria-[invalid=true]:border-red-500/60";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
        <span className="text-zinc-300">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-sm text-zinc-300"
    >
      <span className={cn("relative h-6 w-11 rounded-full transition", checked ? "bg-accent" : "bg-ink-700")}>
        <span
          className={cn(
            "absolute top-1 size-4 rounded-full transition-all",
            checked ? "left-6 bg-ink-950" : "left-1 bg-white",
          )}
        />
      </span>
      {label}
    </button>
  );
}

/** Exclusão em dois cliques (sem confirm() bloqueante). */
export function DeleteButton({ onConfirm }: { onConfirm: () => Promise<void> }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!armed) return setArmed(true);
        setBusy(true);
        try {
          await onConfirm();
        } finally {
          setBusy(false);
          setArmed(false);
        }
      }}
      aria-label={armed ? "Confirmar exclusão" : "Excluir"}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm transition",
        armed ? "bg-red-500/15 text-red-400" : "text-muted hover:bg-white/5 hover:text-red-400",
      )}
    >
      {busy ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      {armed && "Confirmar?"}
    </button>
  );
}

export function SubmitBar({ saving, onCancel, isEdit }: { saving: boolean; onCancel: () => void; isEdit: boolean }) {
  return (
    <div className="sticky bottom-0 -mx-6 mt-8 flex justify-end gap-2 border-t border-line bg-ink-900/95 px-6 py-4 backdrop-blur">
      <button type="button" onClick={onCancel} className="rounded-full px-5 py-2.5 text-sm text-muted hover:text-white">
        Cancelar
      </button>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink-950 transition hover:brightness-110 disabled:opacity-60"
      >
        {saving && <LoaderCircle className="size-4 animate-spin" />}
        {isEdit ? "Salvar alterações" : "Criar"}
      </button>
    </div>
  );
}

export const splitList = (v: string, sep: RegExp = /,/) =>
  v
    .split(sep)
    .map((s) => s.trim())
    .filter(Boolean);
