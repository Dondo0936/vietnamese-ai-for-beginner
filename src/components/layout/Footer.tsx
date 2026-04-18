import Link from "next/link";
import { Brain } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-dark border-t border-[rgba(255,255,255,0.06)] mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Brain className="h-4 w-4 text-accent" />
            <span className="font-display text-[17px] font-medium tracking-[-0.02em] text-[#F5F5F7]">
              AI Cho Mọi Người
            </span>
          </div>

          <div className="flex items-center gap-6">
            {[
              { href: "/", label: "Trang chủ" },
              { href: "/bookmarks", label: "Đã lưu" },
              { href: "/progress", label: "Tiến độ" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-[13px] text-[#9B9BA3] transition-colors hover:text-[#C4C4CC]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)] text-center">
          <p className="font-serif italic text-[15px] text-[#6C6C74]">
            Hiểu AI qua hình ảnh và ví dụ đơn giản
          </p>
          <p className="mt-2 font-mono text-[11px] tracking-[0.04em] text-[#6C6C74]">
            © 2026 Tien Dat Do
          </p>
        </div>
      </div>
    </footer>
  );
}
