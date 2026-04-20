import Link from "next/link";
import type { ReactNode } from "react";
import { topicMap } from "@/topics/registry";

/**
 * Inline keyword → topic link. Wrap any term mentioned in an article
 * that has a matching /topics/<slug> page and readers get a subtle
 * chip they can click to drop into the foundational lesson.
 *
 * Dev-only: logs a warning if the slug doesn't resolve, so typos
 * don't silently ship dead links.
 */
export function Term({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  if (process.env.NODE_ENV !== "production" && !topicMap[slug]) {
    console.warn(`[Term] topic slug "${slug}" not found in registry`);
  }
  return (
    <Link
      href={`/topics/${slug}`}
      className="arx-term"
      prefetch={false}
      aria-label={`Mở bài ${slug}`}
    >
      {children}
    </Link>
  );
}
