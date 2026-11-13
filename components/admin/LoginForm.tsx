"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, LoaderCircle, ShieldCheck, TriangleAlert } from "lucide-react";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Falha na autenticação");
      setKey("");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-dvh place-items-center px-5">
      <div aria-hidden className="bg-grid absolute inset-0" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md rounded-3xl border border-line bg-ink-900/90 p-8 shadow-2xl shadow-black/50 backdrop-blur"
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-accent/10 text-accent">
          <ShieldCheck className="size-6" />
        </span>
        <h1 className="mt-6 text-2xl font-medium">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted">
          Informe a chave de administrador definida em <code className="font-mono text-zinc-300">ADMIN_SECRET_KEY</code>.
        </p>

        {!configured ? (
          <p className="mt-6 flex gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
            <TriangleAlert className="size-5 shrink-0" />
            A variável ADMIN_SECRET_KEY não está configurada no servidor (mínimo 32 caracteres). Veja o README.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="sr-only">Chave de administrador</span>
              <div className="flex items-center gap-3 rounded-2xl border border-line bg-ink-800/60 px-4 transition focus-within:border-accent/60 focus-within:ring-4 focus-within:ring-accent/10">
                <KeyRound className="size-4 shrink-0 text-muted" />
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                  required
                  placeholder="••••••••••••••••••••••••"
                  className="w-full bg-transparent py-3.5 font-mono text-sm outline-none placeholder:text-zinc-700"
                />
              </div>
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !key}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 font-medium text-ink-950 transition hover:brightness-110 disabled:opacity-50"
            >
              {loading && <LoaderCircle className="size-4 animate-spin" />}
              Entrar no painel
            </button>
          </form>
        )}
        <p className="mt-6 text-xs text-muted">
          Sessão protegida por cookie httpOnly assinado (8h). Tentativas limitadas a 5 a cada 15 minutos.
        </p>
      </motion.div>
    </main>
  );
}
