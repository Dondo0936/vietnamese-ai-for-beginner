"use client";

import { useState, useMemo } from "react";
import HeroSearch from "./HeroSearch";
import TopicGrid from "./TopicGrid";
import CategorySection from "./CategorySection";
import type { TopicMeta, Category, Difficulty } from "@/lib/types";

interface HomeContentProps {
  topics: TopicMeta[];
  categories: Category[];
}

export default function HomeContent({ topics, categories }: HomeContentProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: topics.length };
    for (const t of topics) {
      c[t.difficulty] = (c[t.difficulty] ?? 0) + 1;
    }
    return c;
  }, [topics]);

  const filtered = useMemo(
    () =>
      difficulty === "all"
        ? topics
        : topics.filter((t) => t.difficulty === difficulty),
    [topics, difficulty]
  );

  const topicsByCategory = useMemo(() => {
    const map: Record<string, TopicMeta[]> = {};
    for (const topic of filtered) {
      if (!map[topic.category]) map[topic.category] = [];
      map[topic.category].push(topic);
    }
    return map;
  }, [filtered]);

  return (
    <>
      <HeroSearch
        topics={topics}
        selectedDifficulty={difficulty}
        onDifficultyChange={setDifficulty}
        counts={counts}
      />

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {difficulty === "all"
              ? "Tất cả chủ đề"
              : `Chủ đề ${
                  difficulty === "beginner"
                    ? "cơ bản"
                    : difficulty === "intermediate"
                    ? "trung bình"
                    : "nâng cao"
                }`}
          </h2>
          <span className="text-sm text-muted">{filtered.length} chủ đề</span>
        </div>
        <TopicGrid topics={filtered} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-lg font-semibold text-foreground mb-6">
          Theo danh mục
        </h2>
        <CategorySection
          categories={categories}
          topicsByCategory={topicsByCategory}
        />
      </section>
    </>
  );
}
