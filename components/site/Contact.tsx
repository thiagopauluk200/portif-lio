"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, LoaderCircle, Mail, Send } from "lucide-react";
import type { Profile } from "@/lib/schemas";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Socials } from "./Socials";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "success" | "error";
type Fields = Partial<Record<"name" | "email" | "message", string[]>>;

const inputCls =
  "w-full rounded-2xl border border-line bg-ink-800/60 px-4 py-3.5 text-base outline-none transition placeholder:text-zinc-600 focus:border-accent/60 focus:bg-ink-800 focus:ring-4 focus:ring-accent/10";

export function Contact({ profile }: { profile: Profile }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Fields>({});
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus("loading");
    setError("");
    setFields({});
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFields(json.fields ?? {});
        throw new Error(json.error ?? "Não foi possível enviar.");
      }
      form.reset();
      setStatus("success");
    } catch (err) {
      setError((err as Error).message);
      setStatus("error");
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <section id="contato" className="container-x py-24">
      <SectionHeading index="04" eyebrow="Contato" title="Vamos construir algo *juntos*?" />

      <div className="grid gap-4 lg:grid-cols-5">
        <Reveal className="flex flex-col justify-between rounded-3xl border border-line bg-ink-900/80 p-7 sm:p-9 lg:col-span-2">
          <div>
            <p className="text-lg leading-relaxed text-zinc-300">
              Tem uma vaga, um projeto ou só quer trocar uma ideia? Estou{" "}
              <span className="text-accent">aberto a oportunidades</span>.
            </p>
            <div className="mt-8 rounded-2xl border border-line bg-ink-800/50 p-4">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
                <Mail className="size-3.5" /> E-mail
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <a href={`mailto:${profile.email}`} className="truncate text-lg hover:text-accent">
                  {profile.email}
                </a>
                <button
                  type="button"
                  onClick={copyEmail}
                  aria-label="Copiar e-mail"
                  className="grid size-9 shrink-0 place-items-center rounded-full border border-line text-muted transition hover:text-white"
                >
                  {copied ? <Check className="size-4 text-accent" /> : <Copy className="size-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-10">
            <p className="mb-3 text-sm text-muted">Ou me encontre em</p>
            <Socials socials={profile.socials} />
          </div>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-3">
          <form
            onSubmit={onSubmit}
            noValidate
            className="relative h-full space-y-4 rounded-3xl border border-line bg-ink-900/80 p-7 sm:p-9"
          >
            {/* Honeypot anti-spam (invisível para humanos) */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome" error={fields.name?.[0]}>
                <input name="name" required maxLength={80} autoComplete="name" placeholder="Seu nome" className={inputCls} />
              </Field>
              <Field label="E-mail" error={fields.email?.[0]}>
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={120}
                  autoComplete="email"
                  placeholder="voce@email.com"
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Mensagem" error={fields.message?.[0]}>
              <textarea
                name="message"
                required
                rows={6}
                maxLength={2000}
                placeholder="Conte um pouco sobre o que você precisa..."
                className={cn(inputCls, "resize-none")}
              />
            </Field>

            <div className="flex flex-col-reverse items-start gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <AnimatePresence mode="wait">
                {status === "success" && (
                  <motion.p
                    key="ok"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="status"
                    className="flex items-center gap-2 text-sm text-accent"
                  >
                    <Check className="size-4" /> Mensagem enviada! Em breve eu respondo.
                  </motion.p>
                )}
                {status === "error" && (
                  <motion.p key="err" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="text-sm text-red-400">
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
              <button
                type="submit"
                disabled={status === "loading"}
                className="group ml-auto inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-ink-950 transition hover:shadow-[0_0_40px_-8px] hover:shadow-accent disabled:opacity-60"
              >
                {status === "loading" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                )}
                {status === "loading" ? "Enviando..." : "Enviar mensagem"}
              </button>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-muted">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-red-400">{error}</span>}
    </label>
  );
}
