import Link from "next/link";
import { topicMap } from "@/topics/registry";

/**
 * Full lesson card used in the "Học sâu hơn" deep-dive footer at
 * the bottom of every article. Pulls title + description from the
 * topic registry so articles stay a single source of link truth.
 */
export function LessonLink({ slug }: { slug: string }) {
  const topic = topicMap[slug];
  if (!topic) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[LessonLink] topic slug "${slug}" not in registry`);
    }
    return null;
  }
  return (
    <Link href={`/topics/${slug}`} className="arx-deep__card" prefetch={false}>
      <span className="arx-deep__cardLabel">→ Học bài</span>
      <span className="arx-deep__cardTitle">{topic.titleVi ?? topic.title}</span>
      <span className="arx-deep__cardMeta">
        {topic.category} · {topic.difficulty}
      </span>
    </Link>
  );
}
