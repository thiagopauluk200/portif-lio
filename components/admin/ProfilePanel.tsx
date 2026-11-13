"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { STATUS_TONES, type Settings, type Status, type StatusTone } from "@/lib/schemas";
import { StatusBadge, TONE_STYLES } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { ApiError, adminApi } from "./api";
import { ImageUpload } from "./ImageUpload";
import { Toggle, inputCls } from "./ui";

const PRESETS: { text: string; tone: StatusTone }[] = [
  { text: "Aberto a oportunidades", tone: "available" },
  { text: "Disponível para projetos freelance", tone: "available" },
  { text: "Buscando minha primeira vaga em tecnologia", tone: "available" },
  { text: "Construindo projetos de IoT e automação", tone: "neutral" },
  { text: "Estudando e criando novos projetos", tone: "neutral" },
  { text: "Agenda cheia no momento", tone: "busy" },
];

const MAX = 60;

export function ProfilePanel({
  initial,
  notify,
}: {
  initial: { avatar?: string; status: Status };
  notify: (text: string, tone?: "ok" | "err") => void;
}) {
  const [saved, setSaved] = useState({ avatar: initial.avatar ?? "", status: initial.status });
  const [avatar, setAvatar] = useState(saved.avatar);
  const [status, setStatus] = useState<Status>(saved.status);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const dirty = avatar !== saved.avatar || JSON.stringify(status) !== JSON.stringify(saved.status);
  const update = (patch: Partial<Status>) => setStatus((s) => ({ ...s, ...patch }));

  async function save() {
    setSaving(true);
    setError("");
    try {
      const { settings } = await adminApi<{ settings: Settings }>("/api/admin/settings", {
        method: "PUT",
        body: { avatar, status: { ...status, text: status.text.trim() } },
      });
      const next = { avatar: settings.avatar ?? "", status: settings.status ?? status };
      setSaved(next);
      setStatus(next.status);
      notify("Perfil atualizado");
    } catch (err) {
      const msg = err instanceof ApiError ? (Object.values(err.fields).flat()[0] ?? err.message) : (err as Error).message;
      setError(msg ?? "Erro ao salvar");
      notify("Não foi possível salvar", "err");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Status */}
      <section className="rounded-2xl border border-line bg-ink-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-medium">Status de disponibilidade</h2>
            <p className="mt-1 text-sm text-muted">O selo que aparece no topo do site, acima do seu nome.</p>
          </div>
          <Toggle checked={status.enabled} onChange={(v) => update({ enabled: v })} label="Mostrar no site" />
        </div>

        {/* Pré-visualização */}
        <div className="mt-5 rounded-xl border border-dashed border-line bg-ink-950 p-5">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted">Pré-visualização</p>
          {status.enabled ? (
            <StatusBadge text={status.text.trim() || "Escreva seu status"} tone={status.tone} />
          ) : (
            <p className="text-sm text-muted">O selo está oculto no site.</p>
          )}
        </div>

        <div className={cn("mt-5 space-y-5 transition", !status.enabled && "pointer-events-none opacity-40")}>
          {/* Sugestões */}
          <div>
            <p className="mb-2 text-sm text-zinc-300">Sugestões</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.text}
                  type="button"
                  onClick={() => update({ text: p.text, tone: p.tone })}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                    status.text === p.text ? "border-accent/60 text-white" : "border-line text-muted hover:text-white",
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", TONE_STYLES[p.tone].dot)} />
                  {p.text}
                </button>
              ))}
            </div>
          </div>

          {/* Texto livre */}
          <label className="block">
            <span className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="text-zinc-300">Ou escreva o seu</span>
              <span className={cn("text-xs", status.text.length > MAX ? "text-red-400" : "text-muted")}>
                {status.text.length}/{MAX}
              </span>
            </span>
            <input
              value={status.text}
              onChange={(e) => update({ text: e.target.value })}
              maxLength={MAX}
              placeholder="Ex.: Disponível a partir de janeiro"
              className={inputCls}
            />
          </label>

          {/* Cor */}
          <div>
            <p className="mb-2 text-sm text-zinc-300">Cor do selo</p>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Cor do selo">
              {STATUS_TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={status.tone === t}
                  onClick={() => update({ tone: t })}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm transition",
                    status.tone === t ? "border-white/30 bg-white/5 text-white" : "border-line text-muted hover:text-white",
                  )}
                >
                  <span className={cn("size-2 rounded-full", TONE_STYLES[t].dot)} />
                  {TONE_STYLES[t].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Foto */}
      <section className="rounded-2xl border border-line bg-ink-900 p-6">
        <ImageUpload kind="avatar" shape="square" label="Foto de perfil" value={avatar} onChange={setAvatar} />
        <p className="mt-3 text-xs text-muted">
          Sem foto, o site mostra suas iniciais. Nome, bio, skills e números são editados em data/content.json.
        </p>
      </section>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-ink-950 shadow-2xl shadow-black/60 transition hover:brightness-110 disabled:opacity-40"
        >
          {saving && <LoaderCircle className="size-4 animate-spin" />}
          {dirty ? "Salvar alterações" : "Tudo salvo"}
        </button>
      </div>
    </div>
  );
}
