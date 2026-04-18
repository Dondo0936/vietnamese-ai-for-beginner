"use client";

import { Search, ArrowRight } from "lucide-react";
import { motion, MotionConfig, useReducedMotion } from "framer-motion";
import DifficultyFilter from "./DifficultyFilter";
import type { TopicMeta, Difficulty } from "@/lib/types";

interface HeroSearchProps {
  topics: TopicMeta[];
  selectedDifficulty: Difficulty | "all";
  onDifficultyChange: (value: Difficulty | "all") => void;
  counts: Record<string, number>;
}

/**
 * Homepage hero — Perplexity × Momo DS, ground-up.
 *
 * DS alignment:
 *  - Flat paper surface. No shader, no gradient, no decorative fill.
 *  - Sentence case. No emoji in product. One DS asterisk mark (✳) in
 *    turquoise-ink, counted as the surface's single turquoise use.
 *  - Display type (Space Grotesk / --font-display) at h1 size only.
 *    Vietnamese diacritics rely on Space Grotesk's latin-ext + vi subsets
 *    already loaded in `app/layout.tsx` (Be Vietnam Pro intentionally
 *    skipped per prior decision to keep bundle lean).
 *  - Ask bar: pure-white surface, 1px hairline, radius-lg (12px), resting
 *    shadow-sm, turquoise focus halo. Left leading ✳, right-side ⌘K kbd
 *    hint and an accent-ink arrow capsule.
 *  - Motion: one-shot fade+y-8 on mount. MotionConfig reducedMotion="user"
 *    honours prefers-reduced-motion automatically.
 *
 * Functional preservation:
 *  - ⌘K dispatch unchanged.
 *  - DifficultyFilter props plumbed through.
 *  - Vietnamese copy verbatim.
 */

function triggerCmdK() {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
}

export default function HeroSearch({
  selectedDifficulty,
  onDifficultyChange,
  counts,
}: HeroSearchProps) {
  const reduce = useReducedMotion();

  // Short, out-eased motion (DS: 120–360ms, ease-out).
  const base = reduce
    ? { duration: 0 }
    : { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-labelledby="hero-title"
        className="relative px-4 pt-16 pb-10 sm:pt-24 sm:pb-14"
      >
        <div className="mx-auto flex max-w-[720px] flex-col items-center text-center">
          {/* DS mark — single turquoise moment on the surface */}
          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...base, delay: reduce ? 0 : 0.02 }}
            className="ds-mark mb-8 text-[44px] sm:text-[52px] font-medium leading-none"
          >
            ✳
          </motion.span>

          {/* Eyebrow — 11px uppercase mono, DS tracking-caps */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...base, delay: reduce ? 0 : 0.06 }}
            className="ds-eyebrow mb-6"
          >
            AI cho mọi người · Tiếng Việt
          </motion.p>

          {/* H1 — display type, DS tight tracking, leading 1.05 */}
          <motion.h1
            id="hero-title"
            lang="vi"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...base, delay: reduce ? 0 : 0.1 }}
            className="font-display text-foreground"
            style={{
              fontWeight: 500,
              fontSize: "clamp(40px, 7.2vw, 72px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              margin: 0,
              textWrap: "balance",
            }}
          >
            Hiểu AI qua hình ảnh và ví dụ.
          </motion.h1>

          {/* Sub-head — body at 18px, relaxed leading, secondary ink */}
          <motion.p
            lang="vi"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...base, delay: reduce ? 0 : 0.14 }}
            className="mt-5 max-w-[540px] text-muted"
            style={{ fontSize: 17, lineHeight: 1.55, textWrap: "pretty" }}
          >
            Khám phá AI/ML qua minh họa tương tác và ví dụ thực tế bằng tiếng Việt.
            Không cần nền tảng kỹ thuật.
          </motion.p>

          {/* Ask bar — DS input anatomy */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...base, delay: reduce ? 0 : 0.2 }}
            className="mt-9 w-full max-w-[560px]"
          >
            <button
              type="button"
              onClick={triggerCmdK}
              aria-label="Mở tìm kiếm chủ đề (phím tắt Cmd K)"
              className="ds-ask group flex w-full items-center gap-3 border border-border bg-card py-[13px] pl-5 pr-[6px] text-left text-[15px] text-tertiary transition-[border-color,box-shadow] duration-200"
              style={{
                borderRadius: 14,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <Search
                size={18}
                strokeWidth={1.5}
                className="shrink-0 text-tertiary transition-colors group-hover:text-foreground"
                aria-hidden="true"
              />
              <span className="flex-1 truncate">Tìm kiếm chủ đề...</span>
              <kbd
                aria-hidden="true"
                className="hidden items-center border border-border bg-surface px-2 py-0.5 font-mono text-[10px] text-tertiary sm:inline-flex"
                style={{ borderRadius: 4, letterSpacing: "0.04em" }}
              >
                ⌘K
              </kbd>
              <span
                aria-hidden="true"
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full transition-colors"
                style={{
                  background: "var(--turquoise-ink, #13343B)",
                  color: "var(--bg-primary)",
                }}
              >
                <ArrowRight size={16} strokeWidth={1.75} />
              </span>
            </button>
          </motion.div>

          {/* Difficulty filter — kept functional, DS pill style lives in the component */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...base, delay: reduce ? 0 : 0.26 }}
            className="mt-7"
          >
            <DifficultyFilter
              selected={selectedDifficulty}
              onChange={onDifficultyChange}
              counts={counts}
            />
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}
