"use client";

import { Search } from "lucide-react";
import DifficultyFilter from "./DifficultyFilter";
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

export default function HeroSearch({
  selectedDifficulty,
  onDifficultyChange,
  counts,
}: HeroSearchProps) {
  return (
    <section className="relative py-20 sm:py-28 px-4 text-center overflow-hidden">
      <div className="relative">
        <h1 className="font-display text-foreground font-normal leading-[0.98] tracking-[-0.04em] text-[clamp(48px,7vw,96px)]">
          Hiểu AI qua{" "}
          <em className="font-serif italic font-normal tracking-[-0.02em]">
            hình ảnh trực quan
          </em>
        </h1>

        <p className="mt-7 text-[18px] text-muted max-w-[600px] mx-auto leading-[1.55]">
          Khám phá AI/ML qua minh họa tương tác và ví dụ thực tế bằng tiếng Việt.
          Không cần nền tảng kỹ thuật.
        </p>

        <div className="mt-10 max-w-[480px] mx-auto">
          <button
            type="button"
            onClick={triggerCmdK}
            className="w-full flex items-center gap-3 rounded-[var(--r-pill)] border border-border bg-card pl-6 pr-4 py-3.5 text-[15px] text-tertiary shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-glow-accent)] focus-within:shadow-[var(--shadow-glow-accent)]"
          >
            <Search size={16} className="text-tertiary shrink-0" />
            <span className="flex-1 text-left">Tìm kiếm chủ đề...</span>
            <kbd className="hidden sm:inline-flex items-center rounded-[var(--r-sm)] border border-border bg-surface px-2 py-0.5 text-[10px] font-mono text-tertiary tracking-[0.04em]">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="mt-5">
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
