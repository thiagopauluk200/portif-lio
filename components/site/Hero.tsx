"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Download, MapPin } from "lucide-react";
import type { Profile } from "@/lib/schemas";
import { Emphasis } from "@/components/ui/Emphasis";
import { EASE } from "@/components/ui/Reveal";
import { Socials } from "./Socials";
import { cn } from "@/lib/utils";

function BentoCard({ i, className, children }: { i: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.8, delay: 0.1 + i * 0.1, ease: EASE }}
      className={cn("relative overflow-hidden rounded-3xl border border-line bg-ink-900/80 backdrop-blur", className)}
    >
      {children}
    </motion.div>
  );
}

function LocalClock({ timezone }: { timezone: string }) {
  const [time, setTime] = useState<string>("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: timezone });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, [timezone]);
  return <span suppressHydrationWarning>{time || "--:--"}</span>;
}

export function Hero({ profile, techs }: { profile: Profile; techs: string[] }) {
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <section id="top" className="relative pb-20 pt-28 sm:pt-36">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="absolute left-1/2 top-0 -z-10 h-[420px] w-[min(900px,100%)] -translate-x-1/2 rounded-full bg-violet/25 blur-[120px]"
      />

      <div className="container-x grid gap-4 lg:grid-cols-12">
        {/* Apresentação principal */}
        <BentoCard i={0} className="flex flex-col justify-between p-7 sm:p-10 lg:col-span-8 lg:row-span-2">
          <div>
            {profile.available && (
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping-slow rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-accent" />
                </span>
                Aberto a oportunidades
              </span>
            )}
            <p className="mt-8 font-mono text-sm text-muted">
              Olá, eu sou <span className="text-white">{profile.name}</span> — {profile.role}
            </p>
            <h1 className="mt-4 text-4xl font-medium leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-[4.25rem]">
              <Emphasis text={profile.headline} />
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{profile.summary}</p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#projetos"
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-ink-950 transition hover:shadow-[0_0_40px_-8px] hover:shadow-accent"
            >
              Ver projetos
              <ArrowDownRight className="size-4 transition group-hover:rotate-[-45deg]" />
            </a>
            {profile.resumeUrl ? (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-medium transition hover:border-white/30 hover:bg-white/5"
              >
                <Download className="size-4" /> Currículo
              </a>
            ) : (
              <a
                href="#contato"
                className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 font-medium transition hover:border-white/30 hover:bg-white/5"
              >
                Entrar em contato <ArrowUpRight className="size-4" />
              </a>
            )}
            <Socials socials={profile.socials} className="sm:ml-auto" />
          </div>
        </BentoCard>

        {/* Avatar + local */}
        <BentoCard i={1} className="flex items-center gap-5 p-6 lg:col-span-4">
          {profile.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar} alt={profile.name} className="size-20 rounded-2xl object-cover" />
          ) : (
            <div className="relative grid size-20 shrink-0 place-items-center rounded-2xl bg-[conic-gradient(from_180deg,var(--color-accent),var(--color-violet),var(--color-accent))] p-[2px]">
              <div className="grid size-full place-items-center rounded-[14px] bg-ink-900 font-serif text-3xl italic">
                {initials}
              </div>
            </div>
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <MapPin className="size-4 text-accent" /> {profile.location}
            </p>
            <p className="mt-1 font-mono text-3xl tabular-nums">
              <LocalClock timezone={profile.timezone} />
            </p>
            <p className="text-xs text-muted">horário local</p>
          </div>
        </BentoCard>

        {/* Números */}
        <BentoCard i={2} className="grid grid-cols-2 lg:col-span-4">
          {profile.stats.map((s, idx) => (
            <div
              key={s.label}
              className={cn("p-6", idx % 2 === 0 && "border-r border-line", idx < 2 && "border-b border-line")}
            >
              <p className="text-3xl font-medium tracking-tight text-gradient">{s.value}</p>
              <p className="mt-1 text-xs leading-snug text-muted">{s.label}</p>
            </div>
          ))}
        </BentoCard>

        {/* Marquee de tecnologias */}
        <BentoCard i={3} className="py-5 lg:col-span-12">
          <div
            className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
            aria-label="Tecnologias"
          >
            <div className="flex shrink-0 animate-marquee gap-10 pr-10 hover:[animation-play-state:paused]">
              {[...techs, ...techs].map((t, i) => (
                <span
                  key={i}
                  aria-hidden={i >= techs.length}
                  className="flex items-center gap-10 whitespace-nowrap font-mono text-sm uppercase tracking-widest text-muted"
                >
                  {t}
                  <span className="text-accent">✦</span>
                </span>
              ))}
            </div>
          </div>
        </BentoCard>
      </div>
    </section>
  );
}
