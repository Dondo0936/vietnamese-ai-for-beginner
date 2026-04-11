"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bookmark, BarChart3 } from "lucide-react";

function triggerCmdK() {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
}

const navItems = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/search", label: "Tìm kiếm", icon: Search, action: "search" as const },
  { href: "/bookmarks", label: "Đã lưu", icon: Bookmark },
  { href: "/progress", label: "Tiến độ", icon: BarChart3 },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          if (item.action === "search") {
            return (
              <button
                key={item.href}
                type="button"
                onClick={triggerCmdK}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted transition-colors active:scale-95"
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors active:scale-95 ${
                isActive ? "text-accent" : "text-muted"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
