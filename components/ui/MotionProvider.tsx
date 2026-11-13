"use client";

import { MotionConfig } from "framer-motion";

/** Respeita "reduzir movimento" do sistema operacional em todas as animações. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
