"use client";

import Link from "next/link";
import { topicMap } from "@/topics/registry";

interface TopicLinkProps {
  slug: string;
  children: React.ReactNode;
}

export default function TopicLink({ slug, children }: TopicLinkProps) {
  if (process.env.NODE_ENV === "development" && !topicMap[slug]) {
    console.warn(`[TopicLink] slug "${slug}" not found in topicMap`);
  }

  return (
    <Link
      href={`/topics/${slug}`}
      className="text-accent-dark dark:text-accent border-b border-dotted border-accent-dark/40 dark:border-accent/40 hover:border-accent-dark dark:hover:border-accent hover:opacity-80 transition-opacity"
    >
      {children}
    </Link>
  );
}
