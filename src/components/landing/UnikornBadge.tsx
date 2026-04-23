import { UNIKORN_BADGE_SVG } from "./unikorn-badge-svg";

/**
 * Unikorn "Product of the Day" badge. Inlined from a pre-processed SVG
 * (see `unikorn-badge-svg.ts`) so we can repaint it in the udemi palette
 * via CSS variables.
 *
 * The badge is inlined rather than fetched because unikorn.vn sits behind
 * Cloudflare, which 403s Vercel build IPs even with a browser User-Agent.
 * If the badge design or rank needs to refresh, re-run the transform
 * pipeline documented at the top of `unikorn-badge-svg.ts` and commit
 * the new string.
 */

const BADGE_LINK_URL =
  "https://unikorn.vn/p/ai-cho-moi-nguoi?ref=embed-ai-cho-moi-nguoi";

export function UnikornBadge() {
  return (
    <a
      href={BADGE_LINK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="ld-unikorn"
      aria-label="Xem trang Unikorn của udemi"
    >
      <span
        className="ld-unikorn__svg"
        dangerouslySetInnerHTML={{ __html: UNIKORN_BADGE_SVG }}
      />
    </a>
  );
}
