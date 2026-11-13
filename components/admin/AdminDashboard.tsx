"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Briefcase,
  ExternalLink,
  FolderGit2,
  GraduationCap,
  Inbox,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Star,
  UserRound,
  X,
} from "lucide-react";
import type { Experience, Message, Project, Settings } from "@/lib/schemas";
import { ProfilePanel } from "./ProfilePanel";
import { cn, formatDateTime, formatMonth } from "@/lib/utils";
import { adminApi } from "./api";
import { DeleteButton } from "./ui";
import { ProjectForm } from "./ProjectForm";
import { ExperienceForm } from "./ExperienceForm";

type Tab = "projects" | "experiences" | "messages" | "profile";
type Editor = { kind: "projects"; item?: Project } | { kind: "experiences"; item?: Experience } | null;

export function AdminDashboard({
  initialSettings,
  initialProjects,
  initialExperiences,
  initialMessages,
}: {
  initialSettings: Settings;
  initialProjects: Project[];
  initialExperiences: Experience[];
  initialMessages: Message[];
}) {
  const [tab, setTab] = useState<Tab>("projects");
  const [projects, setProjects] = useState(initialProjects);
  const [experiences, setExperiences] = useState(initialExperiences);
  const [messages, setMessages] = useState(initialMessages);
  const [editor, setEditor] = useState<Editor>(null);
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "err" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setEditor(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const notify = (text: string, tone: "ok" | "err" = "ok") => setToast({ text, tone });

  async function saveProject(payload: unknown, id?: string) {
    const { item } = await adminApi<{ item: Project }>(id ? `/api/admin/projects/${id}` : "/api/admin/projects", {
      method: id ? "PUT" : "POST",
      body: payload,
    });
    setProjects((list) => (id ? list.map((p) => (p.id === id ? item : p)) : [item, ...list]));
    setEditor(null);
    notify(id ? "Projeto atualizado" : "Projeto criado");
  }

  async function saveExperience(payload: unknown, id?: string) {
    const { item } = await adminApi<{ item: Experience }>(
      id ? `/api/admin/experiences/${id}` : "/api/admin/experiences",
      { method: id ? "PUT" : "POST", body: payload },
    );
    // Recarrega a lista para manter a ordenação cronológica do servidor
    const { items } = await adminApi<{ items: Experience[] }>("/api/admin/experiences");
    setExperiences(items.length ? items : [item]);
    setEditor(null);
    notify(id ? "Experiência atualizada" : "Experiência criada");
  }

  async function remove(kind: Exclude<Tab, "profile">, id: string) {
    try {
      await adminApi(`/api/admin/${kind}/${id}`, { method: "DELETE" });
      if (kind === "projects") setProjects((l) => l.filter((i) => i.id !== id));
      if (kind === "experiences") setExperiences((l) => l.filter((i) => i.id !== id));
      if (kind === "messages") setMessages((l) => l.filter((i) => i.id !== id));
      notify("Item removido");
    } catch (err) {
      notify((err as Error).message, "err");
    }
  }

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.href = "/admin/login";
  }

  const tabs = [
    { id: "projects" as const, label: "Projetos", count: projects.length, Icon: FolderGit2 },
    { id: "experiences" as const, label: "Trajetória", count: experiences.length, Icon: Briefcase },
    { id: "messages" as const, label: "Mensagens", count: messages.length, Icon: Inbox },
    { id: "profile" as const, label: "Perfil", count: null, Icon: UserRound },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      {/* Cabeçalho */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Painel administrativo</p>
          <h1 className="mt-1 text-2xl font-medium">Gerenciar conteúdo</h1>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition hover:bg-white/5"
          >
            Ver site <ExternalLink className="size-3.5" />
          </a>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </header>

      {/* Abas */}
      <nav className="mt-8 flex gap-1 overflow-x-auto rounded-2xl border border-line bg-ink-900 p-1" role="tablist">
        {tabs.map(({ id, label, count, Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition",
              tab === id ? "text-ink-950" : "text-muted hover:text-white",
            )}
          >
            {tab === id && <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-xl bg-accent" />}
            <span className="relative flex items-center gap-2">
              <Icon className="size-4" /> {label}
              {count !== null && (
                <span className={cn("rounded-full px-1.5 text-xs", tab === id ? "bg-ink-950/15" : "bg-white/5")}>{count}</span>
              )}
            </span>
          </button>
        ))}
      </nav>

      {/* Conteúdo */}
      <section className="mt-6">
        {tab === "profile" && <ProfilePanel initial={initialSettings} notify={notify} />}

        {(tab === "projects" || tab === "experiences") && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setEditor({ kind: tab })}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-950 transition hover:bg-accent"
            >
              <Plus className="size-4" /> {tab === "projects" ? "Novo projeto" : "Nova experiência"}
            </button>
          </div>
        )}

        {tab === "projects" && (
          <List empty="Nenhum projeto ainda. Crie o primeiro!">
            {projects.map((p) => (
              <Row
                key={p.id}
                title={
                  <span className="flex items-center gap-2">
                    {p.featured && <Star className="size-3.5 fill-accent text-accent" aria-label="Destaque" />}
                    {p.title}
                  </span>
                }
                meta={[p.year, p.tags.join(" · ")].filter(Boolean).join("  —  ")}
                onEdit={() => setEditor({ kind: "projects", item: p })}
                onDelete={() => remove("projects", p.id)}
              />
            ))}
          </List>
        )}

        {tab === "experiences" && (
          <List empty="Nenhuma experiência ainda.">
            {experiences.map((e) => (
              <Row
                key={e.id}
                title={
                  <span className="flex items-center gap-2">
                    {e.type === "work" ? (
                      <Briefcase className="size-3.5 text-muted" />
                    ) : e.type === "certification" ? (
                      <Award className="size-3.5 text-muted" />
                    ) : (
                      <GraduationCap className="size-3.5 text-muted" />
                    )}
                    {e.role}
                  </span>
                }
                meta={`${e.organization}  —  ${formatMonth(e.start)} → ${formatMonth(e.end)}`}
                onEdit={() => setEditor({ kind: "experiences", item: e })}
                onDelete={() => remove("experiences", e.id)}
              />
            ))}
          </List>
        )}

        {tab === "messages" && (
          <List empty="Nenhuma mensagem recebida.">
            {messages.map((m) => (
              <li key={m.id} className="rounded-2xl border border-line bg-ink-900 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
                      <Mail className="size-3.5" /> {m.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{formatDateTime(m.createdAt)}</span>
                    <DeleteButton onConfirm={() => remove("messages", m.id)} />
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{m.message}</p>
              </li>
            ))}
          </List>
        )}
      </section>

      {/* Painel lateral de edição */}
      <AnimatePresence>
        {editor && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditor(null)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Editor"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 36 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-line bg-ink-900"
            >
              <div className="flex items-center justify-between border-b border-line px-6 py-4">
                <h2 className="font-medium">
                  {editor.item ? "Editar" : "Adicionar"} {editor.kind === "projects" ? "projeto" : "experiência"}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  aria-label="Fechar"
                  className="grid size-9 place-items-center rounded-full text-muted hover:bg-white/5 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 pt-6">
                {editor.kind === "projects" ? (
                  <ProjectForm
                    initial={editor.item}
                    onCancel={() => setEditor(null)}
                    onSubmit={(payload) => saveProject(payload, editor.item?.id)}
                  />
                ) : (
                  <ExperienceForm
                    initial={editor.item}
                    onCancel={() => setEditor(null)}
                    onSubmit={(payload) => saveExperience(payload, editor.item?.id)}
                  />
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            role="status"
            className={cn(
              "fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-medium shadow-2xl",
              toast.tone === "ok" ? "bg-accent text-ink-950" : "bg-red-500 text-white",
            )}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function List({ children, empty }: { children: React.ReactNode[]; empty: string }) {
  if (children.length === 0) {
    return <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">{empty}</p>;
  }
  return <ul className="space-y-2">{children}</ul>;
}

function Row({
  title,
  meta,
  onEdit,
  onDelete,
}: {
  title: React.ReactNode;
  meta: string;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  return (
    <li className="group flex items-center gap-4 rounded-2xl border border-line bg-ink-900 px-5 py-4 transition hover:border-white/15">
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className="truncate font-medium">{title}</p>
        <p className="mt-0.5 truncate text-sm text-muted">{meta}</p>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Editar"
          className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-white/5 hover:text-white"
        >
          <Pencil className="size-4" />
        </button>
        <DeleteButton onConfirm={onDelete} />
      </div>
    </li>
  );
}
