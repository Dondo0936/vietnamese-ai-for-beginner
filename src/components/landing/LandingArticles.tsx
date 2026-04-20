import Link from "next/link";
import { getLeadAndCompanions, getAllArticles } from "@/articles/registry";
import { getHeroViz } from "@/articles/hero-viz";
import type { ArticleMeta } from "@/lib/article-types";

/**
 * Landing slot (05) — V1 "Editorial" layout from the Anthropic
 * design bundle (Articles Section.html, variation 1).
 *
 * Lead story on the left, two companion items + newsletter card on
 * the right, four secondary cards below. All content driven by
 * src/articles/registry.ts — no duplicated copy.
 */
export function LandingArticles() {
  const { lead, companions, tail } = getLeadAndCompanions();
  const all = getAllArticles();
  const totalCount = all.length;
  const fourCards = tail.slice(0, 4);

  return (
    <section className="ar ar--ed" aria-labelledby="articles-title">
      <header className="ar-head">
        <div>
          <span className="ar-eyebrow">
            (05) Tin tức AI/ML · tuần {weekOf(lead.date)}
          </span>
          <h2 className="ar-title" id="articles-title">
            Theo dõi AI<br />
            <em>không cần đọc 40 newsletter.</em>
          </h2>
        </div>
        <div className="ar-head__meta">
          <span className="ar-live">
            <i />
            LIVE
          </span>
          <span>cập nhật {formatDate(lead.date)} · 09:12 ICT</span>
          <Link href="/articles" className="ar-head__link">
            Xem tất cả {totalCount} tin →
          </Link>
        </div>
      </header>

      <div className="ar-ed__grid">
        <Link href={`/articles/${lead.slug}`} className="ar-ed__lead">
          <div className="ar-ed__leadViz">
            <LeadViz slug={lead.slug} vizKey={lead.heroViz} />
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
          <div className="ar-ed__sideHead">Cùng tuần này</div>
          {companions.map((c, i) => (
            <Link
              key={c.slug}
              href={`/articles/${c.slug}`}
              className="ar-ed__sideItem"
            >
              <span className="ar-ed__sideN">0{i + 2}</span>
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
          <div className="ar-ed__subscribe">
            <div>
              <b>Nhận bản tin thứ Năm</b>
              <span>5 tin AI/ML đáng đọc mỗi tuần. Viết bằng tiếng Việt.</span>
            </div>
            <button type="button" className="ar-ed__subscribeBtn">
              Đăng ký →
            </button>
          </div>
        </aside>

        <div className="ar-ed__row">
          {fourCards.map((a) => (
            <Card key={a.slug} article={a} />
          ))}
          {fourCards.length < 4 &&
            Array.from({ length: 4 - fourCards.length }).map((_, i) => (
              <EmptyCard key={`empty-${i}`} />
            ))}
        </div>
      </div>
    </section>
  );
}

function LeadViz({
  slug,
  vizKey,
}: {
  slug: string;
  vizKey?: string;
}) {
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
          fontSize: 12,
          color: "var(--turquoise-ink)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
        aria-hidden
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
      aria-label={`Viz xem trước cho bài ${slug}`}
    >
      <Viz />
    </div>
  );
}

function Card({ article }: { article: ArticleMeta }) {
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

function EmptyCard() {
  return (
    <div
      className="ar-ed__card"
      style={{
        opacity: 0.35,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 180,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--text-tertiary)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}
      aria-hidden
    >
      ◦ còn trống
    </div>
  );
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split("-");
  if (!m || !d) return iso;
  return `${d} · ${m}`;
}

function firstSentence(s: string): string {
  const dot = s.indexOf(".");
  return dot > 0 ? s.slice(0, dot + 1) : s;
}

function weekOf(iso: string): number {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 0;
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}
