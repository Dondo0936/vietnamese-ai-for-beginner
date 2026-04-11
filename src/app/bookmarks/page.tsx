"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TopicCard from "@/components/home/TopicCard";
import { getUserProgress, toggleBookmark } from "@/lib/database";
import { getTopicBySlug } from "@/topics/registry";
import type { TopicMeta } from "@/lib/types";

export default function BookmarksPage() {
  const [bookmarkedTopics, setBookmarkedTopics] = useState<TopicMeta[]>([]);
  const [bookmarkSlugs, setBookmarkSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookmarks() {
      try {
        const progress = await getUserProgress();
        const slugs = progress.bookmarks;
        const topics = slugs
          .map((slug) => getTopicBySlug(slug))
          .filter((t): t is TopicMeta => t !== undefined);

        setBookmarkSlugs(slugs);
        setBookmarkedTopics(topics);
      } catch {
        // Fail silently
      } finally {
        setLoading(false);
      }
    }

    loadBookmarks();
  }, []);

  async function handleToggleBookmark(slug: string) {
    const stillBookmarked = await toggleBookmark(slug);
    if (!stillBookmarked) {
      setBookmarkSlugs((prev) => prev.filter((s) => s !== slug));
      setBookmarkedTopics((prev) => prev.filter((t) => t.slug !== slug));
    }
  }

  return (
    <>
      <Navbar />

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-8 flex items-center gap-3">
            <Bookmark className="h-6 w-6 text-accent" />
            <h1 className="text-2xl font-bold text-foreground">
              Chủ đề đã lưu
            </h1>
          </div>

          {loading ? (
            <div className="text-center py-16 text-muted">
              <p>Đang tải...</p>
            </div>
          ) : bookmarkedTopics.length === 0 ? (
            <div className="text-center py-16">
              <Bookmark className="mx-auto h-12 w-12 text-slate-400 mb-4" />
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
                  isBookmarked={bookmarkSlugs.includes(topic.slug)}
                  onToggleBookmark={handleToggleBookmark}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
