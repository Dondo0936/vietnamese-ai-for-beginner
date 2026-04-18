"use client";

import { useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface AccentHueSweepProps {
  children: ReactNode;
  lang?: string;
  className?: string;
}

/**
 * Clips an animated conic-gradient to text on the hero headline.
 * Reduced motion → static warm gradient (no animation).
 *
 * Gradient uses existing DS tokens (--turquoise-500, --peach-500, --clay)
 * so we don't introduce new colors.
 */
export default function AccentHueSweep({
  children,
  lang,
  className = "",
}: AccentHueSweepProps) {
  const reduce = useReducedMotion();
  // Treat the SSR/hydration-unknown state (null) as "prefer reduced" — gives
  // reduced-motion users a clean static paint from SSR through hydration.
  const animate = reduce === false;

  const base: React.CSSProperties = {
    backgroundImage: animate
      ? "conic-gradient(at 50% 50%, var(--turquoise-500), var(--peach-500), var(--clay), var(--turquoise-500))"
      : "linear-gradient(90deg, var(--turquoise-500) 0%, var(--peach-500) 55%, var(--clay) 100%)",
    backgroundSize: animate ? "300% 300%" : "100% 100%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };

  const composed = [
    className,
    animate ? "animate-[hue-sweep_7s_linear_infinite]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span lang={lang} className={composed} style={base}>
      {children}
    </span>
  );
}
