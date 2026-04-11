import Link from "next/link";
import { Brain, Bookmark } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-dark border-b border-white/10">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 h-14">
        <Link
          href="/"
          className="flex items-center gap-2 text-white font-semibold text-lg tracking-tight"
        >
          <Brain className="h-5 w-5 text-accent" />
          <span>AI Cho Mọi Người</span>
        </Link>

        <Link
          href="/bookmarks"
          className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors"
        >
          <Bookmark className="h-4 w-4" />
          <span className="hidden sm:inline">Đã lưu</span>
        </Link>
      </div>
    </nav>
  );
}
