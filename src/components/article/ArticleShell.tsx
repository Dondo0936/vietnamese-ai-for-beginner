import Link from "next/link";
import type { ReactNode } from "react";
import type { ArticleMeta } from "@/lib/article-types";
import { getArticleBySlug } from "@/articles/registry";
import { DeepDiveFooter } from "./DeepDiveFooter";

/**
 * Article read-view shell. Renders:
 *   - breadcrumb / back link
 *   - header (category pill + title + dek + source/date/read meta)
 *   - optional hero viz (full-width, above content)
 *   - body (children — sections, viz, compare, prose)
 *   - "Học sâu hơn" footer driven by `lessonRefs`
 *   - "Cùng tuần" rail driven by `relatedArticles`
 */
export function ArticleShell({
  meta,
  heroViz,
  children,
}: {
  meta: ArticleMeta;
  heroViz?: ReactNode;
  children: ReactNode;
}) {
  const related = (meta.relatedArticles ?? [])
    .map((s) => getArticleBySlug(s))
    .filter((a): a is ArticleMeta => Boolean(a));

  return (
    <article className="arx">
      <div className="arx-crumb">
        <Link href="/">udemi</Link> / <Link href="/articles">bài viết</Link> /{" "}
        <span>{meta.slug}</span>
      </div>

      <header className="arx-header">
        <div className="arx-category-row">
          <span className="ar-pill" data-cat={meta.category}>
            {labelFor(meta.category)}
          </span>
          {meta.tag && <span className="ar-tag">{meta.tag}</span>}
        </div>
        <h1 className="arx-title">{meta.title}</h1>
        <p className="arx-dek">{meta.dek}</p>
        <div className="arx-meta-row">
          <span className="ar-source">◆ {meta.source.name}</span>
          <span>·</span>
          <span>{formatDate(meta.date)}</span>
          <span>·</span>
          <span>{meta.readingTime}</span>
          {meta.source.url && (
            <>
              <span>·</span>
              <a
                href={meta.source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {meta.source.host} ↗
              </a>
            </>
          )}
        </div>
      </header>

      {heroViz && <div className="arx-hero-viz">{heroViz}</div>}

      {children}

      <DeepDiveFooter slugs={meta.lessonRefs} />

      {related.length > 0 && (
        <aside className="arx-related">
          <h3 className="arx-related__h">Cùng tuần</h3>
          <div className="arx-related__grid">
            {related.map((a) => (
              <Link
                key={a.slug}
                href={`/articles/${a.slug}`}
                className="ar-ed__card"
              >
                <div className="ar-meta">
                  <span className="ar-source">{a.source.name}</span>
                  <span>·</span>
                  <span>{formatDate(a.date)}</span>
                </div>
                <h4>{a.title}</h4>
                <p>{a.dek}</p>
                <div className="ar-ed__cardFoot">
                  {a.tag && <span className="ar-tag">{a.tag}</span>}
                  <span>{a.readingTime} →</span>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      )}
    </article>
  );
}

function formatDate(iso: string): string {
  // "2026-04-18" → "18 · 04 · 2026"
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d} · ${m} · ${y}`;
}

function labelFor(cat: ArticleMeta["category"]): string {
  switch (cat) {
    case "model":
      return "Model";
    case "paper":
      return "Paper";
    case "open":
      return "Open";
    case "agent":
      return "Agent";
    case "infra":
      return "Infra";
    case "report":
      return "Report";
    case "tool":
      return "Tool";
    case "vietnam":
      return "Việt Nam";
  }
}
