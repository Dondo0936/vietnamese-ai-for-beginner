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
    <section className="relative py-20 sm:py-24 px-4 text-center overflow-hidden">
      {/* Subtle dot grid */}
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

      <div className="relative">
        {/* Sans-serif heading — MoMo-inspired: bold, readable Vietnamese */}
        <h1 className="text-foreground font-bold leading-[1.15] tracking-[-0.02em] text-[32px] sm:text-[44px] lg:text-[56px]">
          Hiểu AI qua{" "}
          <span className="gradient-text">hình ảnh trực quan</span>
        </h1>

        <p className="mt-6 text-[15px] text-muted max-w-[440px] mx-auto leading-[1.65]">
          Khám phá AI/ML qua minh họa tương tác và ví dụ thực tế bằng tiếng Việt.
          Không cần nền tảng kỹ thuật.
        </p>

        {/* Search trigger — rounded pill */}
        <div className="mt-10 max-w-[400px] mx-auto">
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
