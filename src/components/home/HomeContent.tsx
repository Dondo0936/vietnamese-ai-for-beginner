"use client";

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import HeroSearch from "./HeroSearch";
import ProfessionPaths from "./ProfessionPaths";
import TopicGrid from "./TopicGrid";
import CategorySection from "./CategorySection";
import AuthWarningBanner from "@/components/ui/AuthWarningBanner";
import { useProgress } from "@/lib/progress-context";
import type { TopicMeta, Category, Difficulty } from "@/lib/types";

interface HomeContentProps {
  topics: TopicMeta[];
  categories: Category[];
}

export default function HomeContent({ topics, categories }: HomeContentProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const { readTopics, bookmarks, toggleBookmark } = useProgress();

  const handleToggleBookmark = toggleBookmark;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: topics.length };
    for (const t of topics) {
      c[t.difficulty] = (c[t.difficulty] ?? 0) + 1;
    }
    return c;
  }, [topics]);

  const filtered = useMemo(
    () =>
      topics.filter((t) => {
        if (difficulty !== "all" && t.difficulty !== difficulty) return false;
        if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
        return true;
      }),
    [topics, difficulty, selectedCategory]
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

      {/* Stats — inline, minimal */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="flex items-center justify-center gap-8 text-[13px] text-tertiary">
          <span><strong className="text-foreground">{topics.length}</strong>{" "}chủ đề</span>
          <span className="w-px h-3 bg-border" />
          <span><strong className="text-foreground">{categories.length}</strong>{" "}danh mục</span>
          <span className="w-px h-3 bg-border" />
          <span><strong className="text-foreground">4</strong>{" "}lộ trình</span>
        </div>
      </section>

      <AuthWarningBanner />

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

      {/* Profession paths */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-12">
        <h2 className="text-xl font-semibold text-foreground mb-5 tracking-[-0.01em]">
          Lộ trình theo nghề nghiệp
        </h2>
        <ProfessionPaths topics={topics} readTopics={readTopics} />
      </section>

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

      {/* All topics grid — collapsed by default, expand on click */}
      <AllTopicsSection
        difficulty={difficulty}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        filtered={filtered}
        readTopics={readTopics}
        bookmarks={bookmarks}
        onToggleBookmark={handleToggleBookmark}
      />

    </>
  );
}

// ─── Collapsed "All Topics" section ───
function AllTopicsSection({
  difficulty,
  selectedCategory,
  onCategoryChange,
  categories,
  filtered,
  readTopics,
  bookmarks,
  onToggleBookmark,
}: {
  difficulty: Difficulty | "all";
  selectedCategory: string | "all";
  onCategoryChange: (cat: string | "all") => void;
  categories: Category[];
  filtered: TopicMeta[];
  readTopics: string[];
  bookmarks: string[];
  onToggleBookmark: (slug: string) => void;
}) {
  const BATCH_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const displayed = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const remaining = filtered.length - visibleCount;

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
      <div className="flex items-baseline justify-between mb-3">
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

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={`inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap ${
            selectedCategory === "all"
              ? "bg-accent text-white"
              : "bg-surface text-muted hover:text-foreground hover:bg-surface-hover"
          }`}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => onCategoryChange(selectedCategory === cat.slug ? "all" : cat.slug)}
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap ${
              selectedCategory === cat.slug
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            {cat.nameVi}
          </button>
        ))}
      </div>
      <TopicGrid
        topics={displayed}
        readTopics={readTopics}
        bookmarks={bookmarks}
        onToggleBookmark={onToggleBookmark}
      />
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + BATCH_SIZE)}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-6 py-2.5 text-[13px] font-medium text-muted transition-all hover:text-foreground hover:bg-card hover:shadow-sm"
          >
            Xem thêm {Math.min(remaining, BATCH_SIZE)} chủ đề
            <ChevronDown size={14} />
          </button>
        </div>
      )}
    </section>
  );
}
