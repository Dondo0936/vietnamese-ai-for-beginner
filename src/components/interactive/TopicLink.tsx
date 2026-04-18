"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { topicMap } from "@/topics/registry";
import { isAdultPathId, type AdultPathId } from "@/lib/paths";

interface TopicLinkProps {
  slug: string;
  children: React.ReactNode;
}

export default function TopicLink({ slug, children }: TopicLinkProps) {
  // Read ?path= after hydration instead of via useSearchParams(). Reading
  // search params at render-time triggers BAILOUT_TO_CLIENT_SIDE_RENDERING on
  // statically prerendered topic pages, which ships a skeleton as the initial
  // HTML and strips every topic's Vietnamese prose from SEO crawlers.
  const [carryPath, setCarryPath] = useState<AdultPathId | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("path");
    setCarryPath(isAdultPathId(raw) ? raw : null);
  }, []);

  if (process.env.NODE_ENV === "development") {
    if (!topicMap[slug]) {
      console.warn(`[TopicLink] slug "${slug}" not found in topicMap`);
    }
  }

  const href = carryPath ? `/topics/${slug}?path=${carryPath}` : `/topics/${slug}`;

  return (
    <Link
      href={href}
      className="text-accent-dark dark:text-accent border-b border-dotted border-accent-dark/40 dark:border-accent/40 hover:border-accent-dark dark:hover:border-accent hover:opacity-80 transition-opacity"
    >
      {children}
    </Link>
  );
}
