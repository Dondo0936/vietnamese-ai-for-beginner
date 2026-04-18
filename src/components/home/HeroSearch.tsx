"use client";

import { Search } from "lucide-react";
import DifficultyFilter from "./DifficultyFilter";
import ShaderBackground from "./ShaderBackground";
import type { TopicMeta, Difficulty } from "@/lib/types";

interface HeroSearchProps {
  topics: TopicMeta[];
  selectedDifficulty: Difficulty | "all";
  onDifficultyChange: (value: Difficulty | "all") => void;
  counts: Record<string, number>;
}

function triggerCmdK() {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
}

/**
 * Homepage hero — applies the Perplexity × Momo design system.
 *
 * DS rules applied here:
 *  - Sentence case, no exclamation marks, no emoji.
 *  - Space Grotesk for the H1 (--font-display), Inter Tight elsewhere.
 *    Vietnamese H1 uses `lang="vi"` so Inter-Tight's Vietnamese subset
 *    renders with correct diacritic metrics. (Be Vietnam Pro is optional
 *    for full Vietnamese immersion; kept off the hero to honour the
 *    "one typeface per surface" editorial rule.)
 *  - Display tracking -0.02em (`--tracking-tight`), leading 1.05.
 *  - Turquoise used exactly ONCE on the surface — as the emphasised
 *    word in the H1 (deep teal `--turquoise-ink`, not a rainbow
 *    gradient). No second accent anywhere else in the hero.
 *  - Ask-bar anatomy: pure-white surface, 1px `--line` hairline,
 *    `--radius-lg` (12px), `--shadow-sm` at rest, turquoise focus ring.
 *  - Eyebrow in 12px UPPERCASE with `--tracking-caps` (0.08em), ash colour.
 *
 * Preserved from the previous pass:
 *  - Shader background system stays (ShaderBackground → GravityGrid/CellBloom).
 *  - Legibility veil remains so shader colours can't fight the text.
 *  - Vietnamese copy verbatim.
 *  - ⌘K dispatch. `DifficultyFilter` props plumbing unchanged.
 *  - `prefers-reduced-motion` + tab-hidden behaviour lives inside the shader hook.
 */
export default function HeroSearch({
  selectedDifficulty,
  onDifficultyChange,
  counts,
}: HeroSearchProps) {
  return (
    <section className="relative isolate overflow-hidden px-4 pb-16 pt-20 text-center sm:pb-24 sm:pt-28">
      <ShaderBackground />

      {/* Legibility veil — a barely-there radial wash under the text block.
          Keeps WCAG contrast over animated shader colours without hiding them. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 45%, var(--bg-primary) 0%, transparent 70%)",
          opacity: 0.55,
        }}
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center">
        {/* Eyebrow — DS spec: 12px uppercase, tracking-caps, ash colour.
            No decorative icon (DS: "no emoji in product UI"); the mark
            character `*` is brand-friendly but kept off here to stay
            within the "turquoise ≤ 2x" budget. */}
        <div
          className="mb-6 font-mono text-[11px] font-medium uppercase text-tertiary"
          style={{ letterSpacing: "var(--tracking-caps)" }}
        >
          AI cho mọi người · Tiếng Việt
        </div>

        {/* H1 — DS display: Space Grotesk 500, tight tracking, leading 1.05.
            Vietnamese diacritics render through Inter-Tight/Space-Grotesk's
            Vietnamese subsets already loaded in app/layout.tsx. */}
        <h1
          lang="vi"
          className="font-display text-foreground"
          style={{
            fontWeight: 500,
            fontSize: "clamp(44px, 8vw, 96px)",
            lineHeight: "var(--lh-tight, 1.05)",
            letterSpacing: "var(--tracking-tight)",
            margin: 0,
          }}
        >
          Hiểu AI qua{" "}
          <span
            // Single accent on the surface: deep turquoise ink, no gradient,
            // no italic, no serif. DS: "turquoise used sparingly, never
            // decorative." The weight bump (600) gives emphasis without colour.
            style={{
              color: "var(--turquoise-ink)",
              fontWeight: 600,
            }}
          >
            hình ảnh
          </span>
        </h1>

        {/* Sub-head — 18px body, relaxed line-height, graphite secondary.
            DS: plain sentence, no exclamation. Copy verbatim. */}
        <p
          className="mt-7 max-w-[560px] text-muted"
          style={{
            fontSize: "18px",
            lineHeight: 1.55,
          }}
        >
          Khám phá AI/ML qua minh họa tương tác và ví dụ thực tế bằng tiếng Việt.
          Không cần nền tảng kỹ thuật.
        </p>

        {/* Ask-bar — DS input anatomy.
            - Surface: pure white (--bg-card) sitting on the paper hero.
            - 1px hairline border (--border → --line in DS).
            - 12px radius (--r-lg, maps to DS --radius-lg).
            - Resting shadow-sm; focus grows a turquoise ring.
            - Left leading icon (Search, 1.5px stroke via Lucide default).
            - Right trailing kbd hint (mono, --radius-sm).
            A single button acts as a click target that opens the existing
            command palette via ⌘K dispatch — mechanics unchanged. */}
        <div className="mt-10 w-full max-w-[520px]">
          <button
            type="button"
            onClick={triggerCmdK}
            aria-label="Mở tìm kiếm chủ đề (phím tắt Cmd+K)"
            className="group flex w-full items-center gap-3 border border-border bg-card py-[14px] pl-5 pr-3 text-left text-[15px] text-tertiary transition-all duration-[var(--dur-base)] hover:border-[color:var(--border-strong)] focus-within:border-[color:var(--turquoise-300,#6FD6D0)]"
            style={{
              borderRadius: "var(--radius-lg, 12px)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Search
              size={18}
              strokeWidth={1.5}
              className="shrink-0 text-tertiary transition-colors group-hover:text-foreground"
              aria-hidden="true"
            />
            <span className="flex-1">Tìm kiếm chủ đề...</span>
            <kbd
              className="hidden items-center border border-border bg-surface px-2 py-0.5 font-mono text-[10px] text-tertiary sm:inline-flex"
              style={{
                borderRadius: "var(--radius-sm, 4px)",
                letterSpacing: "0.04em",
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="mt-6">
          <DifficultyFilter
            selected={selectedDifficulty}
            onChange={onDifficultyChange}
            counts={counts}
          />
        </div>
      </div>
    </section>
  );
}
