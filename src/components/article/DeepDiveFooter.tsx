import { LessonLink } from "./LessonLink";

/**
 * "Học sâu hơn" strip at the bottom of every article. Pulls one card
 * per topic slug declared in the article's `lessonRefs` frontmatter.
 * Stays a foundation-first pattern: articles are time-bound, the
 * topics are canon.
 */
export function DeepDiveFooter({ slugs }: { slugs: string[] }) {
  if (slugs.length === 0) return null;
  return (
    <section className="arx-deep">
      <div className="arx-deep__eyebrow">◆ Học sâu hơn</div>
      <h3 className="arx-deep__h">Nền tảng mà bài viết này dựa trên</h3>
      <div className="arx-deep__grid">
        {slugs.map((slug) => (
          <LessonLink key={slug} slug={slug} />
        ))}
      </div>
    </section>
  );
}
