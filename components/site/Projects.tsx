"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Star } from "lucide-react";
import type { Project } from "@/lib/schemas";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { GithubIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

function Cover({ project, index }: { project: Project; index: number }) {
  if (project.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={project.image}
        alt=""
        loading="lazy"
        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />
    );
  }
  // Capa generativa quando não há imagem
  const hue = (index * 67) % 360;
  return (
    <div
      className="relative h-full w-full transition duration-700 group-hover:scale-105"
      style={{
        background: `radial-gradient(circle at 20% 20%, hsl(${hue} 90% 60% / .35), transparent 50%),
                     radial-gradient(circle at 80% 70%, rgb(198 255 61 / .25), transparent 45%), #0d0d12`,
      }}
    >
      <div className="bg-grid absolute inset-0 opacity-60 [mask-image:none]" />
      <span className="absolute bottom-3 right-5 font-serif text-7xl italic text-white/15">
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}

export function Projects({ projects }: { projects: Project[] }) {
  const sorted = useMemo(() => [...projects].sort((a, b) => Number(b.featured) - Number(a.featured)), [projects]);
  const tags = useMemo(() => {
    const count = new Map<string, number>();
    projects.forEach((p) => p.tags.forEach((t) => count.set(t, (count.get(t) ?? 0) + 1)));
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t);
  }, [projects]);
  const [filter, setFilter] = useState<string | null>(null);
  const visible = filter ? sorted.filter((p) => p.tags.includes(filter)) : sorted;

  return (
    <section id="projetos" className="container-x py-24">
      <SectionHeading
        index="02"
        eyebrow="Projetos"
        title="Trabalhos *selecionados*"
        description="Projetos pessoais e open source onde exploro novas ideias e tecnologias."
      />

      {tags.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2" role="toolbar" aria-label="Filtrar por tecnologia">
          {[null, ...tags].map((t) => (
            <button
              key={t ?? "all"}
              type="button"
              onClick={() => setFilter(t)}
              aria-pressed={filter === t}
              className={cn(
                "relative isolate rounded-full border px-4 py-1.5 text-sm transition",
                filter === t ? "border-accent text-ink-950" : "border-line text-muted hover:text-white",
              )}
            >
              {filter === t && (
                <motion.span layoutId="filter-pill" className="absolute inset-0 -z-10 rounded-full bg-accent" />
              )}
              <span className="relative">{t ?? "Todos"}</span>
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-muted">Nenhum projeto publicado ainda.</p>
      ) : (
        <motion.ul layout className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((p, i) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.05 }}
                className={cn(p.featured && "md:col-span-2")}
              >
                <SpotlightCard as="article" className="flex h-full flex-col">
                  <div className={cn("relative overflow-hidden border-b border-line", p.featured ? "h-56 sm:h-64" : "h-44")}>
                    <Cover project={p} index={sorted.indexOf(p)} />
                    {p.featured && (
                      <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-ink-950/70 px-3 py-1 text-xs text-accent backdrop-blur">
                        <Star className="size-3 fill-current" /> Destaque
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="text-xl font-medium">{p.title}</h3>
                      {p.year && <span className="font-mono text-xs text-muted">{p.year}</span>}
                    </div>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.description}</p>
                    <ul className="mt-5 flex flex-wrap gap-1.5">
                      {p.tags.map((t) => (
                        <li key={t} className="rounded-md bg-white/[0.04] px-2 py-1 font-mono text-[11px] text-zinc-400">
                          {t}
                        </li>
                      ))}
                    </ul>
                    {(p.repoUrl || p.demoUrl) && (
                      <div className="mt-6 flex gap-2">
                        {p.demoUrl && (
                          <a
                            href={p.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/link inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-ink-950 transition hover:bg-accent"
                          >
                            Demo
                            <ArrowUpRight className="size-4 transition group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                          </a>
                        )}
                        {p.repoUrl && (
                          <a
                            href={p.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm transition hover:border-white/30 hover:bg-white/5"
                          >
                            <GithubIcon className="size-4" /> Código
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </SpotlightCard>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </section>
  );
}
