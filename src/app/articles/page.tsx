import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { getAllArticles, getLeadAndCompanions } from "@/articles/registry";
import { getHeroViz } from "@/articles/hero-viz";
import type { ArticleMeta } from "@/lib/article-types";
import "@/components/landing/articles.css";

export const metadata: Metadata = {
  title: "Bài viết · Tin AI/ML tuần này | udemi",
  description:
    "Theo dõi AI không cần đọc 40 newsletter. Tin được chọn và giải thích bằng tiếng Việt — mỗi bài link về bài học nền tảng của udemi.",
};

export default function ArticlesIndex() {
  const { lead, companions, tail } = getLeadAndCompanions();
  const all = getAllArticles();
  const issueDate = formatDate(all[0]?.date ?? lead.date);

  return (
    <AppShell>
      <div className="ar-index">
        <header className="ar-index__hero">
          <div>
            <span className="ar-eyebrow">
              bài viết · tuần {weekNumber(all[0]?.date ?? lead.date)}
            </span>
            <h1>
              Theo dõi AI<br />
              <em>không cần đọc 40 newsletter.</em>
            </h1>
            <p>
              Mỗi bài một tin AI/ML đáng đọc của tuần — giải thích bằng
              tiếng Việt, liên kết về bài học nền tảng. Không spam, không
              quảng cáo.
            </p>
          </div>
          <div className="ar-head__meta">
            <span className="ar-live">
              <i />
              LIVE
            </span>
            <span>cập nhật {issueDate}</span>
            <span>{all.length} bài đang mở</span>
          </div>
        </header>

        <section className="ar ar--ed" style={{ padding: 0, border: 0 }}>
          <div className="ar-ed__grid">
            <Link href={`/articles/${lead.slug}`} className="ar-ed__lead">
              <div className="ar-ed__leadViz">
                <LeadViz vizKey={lead.heroViz} />
                <span className="ar-ed__leadBadge">
                  {lead.category.toUpperCase()}
                </span>
              </div>
              <div className="ar-ed__leadBody">
                <div className="ar-meta">
                  <span className="ar-source">◆ {lead.source.name}</span>
                  <span className="ar-dot">·</span>
                  <span>{formatDate(lead.date)}</span>
                  <span className="ar-dot">·</span>
                  <span>{lead.readingTime}</span>
                  {lead.tag && <span className="ar-tag">{lead.tag}</span>}
                </div>
                <h3 className="ar-ed__leadTitle">{lead.title}</h3>
                <p className="ar-ed__leadDek">{lead.dek}</p>
                <div className="ar-ed__leadCta">
                  <span className="ar-readmore">Đọc phân tích →</span>
                </div>
              </div>
            </Link>

            <aside className="ar-ed__side">
              <div className="ar-ed__sideHead">Gần đây nhất</div>
              {companions.map((c, i) => (
                <Link
                  key={c.slug}
                  href={`/articles/${c.slug}`}
                  className="ar-ed__sideItem"
                >
                  <span className="ar-ed__sideN">
                    0{i + 2}
                  </span>
                  <div>
                    <div className="ar-meta ar-meta--sm">
                      <span className="ar-source">{c.source.name}</span>
                      <span>·</span>
                      <span>{formatDate(c.date)}</span>
                    </div>
                    <h4>{c.title}</h4>
                    <p>{firstSentence(c.dek)}</p>
                  </div>
                </Link>
              ))}
            </aside>

            <div className="ar-ed__row">
              {tail.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
              {tail.length === 0 && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: 32,
                    textAlign: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    border: "1px dashed var(--border)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  chưa có bài cũ tuần này · xem tuần trước →
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function LeadViz({ vizKey }: { vizKey?: string }) {
  const Viz = getHeroViz(vizKey);
  if (!Viz) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, var(--turquoise-50), var(--turquoise-100))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          color: "var(--turquoise-ink)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        ◆ lead story
      </div>
    );
  }
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-surface)",
      }}
    >
      <Viz />
    </div>
  );
}

function ArticleCard({ article }: { article: ArticleMeta }) {
  return (
    <Link href={`/articles/${article.slug}`} className="ar-ed__card">
      <div className="ar-meta">
        <span className="ar-source">{article.source.name}</span>
        <span>·</span>
        <span>{formatDate(article.date)}</span>
      </div>
      <h4>{article.title}</h4>
      <p>{article.dek}</p>
      <div className="ar-ed__cardFoot">
        {article.tag && <span className="ar-tag">{article.tag}</span>}
        <span>{article.readingTime} →</span>
      </div>
    </Link>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d} · ${m}`;
}

function firstSentence(s: string): string {
  const dot = s.indexOf(".");
  return dot > 0 ? s.slice(0, dot + 1) : s;
}

function weekNumber(iso: string): number {
  // Simple approximation — good enough for display ("tuần 16")
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}
