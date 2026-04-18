"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface DemoPlayhead {
  /** 0..1 */
  playhead: number;
  playing: boolean;
  /** Toggles play/pause. */
  onPlay: () => void;
  onReset: () => void;
  /** Nudge forward by `step` (default 0.1), clamped at 1. */
  onStep: () => void;
}

export interface UseDemoPlayheadOpts {
  /** Milliseconds for a full 0 → 1 sweep. */
  duration: number;
  /** Fraction per onStep call (default 0.1). */
  step?: number;
  /** Auto-reset to 0 after reaching 1, with a pause (default true). */
  loop?: boolean;
  /** Ms to hold at 1.0 before looping (default 1500). */
  pauseAtEnd?: number;
}

/**
 * rAF-driven 0..1 playhead used by every Phase 2 demo tile.
 * The demo scripts the scene against `playhead`; this hook just
 * measures time. Pure-client (uses requestAnimationFrame).
 *
 * Design notes:
 *  - We hold time in a ref, not in state, to avoid re-renders at
 *    every frame during the elapsed-time read. Only the derived
 *    `playhead` (rounded per frame) is stateful.
 *  - Loop pause: when the sweep hits 1, we set a `holdUntil` timestamp
 *    in a ref so subsequent frames freeze playhead at 1 until we
 *    cross that mark, then we reset start and resume.
 */
export function useDemoPlayhead(opts: UseDemoPlayheadOpts): DemoPlayhead {
  const step = opts.step ?? 0.1;
  const loop = opts.loop ?? true;
  const pauseAtEnd = opts.pauseAtEnd ?? 1500;

  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);

  const startedAtRef = useRef<number | null>(null);
  const holdUntilRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    startedAtRef.current = performance.now();
    holdUntilRef.current = null;

    const tick = (now: number) => {
      if (holdUntilRef.current !== null) {
        if (now >= holdUntilRef.current) {
          holdUntilRef.current = null;
          startedAtRef.current = now;
          setPlayhead(0);
        }
      } else {
        const start = startedAtRef.current ?? now;
        const t = Math.min(1, (now - start) / opts.duration);
        setPlayhead(t);
        if (t >= 1) {
          if (loop) {
            holdUntilRef.current = now + pauseAtEnd;
          } else {
            setPlaying(false);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [playing, loop, pauseAtEnd, opts.duration]);

  const onPlay = useCallback(() => setPlaying((p) => !p), []);
  const onReset = useCallback(() => {
    setPlaying(false);
    setPlayhead(0);
    holdUntilRef.current = null;
    startedAtRef.current = null;
  }, []);
  const onStep = useCallback(() => {
    setPlayhead((p) => Math.min(1, p + step));
  }, [step]);

  return { playhead, playing, onPlay, onReset, onStep };
}
