"use client";

import Link from "next/link";
import { Brain, Bookmark, BarChart3, Search } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import AuthButton from "@/components/auth/AuthButton";
import FeedbackButton from "@/components/feedback/FeedbackButton";

function triggerCmdK() {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
}

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-[rgba(251,247,242,0.7)] backdrop-blur-[16px] backdrop-saturate-[140%] dark:bg-[rgba(10,10,11,0.7)]">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-8 h-14">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-foreground"
        >
          <Brain className="h-5 w-5 text-accent" />
          <span className="hidden sm:inline font-display text-[17px] font-medium tracking-[-0.02em]">
            AI Cho Mọi Người
          </span>
          <span className="sm:hidden font-display text-[17px] font-medium tracking-[-0.02em]">
            ACMN
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Desktop: full ⌘K trigger */}
          <button
            type="button"
            onClick={triggerCmdK}
            aria-label="Tìm kiếm chủ đề"
            className="hidden sm:flex items-center gap-2 rounded-[var(--r-md)] border border-border bg-surface px-3 py-1.5 text-xs text-tertiary transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <Search size={14} />
            <span>Tìm kiếm...</span>
            <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-tertiary">
              ⌘K
            </kbd>
          </button>

          {/* Mobile: 44×44 icon button — dispatches same ⌘K event so the
              command palette is still reachable after scrolling past the hero */}
          <button
            type="button"
            onClick={triggerCmdK}
            aria-label="Tìm kiếm chủ đề"
            className="sm:hidden flex h-11 w-11 items-center justify-center rounded-[var(--r-md)] text-tertiary transition-colors hover:text-foreground hover:bg-surface"
          >
            <Search size={18} />
          </button>

          <Link
            href="/claude"
            className="hidden md:inline-flex items-center rounded-[var(--r-md)] mx-1 px-3 py-1.5 text-[13px] font-medium text-tertiary transition-colors hover:text-foreground hover:bg-surface"
          >
            Cẩm nang Claude
          </Link>

          {/* Feedback entry point — visible on every page. Pre-launch priority. */}
          <div className="mx-1">
            <FeedbackButton />
          </div>

          <Link
            href="/progress"
            className="rounded-[var(--r-md)] p-2 text-tertiary transition-colors hover:text-foreground hover:bg-surface"
            aria-label="Tiến độ"
          >
            <BarChart3 size={18} />
          </Link>

          <Link
            href="/bookmarks"
            className="rounded-[var(--r-md)] p-2 text-tertiary transition-colors hover:text-foreground hover:bg-surface"
            aria-label="Đã lưu"
          >
            <Bookmark size={18} />
          </Link>

          <AuthButton />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
