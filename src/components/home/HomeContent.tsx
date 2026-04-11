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

  const interactiveCount = useMemo(
    () => topics.filter((t) => t.vizType === "interactive").length,
    [topics]
  );

  return (
    <>
      <HeroSearch
        topics={topics}
        selectedDifficulty={difficulty}
        onDifficultyChange={setDifficulty}
        counts={counts}
      />

      {/* Stats — inline, minimal */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="flex items-center justify-center gap-8 text-[13px] text-tertiary">
          <span><strong className="text-foreground">{topics.length}</strong>{" "}chủ đề</span>
          <span className="w-px h-3 bg-border" />
          <span><strong className="text-foreground">{interactiveCount}</strong>{" "}tương tác</span>
          <span className="w-px h-3 bg-border" />
          <span><strong className="text-foreground">{categories.length}</strong>{" "}danh mục</span>
        </div>
      </section>

      {/* Progress bar */}
      {readTopics.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-10">
          <div className="rounded-[16px] border border-border bg-card/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium text-foreground">
                Tiến độ học tập
              </span>
              <span className="text-[13px] text-tertiary">
                {readTopics.length}/{topics.length}
              </span>
            </div>
            <div className="h-[3px] w-full rounded-full bg-surface">
              <div
                className="h-[3px] rounded-full bg-accent transition-all duration-500"
                style={{ width: `${(readTopics.length / topics.length) * 100}%` }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Category cards */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12">
        <h2 className="text-xl font-semibold text-foreground mb-5 tracking-[-0.01em]">
          Theo danh mục
        </h2>
        <CategorySection
          categories={categories}
          topicsByCategory={topicsByCategory}
          readTopics={readTopics}
        />
      </section>

      {/* All topics grid */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-xl font-semibold text-foreground tracking-[-0.01em]">
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
          <span className="text-[13px] text-tertiary">{filtered.length} chủ đề</span>
        </div>
        <TopicGrid
          topics={filtered}
          readTopics={readTopics}
          bookmarks={bookmarks}
          onToggleBookmark={handleToggleBookmark}
        />
      </section>

    </>
  );
}
