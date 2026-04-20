export type ArticleCategory =
  | "model"
  | "paper"
  | "open"
  | "agent"
  | "infra"
  | "report"
  | "tool"
  | "vietnam";

export interface ArticleSource {
  name: string;
  host: string;
  url?: string;
}

export interface ArticleMeta {
  slug: string;
  title: string;
  /** One-sentence hook shown in cards and at the top of the read view. */
  dek: string;
  source: ArticleSource;
  /** ISO date YYYY-MM-DD. Used for sorting and display. */
  date: string;
  /** "N phút" — shown next to meta. */
  readingTime: string;
  category: ArticleCategory;
  /** Short colored tag chip, e.g. "flagship" / "hot" / "mã mở". */
  tag?: string;
  /** Topic slugs surfaced in the "Học sâu hơn" footer. */
  lessonRefs: string[];
  /** Other article slugs for the side rail. */
  relatedArticles?: string[];
  /** Key into the hero viz registry — only used when the article is a lead. */
  heroViz?: string;
  /** Eligible to appear as the lead of the landing/articles index. */
  isLead?: boolean;
}
