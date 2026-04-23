/**
 * Unikorn "Product of the Day" badge. Fetched as SVG server-side and
 * inlined so we can repaint it in the udemi palette via CSS variables.
 *
 * The badge's own <style> block is stripped so its `:root` variable
 * declarations do not leak to the HTML root, and so `.ld-unikorn svg`
 * rules in landing.css drive the final colors unambiguously. The hard
 * black drop-shadow on the star filter is rewritten to use the udemi
 * `--border-strong` token so it stops reading as a foreign sticker.
 *
 * Revalidates hourly so the rank stays fresh without hitting unikorn.vn
 * on every landing render.
 */

const BADGE_SVG_URL =
  "https://unikorn.vn/api/widgets/badge/ai-cho-moi-nguoi/rank?theme=light&type=daily";
const BADGE_LINK_URL =
  "https://unikorn.vn/p/ai-cho-moi-nguoi?ref=embed-ai-cho-moi-nguoi";

export async function UnikornBadge() {
  let raw: string;
  try {
    const res = await fetch(BADGE_SVG_URL, {
      next: { revalidate: 3600 },
      headers: {
        Accept: "image/svg+xml",
        "User-Agent": "udemi.tech/1.0 (+https://udemi.tech)",
      },
    });
    if (!res.ok) {
      console.error(
        `[UnikornBadge] fetch returned ${res.status} ${res.statusText}`,
      );
      return null;
    }
    raw = await res.text();
    if (!raw.trim().startsWith("<svg")) {
      console.error(
        `[UnikornBadge] unexpected body (len=${raw.length}): ${raw.slice(0, 120)}`,
      );
      return null;
    }
  } catch (err) {
    console.error("[UnikornBadge] fetch threw:", err);
    return null;
  }

  const svg = raw
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/flood-color="#000000"/g, 'flood-color="var(--border-strong)"');

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
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </a>
  );
}
