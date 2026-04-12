"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { topicMap } from "@/topics/registry";
import { kidsTopicMap } from "@/topics/kids/kids-registry";
import { isAdultPathId } from "@/lib/paths";

interface TopicLinkProps {
  slug: string;
  children: React.ReactNode;
}

/**
 * Links to a topic page. Automatically:
 *   - Routes to /kids/topics/:slug when rendered under /kids/*, validating
 *     against kidsTopicMap (adult routes stay back-compatible).
 *   - Preserves a `?path=` query param from the current URL when present
 *     and valid, so in-body cross-references keep the learner on their path.
 *     If the target slug isn't actually in that path, TopicLayout gracefully
 *     falls back to category-based navigation on the target page.
 */
export default function TopicLink({ slug, children }: TopicLinkProps) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const isKidRoute = pathname.startsWith("/kids");

  if (process.env.NODE_ENV === "development") {
    const registry = isKidRoute ? kidsTopicMap : topicMap;
    if (!registry[slug]) {
      console.warn(
        `[TopicLink] slug "${slug}" not found in ${isKidRoute ? "kidsTopicMap" : "topicMap"} (path: ${pathname})`
      );
    }
  }

  let href: string;
  if (isKidRoute) {
    href = `/kids/topics/${slug}`;
  } else {
    const rawPath = searchParams?.get("path") ?? null;
    const carryPath = isAdultPathId(rawPath) ? rawPath : null;
    href = carryPath ? `/topics/${slug}?path=${carryPath}` : `/topics/${slug}`;
  }

  return (
    <Link
      href={href}
      className="text-accent-dark dark:text-accent border-b border-dotted border-accent-dark/40 dark:border-accent/40 hover:border-accent-dark dark:hover:border-accent hover:opacity-80 transition-opacity"
    >
      {children}
    </Link>
  );
}
