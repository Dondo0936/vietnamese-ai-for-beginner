"use client";

import type { TopicMeta } from "@/lib/types";
import TopicCard from "./TopicCard";

interface TopicGridProps {
  topics: TopicMeta[];
}

export default function TopicGrid({ topics }: TopicGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {topics.map((topic) => (
        <TopicCard key={topic.slug} topic={topic} />
      ))}
    </div>
  );
}
