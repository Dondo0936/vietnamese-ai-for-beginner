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

export default function TopicCard({
  topic,
  isRead = false,
  isBookmarked = false,
  onToggleBookmark,
}: TopicCardProps) {
  const BookmarkIcon = isBookmarked ? BookmarkCheck : Bookmark;
  const isApplication = !!topic.applicationOf;

  return (
    <div className={`relative rounded-[var(--r-lg)] border bg-card/50 shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-card hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 ${
      isApplication
        ? "border-[rgba(255,122,41,0.2)] hover:shadow-[var(--shadow-glow-heat)]"
        : "border-border"
    } ${isRead ? "topic-card-read" : ""}`}>
      {onToggleBookmark && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleBookmark(topic.slug);
          }}
          className="absolute top-3 right-3 p-1.5 rounded-[var(--r-sm)] text-tertiary hover:text-accent transition-colors z-10"
          aria-label={isBookmarked ? "Bỏ lưu" : "Lưu lại"}
        >
          <BookmarkIcon className="h-4 w-4" />
        </button>
      )}

      <Link href={`/topics/${topic.slug}`} className="block p-5">
        <div className="pr-6">
          <h3 className="font-display text-sm font-medium text-foreground leading-snug tracking-[-0.01em]">
            {topic.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted leading-relaxed">
            {topic.titleVi}
          </p>
          <p className="mt-2 text-[11px] text-tertiary leading-relaxed line-clamp-2">
            {topic.description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center rounded-[var(--r-pill)] px-2.5 py-0.5 text-[11px] font-semibold ${
              topic.difficulty === "beginner" ? "tag-beginner" :
              topic.difficulty === "intermediate" ? "tag-intermediate" :
              "tag-advanced"
            }`}>
              {difficultyLabel[topic.difficulty]}
            </span>
            {isApplication && (
              <span className="inline-flex items-center rounded-[var(--r-pill)] bg-heat-soft px-2.5 py-0.5 text-[11px] font-medium text-heat">
                Ứng dụng
              </span>
            )}
            {topic.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-[var(--r-pill)] bg-surface px-2.5 py-0.5 text-[11px] font-medium text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
}
