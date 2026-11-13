"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Award, Briefcase, GraduationCap } from "lucide-react";
import type { Experience as Exp } from "@/lib/schemas";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { formatMonth } from "@/lib/utils";

export function Experience({ experiences }: { experiences: Exp[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section id="trajetoria" className="container-x py-24">
      <SectionHeading
        index="03"
        eyebrow="Trajetória"
        title="Formação e *certificações*"
        description="O caminho de estudos que une eletrônica, automação e desenvolvimento de software."
      />

      {experiences.length === 0 ? (
        <p className="text-muted">Nenhuma experiência cadastrada ainda.</p>
      ) : (
        <ol ref={ref} className="relative ml-3 md:ml-[11rem]">
          {/* Linha base + linha que "preenche" com o scroll */}
          <span aria-hidden className="absolute left-0 top-2 bottom-2 w-px bg-line" />
          <motion.span
            aria-hidden
            style={{ scaleY }}
            className="absolute left-0 top-2 bottom-2 w-px origin-top bg-gradient-to-b from-accent via-accent to-violet"
          />

          {experiences.map((e, i) => {
            const Icon = e.type === "work" ? Briefcase : e.type === "certification" ? Award : GraduationCap;
            return (
              <li key={e.id} className="relative pb-14 pl-10 last:pb-0">
                <span className="absolute -left-[13px] top-0 grid size-[27px] place-items-center rounded-full border border-line bg-ink-900 text-accent">
                  <Icon className="size-3.5" />
                </span>

                <Reveal delay={i * 0.05}>
                  <p className="font-mono text-xs uppercase tracking-wider text-muted md:absolute md:-left-[11rem] md:top-1.5 md:w-36 md:text-right">
                    {e.type === "certification" && !e.end
                      ? formatMonth(e.start)
                      : `${formatMonth(e.start)} — ${e.end ? formatMonth(e.end) : "em andamento"}`}
                  </p>
                  <div className="mt-2 md:mt-0">
                    <h3 className="text-xl font-medium">{e.role}</h3>
                    <p className="mt-1 text-muted">
                      <span className="text-zinc-200">{e.organization}</span>
                      {e.location && <> · {e.location}</>}
                      {!e.end && e.type !== "certification" && (
                        <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">atual</span>
                      )}
                    </p>
                    <p className="mt-4 max-w-2xl leading-relaxed text-zinc-300">{e.description}</p>
                    {e.highlights.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {e.highlights.map((h) => (
                          <li key={h} className="flex gap-3 text-sm text-muted">
                            <span className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    )}
                    {e.tags.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-1.5">
                        {e.tags.map((t) => (
                          <li key={t} className="rounded-md bg-white/[0.04] px-2 py-1 font-mono text-[11px] text-zinc-400">
                            {t}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
