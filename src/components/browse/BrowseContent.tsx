"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import DifficultyFilter from "@/components/home/DifficultyFilter";
import TopicGrid from "@/components/home/TopicGrid";
import SearchBar from "@/components/layout/SearchBar";
import { useProgress } from "@/lib/progress-context";
import type { TopicMeta, Category, Difficulty } from "@/lib/types";

/**
 * /browse — the topic catalog.
 *
 * Lifted from `HomeContent`'s library section when the landing page
 * redesign moved `/` to marketing. Shape is unchanged so existing
 * deep links still work: chip rail for categories, pill group for
 * difficulty, 3-up grid, load-more pagination at 12/batch.
 */
interface BrowseContentProps {
  topics: TopicMeta[];
  categories: Category[];
}

const BATCH_SIZE = 12;

export default function BrowseContent({ topics, categories }: BrowseContentProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const { readTopics, bookmarks, toggleBookmark } = useProgress();

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

  const displayed = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const remaining = filtered.length - visibleCount;

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-10 sm:px-6">
      {/* Page header */}
      <header className="mb-8 border-b border-border pb-5">
        <p className="ds-eyebrow mb-2">Thư viện</p>
        <h1
          className="font-display text-foreground"
          style={{
            fontWeight: 500,
            fontSize: 34,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Tất cả chủ đề
        </h1>
        <p className="mt-3 max-w-[640px] text-[14px] leading-relaxed text-muted">
          {topics.length} chủ đề · {categories.length} danh mục · lọc theo độ khó
          hoặc nhấn ⌘K để tìm nhanh.
        </p>
      </header>

      {/* Inline search — same index + behavior as the ⌘K palette. */}
      <div className="mb-8">
        <SearchBar topics={topics} />
      </div>

      {/* Difficulty pill group */}
      <div className="mb-6 flex justify-start">
        <DifficultyFilter
          selected={difficulty}
          onChange={(d) => {
            setDifficulty(d);
            setVisibleCount(BATCH_SIZE);
          }}
          counts={counts}
        />
      </div>

      {/* Category chip rail */}
      <div className="mb-8 flex flex-wrap gap-1.5">
        <CategoryChip
          active={selectedCategory === "all"}
          onClick={() => {
            setSelectedCategory("all");
            setVisibleCount(BATCH_SIZE);
          }}
        >
          Tất cả
        </CategoryChip>
        {categories.map((cat) => (
          <CategoryChip
            key={cat.slug}
            active={selectedCategory === cat.slug}
            onClick={() => {
              setSelectedCategory(selectedCategory === cat.slug ? "all" : cat.slug);
              setVisibleCount(BATCH_SIZE);
            }}
          >
            {cat.nameVi}
          </CategoryChip>
        ))}
      </div>

      <div className="mb-4 text-[12px] font-mono text-tertiary">
        {filtered.length} kết quả
      </div>

      <TopicGrid
        topics={displayed}
        readTopics={readTopics}
        bookmarks={bookmarks}
        onToggleBookmark={toggleBookmark}
      />

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + BATCH_SIZE)}
            className="inline-flex items-center gap-2 border border-border bg-card px-5 py-2 text-[13px] font-medium text-foreground transition-[border-color,background,box-shadow] duration-200 hover:border-[color:var(--border-strong)] hover:bg-surface"
            style={{ borderRadius: 999, boxShadow: "var(--shadow-sm)" }}
          >
            Xem thêm {Math.min(remaining, BATCH_SIZE)} chủ đề
            <ChevronDown size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-muted hover:border-[color:var(--border-strong)] hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
