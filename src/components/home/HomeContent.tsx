"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import HeroSearch from "./HeroSearch";
import TopicGrid from "./TopicGrid";
import CategorySection from "./CategorySection";
import { getUserProgress, toggleBookmark } from "@/lib/database";
import type { TopicMeta, Category, Difficulty } from "@/lib/types";

interface HomeContentProps {
  topics: TopicMeta[];
  categories: Category[];
}

export default function HomeContent({ topics, categories }: HomeContentProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [readTopics, setReadTopics] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    getUserProgress().then((progress) => {
      setReadTopics(progress.readTopics);
      setBookmarks(progress.bookmarks);
    });
  }, []);

  const handleToggleBookmark = useCallback(async (slug: string) => {
    const isBookmarked = bookmarks.includes(slug);
    setBookmarks((prev) =>
      isBookmarked ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
    const result = await toggleBookmark(slug);
    if (result !== !isBookmarked) {
      setBookmarks((prev) =>
        result ? [...prev, slug] : prev.filter((s) => s !== slug)
      );
    }
  }, [bookmarks]);

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

      {readTopics.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Tiến độ học tập
              </span>
              <span className="text-sm text-muted">
                {readTopics.length}/{topics.length} chủ đề đã đọc
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-accent transition-all duration-500"
                style={{ width: `${(readTopics.length / topics.length) * 100}%` }}
              />
            </div>
          </div>
        </section>
      )}

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
        <TopicGrid
          topics={filtered}
          readTopics={readTopics}
          bookmarks={bookmarks}
          onToggleBookmark={handleToggleBookmark}
        />
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
