import type { ReactNode } from "react";

/** Generic viz block wrapper. Caption is optional mono legend text. */
export function ArticleViz({
  children,
  caption,
}: {
  children: ReactNode;
  caption?: string;
}) {
  return (
    <figure className="arx-viz">
      <div className="arx-viz__body">{children}</div>
      {caption && (
        <figcaption className="arx-viz__caption">{caption}</figcaption>
      )}
    </figure>
  );
}

/** Big number callout — use for "37B active · 236B total" type stats. */
export function ArticleStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="arx-stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

/** Two-column before/after. Either side can take prose or numbers. */
export function ArticleCompare({
  before,
  after,
}: {
  before: { label: string; value: string; note?: string };
  after: { label: string; value: string; note?: string };
}) {
  return (
    <div className="arx-compare">
      <div className="arx-compare__col" data-kind="before">
        <span className="arx-compare__label">{before.label}</span>
        <div className="arx-compare__v">{before.value}</div>
        {before.note && <p className="arx-compare__note">{before.note}</p>}
      </div>
      <div className="arx-compare__col" data-kind="after">
        <span className="arx-compare__label">{after.label}</span>
        <div className="arx-compare__v">{after.value}</div>
        {after.note && <p className="arx-compare__note">{after.note}</p>}
      </div>
    </div>
  );
}
