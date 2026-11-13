"use client";

import { Analytics } from "@vercel/analytics/next";

/**
 * Vercel Web Analytics: sem cookies e sem dados pessoais.
 * As páginas do painel (/admin) não são contabilizadas.
 */
export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          return new URL(event.url).pathname.startsWith("/admin") ? null : event;
        } catch {
          return event;
        }
      }}
    />
  );
}
