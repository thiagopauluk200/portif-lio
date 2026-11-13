"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { Settings } from "@/lib/schemas";
import { adminApi } from "./api";
import { ImageUpload } from "./ImageUpload";

export function ProfilePanel({
  initial,
  notify,
}: {
  initial: Settings;
  notify: (text: string, tone?: "ok" | "err") => void;
}) {
  const [saved, setSaved] = useState(initial.avatar ?? "");
  const [avatar, setAvatar] = useState(initial.avatar ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = avatar !== saved;

  async function save() {
    setSaving(true);
    try {
      const { settings } = await adminApi<{ settings: Settings }>("/api/admin/settings", {
        method: "PUT",
        body: { avatar },
      });
      setSaved(settings.avatar ?? "");
      notify("Perfil atualizado");
    } catch (err) {
      notify((err as Error).message, "err");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-ink-900 p-6">
      <ImageUpload kind="avatar" shape="square" label="Foto de perfil" value={avatar} onChange={setAvatar} />
      <p className="mt-3 text-xs text-muted">
        Sem foto, o site mostra suas iniciais. Nome, bio, skills e números são editados em data/content.json.
      </p>
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink-950 transition hover:brightness-110 disabled:opacity-40"
        >
          {saving && <LoaderCircle className="size-4 animate-spin" />}
          Salvar perfil
        </button>
      </div>
    </div>
  );
}
