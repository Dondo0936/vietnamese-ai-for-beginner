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

  const base: React.CSSProperties = {
    backgroundImage: reduce
      ? "linear-gradient(90deg, var(--turquoise-500) 0%, var(--peach-500) 55%, var(--clay) 100%)"
      : "conic-gradient(from var(--hue-sweep-angle, 0deg) at 50% 50%, var(--turquoise-500), var(--peach-500), var(--clay), var(--turquoise-500))",
    backgroundSize: reduce ? "100% 100%" : "300% 300%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };

  return (
    <span
      lang={lang}
      className={
        reduce
          ? className
          : `${className} animate-[hue-sweep_7s_linear_infinite]`
      }
      style={base}
    >
      {children}
    </span>
  );
}
