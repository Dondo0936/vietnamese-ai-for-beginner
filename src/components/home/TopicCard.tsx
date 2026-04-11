"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck, Brain, BarChart3, Layers, Search } from "lucide-react";
import type { TopicMeta } from "@/lib/types";

const difficultyLabel: Record<string, string> = {
  beginner: "Cơ bản",
  intermediate: "Trung bình",
  advanced: "Nâng cao",
};

const categoryIcons: Record<string, React.ElementType> = {
  "neural-fundamentals": Brain,
  "classic-ml": BarChart3,
  "dl-architectures": Layers,
  "search-retrieval": Search,
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
  const Icon = categoryIcons[topic.category] ?? Brain;
  const BookmarkIcon = isBookmarked ? BookmarkCheck : Bookmark;

  return (
    <div
      className={`relative group rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-shadow ${
        isRead ? "topic-card-read" : ""
      }`}
    >
      {/* Bookmark button */}
      {onToggleBookmark && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleBookmark(topic.slug);
          }}
          className="absolute top-3 right-3 p-1 rounded-md text-muted hover:text-accent transition-colors z-10"
          aria-label={isBookmarked ? "Bỏ lưu" : "Lưu lại"}
        >
          <BookmarkIcon className="h-4 w-4" />
        </button>
      )}

      <Link href={`/topics/${topic.slug}`} className="block p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-light text-accent-dark">
            <Icon className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1 pr-6">
            <h3 className="text-sm font-semibold text-foreground leading-snug">
              {topic.title}
            </h3>
            <p className="mt-0.5 text-xs text-muted leading-relaxed">
              {topic.titleVi}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-accent-light px-2.5 py-0.5 text-[11px] font-medium text-teal-700">
                {difficultyLabel[topic.difficulty]}
              </span>
              {topic.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
