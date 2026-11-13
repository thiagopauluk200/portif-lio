"use client";

import { useState } from "react";
import type { Experience } from "@/lib/schemas";
import { ApiError, type FieldErrors } from "./api";
import { Field, SubmitBar, Toggle, inputCls, splitList } from "./ui";
import { cn } from "@/lib/utils";

const LABELS = {
  work: { tab: "Profissional", role: "Cargo", org: "Empresa" },
  education: { tab: "Formação", role: "Curso", org: "Instituição" },
  certification: { tab: "Certificação", role: "Certificação / curso", org: "Emissor" },
} as const;

export function ExperienceForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Experience;
  onSubmit: (payload: unknown) => Promise<void>;
  onCancel: () => void;
}) {
  const [role, setRole] = useState(initial?.role ?? "");
  const [organization, setOrganization] = useState(initial?.organization ?? "");
  const [type, setType] = useState<Experience["type"]>(initial?.type ?? "work");
  const [start, setStart] = useState(initial?.start ?? "");
  const [end, setEnd] = useState(initial?.end ?? "");
  const [current, setCurrent] = useState(initial ? !initial.end : false);
  const [location, setLocation] = useState(initial?.location ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [highlights, setHighlights] = useState(initial?.highlights.join("\n") ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError("");
    try {
      await onSubmit({
        role,
        organization,
        type,
        start,
        end: current ? "" : end,
        location: location || undefined,
        description,
        highlights: splitList(highlights, /\n/),
        tags: splitList(tags),
      });
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields);
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const err = (k: string) => errors[k]?.[0];

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-line p-1" role="radiogroup" aria-label="Tipo">
        {(["work", "education", "certification"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => setType(t)}
            className={cn("rounded-xl py-2 text-sm transition", type === t ? "bg-white text-ink-950" : "text-muted hover:text-white")}
          >
            {LABELS[t].tab}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={LABELS[type].role} error={err("role")}>
          <input value={role} onChange={(e) => setRole(e.target.value)} maxLength={80} className={inputCls} aria-invalid={!!err("role")} autoFocus />
        </Field>
        <Field label={LABELS[type].org} error={err("organization")}>
          <input value={organization} onChange={(e) => setOrganization(e.target.value)} maxLength={80} className={inputCls} aria-invalid={!!err("organization")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label={type === "certification" ? "Ano" : "Início"} hint="AAAA ou AAAA-MM" error={err("start")}>
          <input value={start} onChange={(e) => setStart(e.target.value)} placeholder="2024" inputMode="numeric" maxLength={7} className={inputCls} aria-invalid={!!err("start")} />
        </Field>
        <Field label="Término" hint="opcional" error={err("end")}>
          <input
            value={current ? "" : end}
            placeholder="2025"
            inputMode="numeric"
            maxLength={7}
            onChange={(e) => setEnd(e.target.value)}
            disabled={current}
            className={cn(inputCls, "disabled:opacity-40")}
            aria-invalid={!!err("end")}
          />
        </Field>
        <Field label="Local" hint="opcional">
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Remoto" className={inputCls} />
        </Field>
      </div>
      {type !== "certification" && (
        <Toggle checked={current} onChange={setCurrent} label={type === "work" ? "Trabalho aqui atualmente" : "Em andamento"} />
      )}

      <Field label="Descrição" hint={`${description.length}/800`} error={err("description")}>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={800} rows={4} className={inputCls + " resize-y"} aria-invalid={!!err("description")} />
      </Field>
      <Field label="Destaques / conquistas" hint="um por linha (máx. 8)" error={err("highlights")}>
        <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={3} className={inputCls + " resize-y"} />
      </Field>
      <Field label="Tecnologias" hint="separadas por vírgula" error={err("tags")}>
        <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} />
      </Field>

      {formError && <p role="alert" className="text-sm text-red-400">{formError}</p>}
      <SubmitBar saving={saving} onCancel={onCancel} isEdit={!!initial} />
    </form>
  );
}
