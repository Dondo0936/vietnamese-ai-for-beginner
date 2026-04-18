"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";
import GravityGrid from "./shaders/GravityGrid";
import CellBloom from "./shaders/CellBloom";

/**
 * Theme-aware, motion-aware shader backdrop for the homepage hero.
 *
 * Layout: absolutely positioned inside the hero section so it scrolls
 * with content and never covers the navbar. Pointer-events disabled so
 * the canvas is transparent to clicks/taps.
 *
 * Degradation order:
 *  1. SSR / pre-mount → static CSS gradient fallback only.
 *  2. prefers-reduced-motion → shader renders exactly one frame (no rAF).
 *  3. No WebGL context → canvas is blank; fallback gradient behind it
 *     still provides a visible background.
 */
export default function ShaderBackground() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Static fallback gradient — always rendered, lives behind the canvas.
  // Even if WebGL fails, the hero still has a background.
  const fallbackStyle =
    theme === "dark"
      ? {
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(32,184,174,0.14) 0%, rgba(10,10,11,0) 60%), #0A0A0B",
        }
      : {
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(15,138,131,0.10) 0%, rgba(251,247,242,0) 55%), #FBF7F2",
        };

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={fallbackStyle}
    >
      {mounted ? (
        theme === "dark" ? (
          <GravityGrid reducedMotion={reducedMotion} />
        ) : (
          <CellBloom reducedMotion={reducedMotion} />
        )
      ) : null}
    </div>
  );
}
