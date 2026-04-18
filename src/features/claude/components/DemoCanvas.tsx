"use client";

import { useReducedMotion } from "framer-motion";
import type { KeyboardEvent, ReactNode } from "react";

export interface DemoCanvasProps {
  title: string;
  children: ReactNode;
  onPlay: () => void;
  onReset: () => void;
  onStep?: () => void;
  /** When true, the demo is currently running. */
  playing?: boolean;
  className?: string;
}

/**
 * Container for each feature demo.
 * - Owns keyboard controls: Space = play, → = step, R = reset.
 * - Emits a "Xem tĩnh" skip button when prefers-reduced-motion is on.
 * - Focusable region so screen-reader users can see its title.
 *
 * Reduced-motion SSR hardening: treat `null` (pre-hydration) as reduced,
 * consistent with AccentHueSweep, to avoid a one-frame motion flash.
 */
export function DemoCanvas({
  title,
  children,
  onPlay,
  onReset,
  onStep,
  playing,
  className = "",
}: DemoCanvasProps) {
  const reduce = useReducedMotion();
  // null (SSR / pre-hydration) and true → static; only show controls
  // after we KNOW motion is OK.
  const motionOK = reduce === false;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " ") {
      e.preventDefault();
      onPlay();
    } else if (e.key === "ArrowRight" && onStep) {
      e.preventDefault();
      onStep();
    } else if (e.key === "r" || e.key === "R") {
      onReset();
    }
  };

  return (
    <section
      role="region"
      aria-label={title}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className={`relative rounded-[14px] border border-border bg-[var(--paper-2,#F3F2EE)] p-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--turquoise-500,#20B8B0)] ${className}`}
    >
      <header className="mb-3 flex items-center justify-between gap-4 text-[12px]">
        <span className="font-mono uppercase tracking-[0.06em] text-tertiary">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {motionOK ? (
            <>
              <button
                type="button"
                onClick={onPlay}
                aria-pressed={!!playing}
                className="rounded-full border border-border bg-card px-3 py-1 text-[11px] text-foreground hover:bg-surface"
              >
                {playing ? "⏸ Pause" : "▶ Play"}
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-full border border-border bg-card px-3 py-1 text-[11px] text-foreground hover:bg-surface"
              >
                ↻ Reset
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-border bg-card px-3 py-1 text-[11px] text-foreground hover:bg-surface"
            >
              Xem tĩnh
            </button>
          )}
        </div>
      </header>
      <div className="relative">{children}</div>
    </section>
  );
}
