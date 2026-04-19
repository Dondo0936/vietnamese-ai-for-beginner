"use client";

/**
 * ---------------------------------------------------------------------------
 * CONTEXT7 FINDINGS — framer-motion (fetched 2026-04-19, /grx7/framer-motion)
 * ---------------------------------------------------------------------------
 *
 * - `AnimatePresence` wraps keyed children so their `exit` animation plays
 *   before unmount. Each child MUST have a stable `key` so React can track
 *   mount/unmount identity across renders. `initial`, `animate`, `exit`
 *   props on a `motion.*` element drive those phases.
 *
 * - `motion.<element>` (`motion.span`, `motion.div`, …) is a drop-in for
 *   the underlying HTML tag with animation-aware props. `transition` accepts
 *   `duration` (seconds), `ease` (cubic-bezier array `[x1,y1,x2,y2]`),
 *   `delay` (seconds), and `repeat: Infinity` for infinite loops.
 *
 * - `useReducedMotion()` returns `boolean | null` — `null` before the
 *   `prefers-reduced-motion` media query has been read (SSR / pre-hydration).
 *   The rest of this codebase (AccentHueSweep, DemoCanvas) treats `null`
 *   as "reduced" to avoid a one-frame motion flash; we follow the same
 *   contract here.
 *
 * - Stagger via per-element `transition.delay` is the idiomatic way to
 *   offset siblings by a fixed amount without pulling in `variants`.
 *
 * No new dependencies are introduced — framer-motion is already installed
 * and consumed elsewhere in this feature module.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Annotation } from "@/features/claude/types";

export interface AnnotationLayerProps {
  annotations: Annotation[];
  /** 0..1 position of the demo's playhead. */
  playhead: number;
  /** When true, show every annotation ignoring showAt (used by reduced-motion). */
  staticMode?: boolean;
  className?: string;
}

// DS out-ease curve — same bezier used across the rest of the app (e.g.
// HeroSearch). Keeps motion feeling consistent, not bespoke.
const OUT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Entrance / exit durations. Exit is ~35% faster than entrance so the eye
// doesn't linger on departing pins while new ones arrive.
const ENTER_MS = 0.28;
const EXIT_MS = 0.18;

// Label lag — pin lands first, label follows ~80ms later.
const LABEL_DELAY_MS = 0.08;

// Halo pulse timing. 1.6s matches a slow ambient breath; infinite loop.
const PULSE_DURATION_MS = 1.6;

/**
 * Absolutely-positioned overlay that paints numbered pins + side labels
 * over a ClaudeDesktopShell. Pin visibility is scrubbed by the demo's
 * playhead, unless `staticMode` is on (then every annotation shows).
 *
 * Motion design:
 *  - Pins + labels fade-up-scale on mount, mirror-fade on unmount via
 *    `<AnimatePresence>` keyed by `a.id`.
 *  - While visible, each pin sits inside a turquoise halo that breathes
 *    (scale + opacity) on a 1.6s loop — subtle attractor, not a flasher.
 *  - Label is offset by `LABEL_DELAY_MS` so the eye lands on the pin first.
 *
 * Reduced-motion:
 *  - `useReducedMotion()` returns `boolean | null`; `null` (pre-hydration)
 *    is treated as reduced, matching AccentHueSweep / DemoCanvas.
 *  - When reduced OR `staticMode`, we render plain spans (same markup as
 *    before) — no `initial`/`animate`/`exit`, no halo pulse. Consumers'
 *    DOM queries (by text, aria-label) stay identical.
 *
 * Anchors are percent-based, so the layer adapts to shell resizes.
 */
export function AnnotationLayer({
  annotations,
  playhead,
  staticMode = false,
  className = "",
}: AnnotationLayerProps) {
  const reduce = useReducedMotion();
  // `null` (SSR / pre-hydration) → treat as reduced, same contract as
  // DemoCanvas. Only animate when we KNOW motion is OK.
  const motionOK = reduce === false && !staticMode;

  const visible = staticMode
    ? annotations
    : annotations.filter(
        ({ showAt: [s, e] }) => playhead >= s && playhead <= e
      );

  return (
    <div
      aria-hidden={visible.length === 0}
      className={`pointer-events-none absolute inset-0 ${className}`}
    >
      <AnimatePresence initial={false}>
        {visible.map((a) => (
          <motion.div
            key={a.id}
            className="absolute flex items-center gap-2"
            style={{
              left: `${a.anchor.x}%`,
              top: `${a.anchor.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            // When motion is OK, fade-scale-up on mount, mirror on unmount.
            // When reduced / static, all three phases collapse to the same
            // settled state → no transition applied.
            initial={motionOK ? { opacity: 0, scale: 0.9, y: 4 } : false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            // Per-phase `transition` inside `exit` overrides the top-level
            // transition, so exits run shorter than entrances. When motion
            // is off, every phase collapses to `duration: 0`.
            exit={
              motionOK
                ? {
                    opacity: 0,
                    scale: 0.9,
                    y: 4,
                    transition: { duration: EXIT_MS, ease: OUT_EASE },
                  }
                : { opacity: 1, transition: { duration: 0 } }
            }
            transition={
              motionOK
                ? { duration: ENTER_MS, ease: OUT_EASE }
                : { duration: 0 }
            }
          >
            {/* Pin + halo. The halo is a sibling motion.span positioned
                absolutely over the pin; the pin itself stays still so the
                numeral remains readable. */}
            <span className="relative flex h-6 w-6 items-center justify-center">
              {motionOK ? (
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full"
                  style={{
                    // rgba(19,52,59,…) is the turquoise-ink token with alpha.
                    // Box-shadow ring reads cleaner than a border at scale,
                    // because the ring sits outside the element's bounds
                    // and doesn't distort the circle's center.
                    boxShadow: "0 0 0 2px rgba(19, 52, 59, 0.35)",
                  }}
                  initial={{ scale: 1, opacity: 0.35 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{
                    duration: PULSE_DURATION_MS,
                    ease: "easeOut",
                    repeat: Infinity,
                  }}
                />
              ) : null}
              <span
                aria-label={a.description}
                role="img"
                className="relative flex h-6 w-6 items-center justify-center rounded-full border border-foreground bg-[var(--paper,#FBFAF7)] text-[11px] font-semibold text-foreground"
                style={{
                  // Layered box-shadow = lift + turquoise halo so pins sit
                  // proud of the shell chrome instead of blending into paper.
                  boxShadow:
                    "0 2px 6px rgba(0,0,0,0.10), 0 0 0 3px var(--paper,#FBFAF7), 0 0 0 4px rgba(19,52,59,0.18)",
                }}
              >
                {a.pin}
              </span>
            </span>
            {/* Label — offset by LABEL_DELAY_MS so the eye lands on the pin
                first, then the label reads in. When motion is off, the
                label renders in its final state with zero transition. */}
            <motion.span
              className="max-w-[220px] rounded-[6px] border border-border bg-[var(--pure-white,#FFFFFF)] px-2 py-0.5 text-[12px] leading-[1.35] text-foreground whitespace-normal"
              style={{
                // Pure-white against paper-2 gives a visible surface break;
                // left accent tethers the label to the pin visually; soft
                // shadow adds lift.
                borderLeft: "2px solid var(--turquoise-ink, #13343B)",
                boxShadow:
                  "0 2px 10px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
              }}
              initial={motionOK ? { opacity: 0, y: 4 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={
                motionOK
                  ? {
                      opacity: 0,
                      y: 4,
                      // No stagger on exit — everything collapses together
                      // so there's no trailing label hanging after its pin.
                      transition: { duration: EXIT_MS, ease: OUT_EASE },
                    }
                  : { opacity: 1, transition: { duration: 0 } }
              }
              transition={
                motionOK
                  ? {
                      duration: ENTER_MS,
                      ease: OUT_EASE,
                      delay: LABEL_DELAY_MS,
                    }
                  : { duration: 0 }
              }
            >
              {a.label}
            </motion.span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
