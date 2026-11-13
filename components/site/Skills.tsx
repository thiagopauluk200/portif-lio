import { Code } from "lucide-react";
import type { SkillCategory } from "@/lib/schemas";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { Reveal } from "@/components/ui/Reveal";
import { skillIcons } from "@/components/ui/icons";

// Ritmo do bento grid (6 colunas), escolhido para fechar as linhas sem buracos.
function spanFor(i: number, total: number) {
  const layouts: Record<number, string[]> = {
    5: ["md:col-span-3", "md:col-span-3", "md:col-span-2", "md:col-span-2", "md:col-span-2"],
    6: ["md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-4", "md:col-span-3", "md:col-span-3"],
  };
  const pattern = layouts[total] ?? ["md:col-span-4", "md:col-span-2", "md:col-span-2", "md:col-span-4"];
  return pattern[i % pattern.length];
}

export function Skills({ skills }: { skills: SkillCategory[] }) {
  return (
    <section id="skills" className="container-x py-24">
      <SectionHeading
        index="01"
        eyebrow="Habilidades"
        title="Ferramentas que uso para *dar vida* às ideias"
        description="Uma stack moderna, escolhida pela confiabilidade e pela experiência que entrega."
      />

      <div className="grid gap-4 md:grid-cols-6">
        {skills.map((cat, i) => {
          const Icon = skillIcons[cat.icon] ?? Code;
          return (
            <Reveal key={cat.id} delay={i * 0.08} className={spanFor(i, skills.length)}>
              <SpotlightCard className="h-full p-7">
                <div className="flex items-start justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl border border-line bg-ink-800 text-accent transition group-hover:scale-110 group-hover:rotate-[-6deg]">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs text-muted">{String(cat.items.length).padStart(2, "0")}</span>
                </div>
                <h3 className="mt-6 text-xl font-medium">{cat.title}</h3>
                <p className="mt-2 text-sm text-muted">{cat.description}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {cat.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-line bg-white/[0.02] px-3 py-1.5 text-sm text-zinc-300 transition hover:border-accent/40 hover:text-accent"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
