"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Landing nav — sticky, scroll-aware liquid-glass header.
 *
 * Opts into a scroll listener via `data-scroll-aware="true"`. Once the
 * user scrolls past ~12px the `data-scrolled` flag flips and the CSS
 * pumps the blur + opacity so content underneath visibly defocuses
 * instead of bleeding through.
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      className="ld-nav"
      data-scroll-aware="true"
      data-scrolled={scrolled ? "true" : "false"}
    >
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
