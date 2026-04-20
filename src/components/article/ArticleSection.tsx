import type { ReactNode } from "react";

/**
 * One narrative beat inside an article.
 *   - eyebrow: small mono label ("01 · Bối cảnh")
 *   - heading: the h2 for this beat
 *   - prose:   short paragraphs (this is the 35% text budget)
 *   - viz:     the 65% — an <ArticleViz> block, a chart, a compare card.
 *
 * Order of children is author-controlled. By convention: prose first,
 * then viz; or viz first with the prose as caption, depending on beat.
 */
export function ArticleSection({
  eyebrow,
  heading,
  children,
}: {
  eyebrow?: string;
  heading?: string;
  children: ReactNode;
}) {
  return (
    <section className="arx-section">
      {eyebrow && <div className="arx-section__eyebrow">{eyebrow}</div>}
      {heading && <h2 className="arx-section__h">{heading}</h2>}
      {children}
    </section>
  );
}

export function ArticleProse({ children }: { children: ReactNode }) {
  return <div className="arx-section__prose">{children}</div>;
}
