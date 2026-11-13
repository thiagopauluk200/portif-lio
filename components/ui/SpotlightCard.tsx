"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/** Card com brilho que segue o cursor (micro-interação). */
export function SpotlightCard({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
  }

  return (
    <Tag
      ref={ref as React.Ref<never>}
      onMouseMove={onMove}
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-line bg-ink-900/80 transition-colors duration-500 hover:border-white/15",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: "radial-gradient(420px circle at var(--x, 50%) var(--y, 50%), rgb(198 255 61 / 0.09), transparent 45%)",
        }}
      />
      <div className="relative h-full">{children}</div>
    </Tag>
  );
}
