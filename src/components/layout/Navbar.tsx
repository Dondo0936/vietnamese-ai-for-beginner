"use client";

import Link from "next/link";
import { Brain, Bookmark, BarChart3, Search, BookOpen } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AuthButton from "@/components/auth/AuthButton";
import FeedbackButton from "@/components/feedback/FeedbackButton";

function triggerCmdK() {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
}

/**
 * Navbar sits sticky on every page. Pre-launch, we've collected a lot of
 * right-side entry points — search, Claude guide, feedback, progress,
 * bookmarks, auth, theme. To keep it from reading like a toolbar, every
 * action except Auth is icon-only with a native `title` tooltip; Auth keeps
 * the text label per product decision ("Đăng nhập" must remain a word).
 */
export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-[color-mix(in_srgb,var(--bg-primary)_92%,transparent)] backdrop-blur-[16px] backdrop-saturate-[140%]">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-8 h-14">
        <Link href="/" className="flex items-center gap-2.5 text-foreground">
          <Brain className="h-5 w-5 text-accent" />
          <span className="hidden sm:inline font-display text-[17px] font-medium tracking-[-0.02em]">
            AI Cho Mọi Người
          </span>
          <span className="sm:hidden font-display text-[17px] font-medium tracking-[-0.02em]">
            ACMN
          </span>
        </Link>

        <div className="flex items-center gap-0.5">
          {/* Search — icon + ⌘K badge. One click opens the command palette. */}
          <button
            type="button"
            onClick={triggerCmdK}
            title="Tìm kiếm (⌘K)"
            aria-label="Tìm kiếm chủ đề"
            className="inline-flex items-center gap-1.5 rounded-[var(--r-md)] p-2 text-tertiary transition-colors hover:bg-surface hover:text-foreground"
          >
            <Search size={18} />
            <kbd className="hidden md:inline rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-tertiary leading-none">
              ⌘K
            </kbd>
          </button>

          <Link
            href="/claude"
            title="Cẩm nang Claude"
            aria-label="Cẩm nang Claude"
            className="rounded-[var(--r-md)] p-2 text-tertiary transition-colors hover:text-foreground hover:bg-surface"
          >
            <BookOpen size={18} />
          </Link>

          <FeedbackButton />

          <Link
            href="/progress"
            title="Tiến độ học"
            aria-label="Tiến độ học"
            className="rounded-[var(--r-md)] p-2 text-tertiary transition-colors hover:text-foreground hover:bg-surface"
          >
            <BarChart3 size={18} />
          </Link>

          <Link
            href="/bookmarks"
            title="Đã lưu"
            aria-label="Đã lưu"
            className="rounded-[var(--r-md)] p-2 text-tertiary transition-colors hover:text-foreground hover:bg-surface"
          >
            <Bookmark size={18} />
          </Link>

          {/* Vertical divider keeps primary nav (icons) visually distinct
              from account controls (Đăng nhập + theme). */}
          <span
            aria-hidden="true"
            className="mx-1.5 hidden sm:inline-block h-5 w-px bg-border"
          />

          <AuthButton />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
