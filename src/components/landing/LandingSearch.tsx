import { Search } from "lucide-react";
import Link from "next/link";

/**
 * Landing search — a real catalog search.
 *
 * A native `<form action="/browse" method="GET">` with `name="q"` means
 * typing + Enter navigates to `/browse?q=<value>`. Works without JS, no
 * hidden redirect on focus, and the user can actually type.
 *
 * Chips bypass the catalog and deep-link into specific topic pages so a
 * curious learner can jump straight in.
 */

type Chip = { label: string; href: string };

const CHIPS: Chip[] = [
  { label: "attention", href: "/topics/attention-mechanism" },
  { label: "RAG", href: "/topics/rag" },
  { label: "fine-tuning", href: "/topics/fine-tuning" },
  { label: "bias-variance", href: "/topics/bias-variance" },
  { label: "LoRA", href: "/topics/lora" },
  { label: "reasoning models", href: "/topics/reasoning-models" },
  { label: "MoE", href: "/topics/moe" },
  { label: "KV cache", href: "/topics/kv-cache" },
  { label: "constitutional AI", href: "/topics/constitutional-ai" },
  { label: "diffusion", href: "/topics/diffusion-models" },
  { label: "MLOps", href: "/topics/mlops" },
];

export function LandingSearch() {
  return (
    <section className="ld-search" id="search">
      <div className="ld-search__eyebrow">
        ✳ 260 chủ đề · 4 lộ trình · tiếng Việt · mã nguồn mở
      </div>
      <h2 className="ld-search__h">
        Hỏi bất cứ gì<br />về <em>AI.</em>
      </h2>

      <form
        action="/browse"
        method="GET"
        role="search"
        className="ld-search__box"
      >
        <Search size={20} strokeWidth={1.8} className="ld-search__icon" />
        <input
          type="search"
          name="q"
          role="searchbox"
          aria-label="Tìm chủ đề"
          className="ld-search__input"
          placeholder="Tìm chủ đề — RAG, transformer, gradient descent…"
          autoComplete="off"
        />
        <button type="submit" className="ld-search__kbd" aria-label="Tìm">
          ⌘ K
        </button>
      </form>

      <div className="ld-search__chips" data-testid="landing-search-chips">
        <span className="ld-chip-label">Gợi ý:</span>
        {CHIPS.map((c) => (
          <Link key={c.label} href={c.href} className="ld-chip" data-chip>
            {c.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
