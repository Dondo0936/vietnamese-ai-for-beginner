"use client";

import type { TopicMeta } from "@/lib/types";
import TopicCard from "./TopicCard";

interface TopicGridProps {
  topics: TopicMeta[];
  readTopics?: string[];
  bookmarks?: string[];
  onToggleBookmark?: (slug: string) => void;
}

export default function TopicGrid({
  topics,
  readTopics = [],
  bookmarks = [],
  onToggleBookmark,
}: TopicGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => (
        <TopicCard
          key={topic.slug}
          topic={topic}
          isRead={readTopics.includes(topic.slug)}
          isBookmarked={bookmarks.includes(topic.slug)}
          onToggleBookmark={onToggleBookmark}
        />
      ))}
    </div>
  );
}
