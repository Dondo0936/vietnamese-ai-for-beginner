"use client";

import Link from "next/link";
import { Brain, Bookmark, BarChart3, Search } from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";

function triggerCmdK() {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
}

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-dark border-b border-white/10">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
        <Link
          href="/"
          className="flex items-center gap-2 text-white font-semibold text-lg tracking-tight"
        >
          <Brain className="h-5 w-5 text-accent" />
          <span className="hidden sm:inline">AI Cho Mọi Người</span>
          <span className="sm:hidden">ACMN</span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Cmd+K search trigger */}
          <button
            type="button"
            onClick={triggerCmdK}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-300"
          >
            <Search size={14} />
            <span>Tìm kiếm...</span>
            <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
          </button>

          <Link
            href="/progress"
            className="rounded-lg p-2 text-slate-300 transition-colors hover:text-white hover:bg-white/10"
            aria-label="Tiến độ"
          >
            <BarChart3 size={18} />
          </Link>

          <Link
            href="/bookmarks"
            className="rounded-lg p-2 text-slate-300 transition-colors hover:text-white hover:bg-white/10"
            aria-label="Đã lưu"
          >
            <Bookmark size={18} />
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
