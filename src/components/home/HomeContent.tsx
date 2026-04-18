"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import HeroSearch from "./HeroSearch";
import ProfessionPaths from "./ProfessionPaths";
import TopicGrid from "./TopicGrid";
import AuthWarningBanner from "@/components/ui/AuthWarningBanner";
import { useProgress } from "@/lib/progress-context";
import type { TopicMeta, Category, Difficulty } from "@/lib/types";

/**
 * Homepage composition (Perplexity × Momo DS, ground-up).
 *
 * Sections, in order:
 *   1. Hero — display h1, ask-bar (⌘K), difficulty filter chips.
 *   2. Stats strip — inline mono numbers, hairline dividers.
 *   3. Auth-warning banner (conditional, unchanged behaviour).
 *   4. Progress strip (conditional) — same shape as before, DS tokens.
 *   5. Lộ trình theo nghề nghiệp — 4 profession cards, 2×2 grid.
 *   6. Thư viện chủ đề — category chips + topic rows. Combines the old
 *      "Categories" expand/collapse + "All topics" load-more into one
 *      editorial library section (DS Library view).
 *
 * What was dropped:
 *   - The separate "Theo danh mục" card grid with per-card expand.
 *     Its information (category label + topic count) is now served by
 *     the chip rail above the library grid. One surface, one way to
 *     browse.
 */

interface HomeContentProps {
  topics: TopicMeta[];
  categories: Category[];
}

export default function HomeContent({ topics, categories }: HomeContentProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
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

  return (
    <>
      <HeroSearch
        topics={topics}
        selectedDifficulty={difficulty}
        onDifficultyChange={setDifficulty}
        counts={counts}
      />

      {/* Stats strip — mono numerals, hairline dividers */}
      <section className="mx-auto max-w-[1100px] px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="flex items-center justify-center gap-6 font-mono text-[12px] text-tertiary">
          <span>
            <strong className="font-mono text-foreground">{topics.length}</strong>{" "}
            chủ đề
          </span>
          <span className="h-3 w-px bg-border" aria-hidden="true" />
          <span>
            <strong className="font-mono text-foreground">{categories.length}</strong>{" "}
            danh mục
          </span>
          <span className="h-3 w-px bg-border" aria-hidden="true" />
          <span>
            <strong className="font-mono text-foreground">4</strong> lộ trình
          </span>
        </div>
      </section>

      <AuthWarningBanner />

      {readTopics.length > 0 && (
        <section className="mx-auto max-w-[1100px] px-4 pb-12 sm:px-6">
          <div
            className="border border-border bg-card"
            style={{ borderRadius: 16, padding: "20px 20px 16px" }}
          >
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[13px] font-medium text-foreground">
                Tiến độ học tập
              </span>
              <span className="font-mono text-[12px] text-tertiary">
                {readTopics.length}/{topics.length}
              </span>
            </div>
            <div
              className="h-[2px] w-full overflow-hidden"
              style={{ background: "var(--bg-surface)", borderRadius: 999 }}
            >
              <div
                className="h-full transition-[width] duration-500"
                style={{
                  width: `${(readTopics.length / topics.length) * 100}%`,
                  background: "var(--text-secondary)",
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Profession paths */}
      <section className="mx-auto max-w-[1100px] px-4 pb-14 sm:px-6">
        <SectionHead
          eyebrow="Lộ trình"
          title="Chọn con đường phù hợp"
        />
        <ProfessionPaths topics={topics} readTopics={readTopics} />
      </section>

      {/* Topic library — chips + grid + load more */}
      <LibrarySection
        difficulty={difficulty}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        filtered={filtered}
        readTopics={readTopics}
        bookmarks={bookmarks}
        onToggleBookmark={toggleBookmark}
      />
    </>
  );
}

/* ─── Section head — eyebrow + display title + hairline rule ─── */
function SectionHead({
  eyebrow,
  title,
  meta,
}: {
  eyebrow: string;
  title: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
        <div>
          <p className="ds-eyebrow mb-1.5">{eyebrow}</p>
          <h2
            className="font-display text-foreground"
            style={{
              fontWeight: 500,
              fontSize: 26,
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
              margin: 0,
            }}
          >
            {title}
          </h2>
        </div>
        {meta ? (
          <div className="font-mono text-[12px] text-tertiary">{meta}</div>
        ) : null}
      </div>
    </div>
  );
}

/* ─── Topic library section ─── */
function LibrarySection({
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

  const difficultyLabel =
    difficulty === "all"
      ? "Thư viện chủ đề"
      : difficulty === "beginner"
      ? "Chủ đề cơ bản"
      : difficulty === "intermediate"
      ? "Chủ đề trung bình"
      : "Chủ đề nâng cao";

  return (
    <section className="mx-auto max-w-[1100px] px-4 pb-20 sm:px-6">
      <SectionHead
        eyebrow="Thư viện"
        title={difficultyLabel}
        meta={
          <span>
            <strong className="font-mono text-foreground">{filtered.length}</strong> kết quả
          </span>
        }
      />

      {/* Category chip rail */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        <CategoryChip
          active={selectedCategory === "all"}
          onClick={() => onCategoryChange("all")}
        >
          Tất cả
        </CategoryChip>
        {categories.map((cat) => (
          <CategoryChip
            key={cat.slug}
            active={selectedCategory === cat.slug}
            onClick={() =>
              onCategoryChange(selectedCategory === cat.slug ? "all" : cat.slug)
            }
          >
            {cat.nameVi}
          </CategoryChip>
        ))}
      </div>

      <TopicGrid
        topics={displayed}
        readTopics={readTopics}
        bookmarks={bookmarks}
        onToggleBookmark={onToggleBookmark}
      />

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + BATCH_SIZE)}
            className="inline-flex items-center gap-2 border border-border bg-card px-5 py-2 text-[13px] font-medium text-foreground transition-[border-color,background,box-shadow] duration-200 hover:border-[color:var(--border-strong)] hover:bg-surface"
            style={{
              borderRadius: 999,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            Xem thêm {Math.min(remaining, BATCH_SIZE)} chủ đề
            <ChevronDown size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </section>
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
