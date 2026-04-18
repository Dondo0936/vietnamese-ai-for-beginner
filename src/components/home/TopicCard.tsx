"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck } from "lucide-react";
import type { TopicMeta } from "@/lib/types";

const difficultyLabel: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung bình",
  advanced: "Nâng cao",
};

interface TopicCardProps {
  topic: TopicMeta;
  isRead?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (slug: string) => void;
}

/**
 * Topic card — DS source-card.
 *
 * Light: pure-white surface, 1px hairline, radius-lg (12px), shadow-sm.
 * Title uses display type; Vietnamese secondary line uses body with
 * relaxed leading for diacritic fidelity. Difficulty + tags live in a
 * single mono-eyebrow row — no pill clutter.
 *
 * Read indicator: left hairline in ink (monochrome, no turquoise — the
 * accent budget is spent on the hero mark).
 */
export default function TopicCard({
  topic,
  isRead = false,
  isBookmarked = false,
  onToggleBookmark,
}: TopicCardProps) {
  const BookmarkIcon = isBookmarked ? BookmarkCheck : Bookmark;
  const isApplication = !!topic.applicationOf;

  return (
    <div
      className="relative overflow-hidden border border-border bg-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-[1px] hover:border-[color:var(--border-strong)]"
      style={{
        borderRadius: 12,
        boxShadow: "var(--shadow-sm)",
        borderLeftColor: isRead ? "var(--text-secondary)" : undefined,
        borderLeftWidth: isRead ? 3 : 1,
      }}
    >
      {onToggleBookmark && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleBookmark(topic.slug);
          }}
          className="absolute top-2.5 right-2.5 z-10 rounded-md p-1.5 text-tertiary transition-colors hover:bg-surface hover:text-foreground"
          aria-label={isBookmarked ? "Bỏ lưu" : "Lưu lại"}
        >
          <BookmarkIcon className="h-4 w-4" strokeWidth={1.5} />
        </button>
      )}

      <Link href={`/topics/${topic.slug}`} className="block p-5">
        {/* Eyebrow — difficulty + application, mono uppercase */}
        <div className="ds-eyebrow mb-3 flex items-center gap-2">
          <span>{difficultyLabel[topic.difficulty]}</span>
          {isApplication && (
            <>
              <span className="h-2.5 w-px bg-border" aria-hidden="true" />
              <span>Ứng dụng</span>
            </>
          )}
        </div>

        <div className="pr-7">
          <h3
            className="font-display text-foreground"
            style={{
              fontWeight: 500,
              fontSize: 17,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            {topic.title}
          </h3>
          <p
            lang="vi"
            className="mt-1 text-muted"
            style={{ fontSize: 13, lineHeight: 1.5 }}
          >
            {topic.titleVi}
          </p>
          <p
            className="mt-3 text-tertiary"
            style={{ fontSize: 12.5, lineHeight: 1.55 }}
          >
            {topic.description}
          </p>

          {topic.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1">
              {topic.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 font-mono text-[10.5px] text-tertiary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
