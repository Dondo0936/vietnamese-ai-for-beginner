"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import Link from "next/link";

/**
 * Landing search — catalog search (NOT an AI prompt box).
 *
 * Per user ask: placeholder is a plain catalog teaser, clicking the
 * input OR pressing ⌘K routes to /browse where real search lives.
 * Chips link directly to /browse?q=<term> so a learner can dive in.
 */

const CHIPS = [
  "attention",
  "RAG",
  "fine-tuning",
  "bias-variance",
  "LoRA",
  "reasoning models",
  "MoE",
  "KV cache",
  "constitutional AI",
  "diffusion",
  "MLOps",
];

export function LandingSearch() {
  const router = useRouter();
  return (
    <section className="ld-search" id="search">
      <div className="ld-search__eyebrow">
        ✳ 260 chủ đề · 4 lộ trình · tiếng Việt · mã nguồn mở
      </div>
      <h2 className="ld-search__h">
        Hỏi bất cứ gì<br />về <em>AI.</em>
      </h2>

      <div className="ld-search__box">
        <Search size={20} strokeWidth={1.8} className="ld-search__icon" />
        <input
          type="search"
          role="searchbox"
          aria-label="Tìm chủ đề"
          className="ld-search__input"
          placeholder="Tìm chủ đề — RAG, transformer, gradient descent…"
          onFocus={(e) => {
            // Hand off to the full catalog's real search on first keypress.
            e.currentTarget.blur();
            router.push("/browse");
          }}
        />
        <span className="ld-search__kbd" aria-hidden="true">⌘ K</span>
      </div>

      <div className="ld-search__chips" data-testid="landing-search-chips">
        <span className="ld-chip-label">Gợi ý:</span>
        {CHIPS.map((t) => (
          <Link
            key={t}
            href={`/browse?q=${encodeURIComponent(t)}`}
            className="ld-chip"
            data-chip
          >
            {t}
          </Link>
        ))}
      </div>
    </section>
  );
}
