"use client";

import { useState } from "react";
import type { Project } from "@/lib/schemas";
import { ApiError, type FieldErrors } from "./api";
import { Field, SubmitBar, Toggle, inputCls, splitList } from "./ui";
import { ImageUpload } from "./ImageUpload";

export function ProjectForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Project;
  onSubmit: (payload: unknown) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [repoUrl, setRepoUrl] = useState(initial?.repoUrl ?? "");
  const [demoUrl, setDemoUrl] = useState(initial?.demoUrl ?? "");
  const [image, setImage] = useState(initial?.image ?? "");
  const [year, setYear] = useState(initial?.year ? String(initial.year) : String(new Date().getFullYear()));
  const [featured, setFeatured] = useState(initial?.featured ?? false);
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
        title,
        description,
        tags: splitList(tags),
        repoUrl,
        demoUrl,
        image,
        year: year ? Number(year) : undefined,
        featured,
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
      <Field label="Título" error={err("title")}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className={inputCls} aria-invalid={!!err("title")} autoFocus />
      </Field>
      <Field label="Descrição" hint={`${description.length}/600`} error={err("description")}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={600}
          rows={4}
          className={inputCls + " resize-y"}
          aria-invalid={!!err("description")}
        />
      </Field>
      <Field label="Tecnologias" hint="separadas por vírgula" error={err("tags")}>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Next.js, TypeScript, Prisma" className={inputCls} />
      </Field>
      {splitList(tags).length > 0 && (
        <div className="-mt-2 flex flex-wrap gap-1.5">
          {splitList(tags).map((t) => (
            <span key={t} className="rounded-md bg-accent/10 px-2 py-0.5 font-mono text-[11px] text-accent">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Repositório" error={err("repoUrl")}>
          <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/..." className={inputCls} aria-invalid={!!err("repoUrl")} />
        </Field>
        <Field label="Demo / Deploy" error={err("demoUrl")}>
          <input value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://..." className={inputCls} aria-invalid={!!err("demoUrl")} />
        </Field>
      </div>
      <ImageUpload kind="project" label="Banner do projeto (opcional)" value={image} onChange={setImage} />
      {err("image") && <p className="-mt-3 text-xs text-red-400">{err("image")}</p>}
      <Field label="Ano" error={err("year")} className="max-w-[8rem]">
        <input type="number" value={year} onChange={(e) => setYear(e.target.value)} min={1990} max={2100} className={inputCls} />
      </Field>
      <Toggle checked={featured} onChange={setFeatured} label="Projeto em destaque (card maior, aparece primeiro)" />

      {formError && <p role="alert" className="text-sm text-red-400">{formError}</p>}
      <SubmitBar saving={saving} onCancel={onCancel} isEdit={!!initial} />
    </form>
  );
}
