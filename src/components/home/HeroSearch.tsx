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
    <section className="relative py-20 px-4 text-center overflow-hidden">
      {/* Subtle dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

      <div className="relative">
        {/* Perplexity-inspired editorial heading — tight tracking, large serif */}
        <h1
          className="text-foreground"
          style={{ fontFamily: "var(--font-editorial), Georgia, serif" }}
        >
          <span className="block text-[40px] sm:text-[56px] lg:text-[72px] font-bold leading-[1.05] tracking-[-0.03em]">
            Hiểu AI qua{" "}
            <span className="gradient-text italic">hình ảnh</span>
          </span>
          <span className="block text-[32px] sm:text-[44px] lg:text-[56px] font-bold leading-[1.1] tracking-[-0.025em] mt-1">
            và ví dụ đơn giản
          </span>
        </h1>

        <p className="mt-6 text-[15px] sm:text-base text-muted max-w-[480px] mx-auto leading-[1.6]">
          Khám phá AI/ML qua minh họa tương tác và ví dụ thực tế bằng tiếng Việt.
          Không cần nền tảng kỹ thuật.
        </p>

        {/* Search trigger */}
        <div className="mt-10 max-w-[420px] mx-auto">
          <button
            type="button"
            onClick={triggerCmdK}
            className="w-full flex items-center gap-3 rounded-full border border-border bg-card/80 backdrop-blur-sm pl-5 pr-4 py-3 text-[14px] text-tertiary transition-all hover:border-foreground/20 hover:shadow-sm"
          >
            <Search size={15} className="text-tertiary shrink-0" />
            <span className="flex-1 text-left">Tìm kiếm chủ đề...</span>
            <kbd className="hidden sm:inline-flex items-center rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-mono text-tertiary">
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
