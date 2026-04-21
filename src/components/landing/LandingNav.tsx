"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { AuthProvider } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import AuthModal from "@/components/auth/AuthModal";

/**
 * Landing nav — sticky, scroll-aware liquid-glass header.
 *
 * Opts into a scroll listener via `data-scroll-aware="true"`. Once the
 * user scrolls past ~12px the `data-scrolled` flag flips and the CSS
 * pumps the blur + opacity so content underneath visibly defocuses
 * instead of bleeding through.
 *
 * "Đăng nhập" opens the shared AuthModal (Supabase e-mail + Google) —
 * the old Link pointed at /login which doesn't exist. The modal needs
 * the AuthContext, so we wrap the nav in a local AuthProvider (the
 * landing page intentionally doesn't use AppShell).
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
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const nextThemeLabel = theme === "dark" ? "chế độ sáng" : "chế độ tối";

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
            onClick={toggle}
            className="ld-theme-toggle"
            aria-label={`Chuyển sang ${nextThemeLabel}`}
            title={`Chuyển sang ${nextThemeLabel}`}
          >
            {theme === "dark" ? (
              <Sun size={15} strokeWidth={2} />
            ) : (
              <Moon size={15} strokeWidth={2} />
            )}
          </button>
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
        </div>
      </header>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab="signin"
      />
    </>
  );
}
