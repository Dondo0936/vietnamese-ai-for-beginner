import Link from "next/link";

/**
 * Landing nav — design-matching minimal menu (5 links + 2 buttons).
 *
 * The rest of the app uses `AppShell`'s richer icon navbar; this one is
 * only used at `/`. "Chủ đề" routes to /browse (the new catalog), "Cẩm
 * nang" routes to /claude, everything else is anchor links on the same
 * page.
 */
export function LandingNav() {
  return (
    <header className="ld-nav">
      <div className="ld-nav__brand">
        <span className="ld-star" aria-hidden="true">
          <i />
          <em />
        </span>
        <span>udemi</span>
        <span className="ld-nav__sub">AI cho mọi người</span>
      </div>
      <nav className="ld-nav__links" aria-label="Điều hướng chính">
        <Link href="#paths">Lộ trình</Link>
        <Link href="/browse">Chủ đề</Link>
        <Link href="/claude">Cẩm nang Claude</Link>
        <Link href="#process">Giới thiệu</Link>
        <a
          href="https://github.com/anthropics/ai-edu-v2"
          target="_blank"
          rel="noreferrer noopener"
        >
          GitHub ↗
        </a>
      </nav>
      <div className="ld-nav__actions">
        <Link href="/login" className="ld-btn ld-btn--ghost">
          Đăng nhập
        </Link>
        <Link href="/browse" className="ld-btn ld-btn--primary">
          Mở app →
        </Link>
      </div>
    </header>
  );
}
