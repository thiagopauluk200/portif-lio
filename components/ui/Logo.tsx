/**
 * Monograma "TP" desenhado como trilha de placa de circuito:
 * T e P compartilham a mesma haste, e as pontas são pads de solda.
 * Mesmo desenho de app/icon.svg (favicon) e app/apple-icon.tsx.
 */
export function Logo({ className, title = "Thiago Pauluk" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} role="img" aria-label={title}>
      <rect width="32" height="32" rx="8" fill="#0d0d12" />
      <g fill="none" stroke="#c6ff3d" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 8H20a5 5 0 0 1 0 10H14" />
        <path d="M14 8V23" />
      </g>
      <g fill="#0d0d12" stroke="#c6ff3d" strokeWidth={2}>
        <circle cx="7" cy="8" r="2.4" />
        <circle cx="14" cy="24.6" r="2.4" />
      </g>
    </svg>
  );
}
