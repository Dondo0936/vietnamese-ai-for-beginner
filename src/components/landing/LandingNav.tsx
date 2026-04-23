"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthProvider } from "@/lib/auth-context";
import AuthModal from "@/components/auth/AuthModal";

/**
 * Landing nav — sticky, scroll-aware liquid-glass header.
 *
 * Desktop (≥ 769px): brand + full link list + auth button + primary CTA.
 * Mobile (≤ 768px): brand + primary CTA + hamburger button that toggles
 *   a drawer with the full link list + auth buttons (restores nav items
 *   otherwise hidden on mobile).
 *
 * Opts into a scroll listener via `data-scroll-aware="true"`. Once the
 * user scrolls past ~12px the `data-scrolled` flag flips and the CSS
 * pumps the blur + opacity so content underneath visibly defocuses
 * instead of bleeding through.
 */
export function LandingNav() {
  return (
    <AuthProvider>
      <LandingNavInner />
    </AuthProvider>
  );
}

function LandingNavInner() {
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // Close drawer on escape or route change (hash change)
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    const onHash = () => setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("hashchange", onHash);
    };
  }, [drawerOpen]);

  return (
    <>
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
            href="https://github.com/Dondo0936/vietnamese-ai-for-beginner"
            target="_blank"
            rel="noreferrer noopener"
          >
            GitHub ↗
          </a>
        </nav>
        <div className="ld-nav__actions">
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="ld-btn ld-btn--ghost"
          >
            Đăng nhập
          </button>
          <Link href="/browse" className="ld-btn ld-btn--primary">
            Mở app →
          </Link>
          <button
            type="button"
            className="mn-menu-btn"
            aria-label={drawerOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={drawerOpen}
            aria-controls="ld-mobile-drawer"
            onClick={() => setDrawerOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {drawerOpen && (
        <div className="mn-drawer" id="ld-mobile-drawer" role="dialog" aria-modal="false">
          <Link href="#paths" onClick={() => setDrawerOpen(false)}>
            Lộ trình
          </Link>
          <Link href="/browse" onClick={() => setDrawerOpen(false)}>
            Chủ đề
          </Link>
          <Link href="/claude" onClick={() => setDrawerOpen(false)}>
            Cẩm nang Claude
          </Link>
          <Link href="#process" onClick={() => setDrawerOpen(false)}>
            Giới thiệu
          </Link>
          <a
            href="https://github.com/Dondo0936/vietnamese-ai-for-beginner"
            target="_blank"
            rel="noreferrer noopener"
            onClick={() => setDrawerOpen(false)}
          >
            GitHub ↗
          </a>
          <div className="mn-drawer__cta">
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                setAuthOpen(true);
              }}
              className="ld-btn"
            >
              Đăng nhập
            </button>
            <Link
              href="/browse"
              className="ld-btn ld-btn--primary"
              onClick={() => setDrawerOpen(false)}
            >
              Mở app →
            </Link>
          </div>
        </div>
      )}

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab="signin"
      />
    </>
  );
}
