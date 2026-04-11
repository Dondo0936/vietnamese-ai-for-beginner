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
        {/* Editorial serif heading */}
        <h1 className="text-foreground leading-[1.1]" style={{ fontFamily: "var(--font-editorial), Georgia, serif" }}>
          <span className="block text-4xl sm:text-5xl lg:text-6xl font-extrabold italic tracking-tight">
            Hiểu AI qua{" "}
            <span className="gradient-text not-italic">hình ảnh</span>
          </span>
          <span className="block text-3xl sm:text-4xl lg:text-5xl font-bold mt-2 tracking-tight">
            và ví dụ đơn giản
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-muted max-w-lg mx-auto leading-relaxed">
          Khám phá AI/ML qua minh họa tương tác và ví dụ thực tế bằng tiếng Việt.
          Không cần nền tảng kỹ thuật.
        </p>

        {/* Search trigger */}
        <div className="mt-8 max-w-md mx-auto">
          <button
            type="button"
            onClick={triggerCmdK}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-card pl-4 pr-3 py-3.5 text-sm text-muted shadow-sm transition-all hover:border-accent hover:shadow-md"
          >
            <Search size={16} className="text-tertiary shrink-0" />
            <span className="flex-1 text-left">Tìm kiếm chủ đề...</span>
            <kbd className="hidden sm:inline-flex items-center rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] font-mono text-tertiary">
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
