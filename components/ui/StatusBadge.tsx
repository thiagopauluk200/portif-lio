import type { StatusTone } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export const TONE_STYLES: Record<StatusTone, { label: string; badge: string; dot: string; pulse: boolean }> = {
  available: {
    label: "Disponível",
    badge: "border-accent/25 bg-accent/10 text-accent",
    dot: "bg-accent",
    pulse: true,
  },
  busy: {
    label: "Ocupado",
    badge: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    dot: "bg-amber-400",
    pulse: false,
  },
  neutral: {
    label: "Neutro",
    badge: "border-violet/30 bg-violet/10 text-violet-300",
    dot: "bg-violet",
    pulse: false,
  },
};

/** Selo de status usado no topo do site e na pré-visualização do painel. */
export function StatusBadge({ text, tone, className }: { text: string; tone: StatusTone; className?: string }) {
  const s = TONE_STYLES[tone];
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        s.badge,
        className,
      )}
    >
      <span className="relative flex size-2 shrink-0">
        {s.pulse && <span className={cn("absolute inline-flex size-full animate-ping-slow rounded-full opacity-75", s.dot)} />}
        <span className={cn("relative inline-flex size-2 rounded-full", s.dot)} />
      </span>
      <span className="truncate">{text}</span>
    </span>
  );
}
