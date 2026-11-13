import { ArrowUp } from "lucide-react";
import type { Profile } from "@/lib/schemas";

export function Footer({ profile }: { profile: Profile }) {
  return (
    <footer className="container-x pb-10 pt-16">
      <div className="flex flex-col items-start justify-between gap-6 border-t border-line pt-8 sm:flex-row sm:items-center">
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} {profile.name}. Feito com Next.js, Tailwind e Framer Motion.
        </p>
        <a href="#top" className="group inline-flex items-center gap-2 text-sm text-muted transition hover:text-white">
          Voltar ao topo
          <span className="grid size-8 place-items-center rounded-full border border-line transition group-hover:-translate-y-1 group-hover:border-accent/50 group-hover:text-accent">
            <ArrowUp className="size-4" />
          </span>
        </a>
      </div>
    </footer>
  );
}
