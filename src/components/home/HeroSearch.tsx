"use client";

import SearchBar from "@/components/layout/SearchBar";
import DifficultyFilter from "./DifficultyFilter";
import type { TopicMeta, Difficulty } from "@/lib/types";

interface HeroSearchProps {
  topics: TopicMeta[];
  selectedDifficulty: Difficulty | "all";
  onDifficultyChange: (value: Difficulty | "all") => void;
  counts: Record<string, number>;
}

export default function HeroSearch({
  topics,
  selectedDifficulty,
  onDifficultyChange,
  counts,
}: HeroSearchProps) {
  return (
    <section className="py-16 px-4 text-center">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
        Hiểu AI qua hình ảnh và ví dụ đơn giản
      </h1>
      <p className="mt-3 text-sm text-muted max-w-md mx-auto">
        Khám phá các chủ đề AI/ML qua minh họa tương tác và ví dụ thực tế
        bằng tiếng Việt.
      </p>
      <div className="mt-8">
        <SearchBar topics={topics} />
      </div>
      <div className="mt-5">
        <DifficultyFilter
          selected={selectedDifficulty}
          onChange={onDifficultyChange}
          counts={counts}
        />
      </div>
    </section>
  );
}
