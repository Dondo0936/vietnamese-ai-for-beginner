"use client";

import { useMemo } from "react";
import { Bookmark } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import TopicCard from "@/components/home/TopicCard";
import { useProgress } from "@/lib/progress-context";
import { getTopicBySlug } from "@/topics/registry";
import type { TopicMeta } from "@/lib/types";

export default function BookmarksPage() {
  return (
    <AppShell>
      <BookmarksContent />
    </AppShell>
  );
}

function BookmarksContent() {
  const { bookmarks, toggleBookmark, loading } = useProgress();

  const bookmarkedTopics = useMemo(
    () => bookmarks
      .map((slug) => getTopicBySlug(slug))
      .filter((t): t is TopicMeta => t !== undefined),
    [bookmarks]
  );

  async function handleToggleBookmark(slug: string) {
    await toggleBookmark(slug);
  }

  return (
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <Bookmark className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold text-foreground">
            Chủ đề đã lưu
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-lg" />
            ))}
          </div>
        ) : bookmarkedTopics.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="mx-auto h-12 w-12 text-tertiary mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Chưa có chủ đề nào được lưu
            </h2>
            <p className="text-muted max-w-md mx-auto">
              Nhấn vào biểu tượng đánh dấu trên bất kỳ chủ đề nào để lưu lại
              và xem lại sau. Các chủ đề đã lưu sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bookmarkedTopics.map((topic) => (
              <TopicCard
                key={topic.slug}
                topic={topic}
                isBookmarked={bookmarks.includes(topic.slug)}
                onToggleBookmark={handleToggleBookmark}
              />
            ))}
          </div>
        )}
      </section>
  );
}
