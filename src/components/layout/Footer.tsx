import Link from "next/link";
import { Brain } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-dark border-t border-white/10 mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white">
            <Brain className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">AI Cho Mọi Người</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/" className="hover:text-slate-300 transition-colors">Trang chủ</Link>
            <Link href="/bookmarks" className="hover:text-slate-300 transition-colors">Đã lưu</Link>
            <Link href="/progress" className="hover:text-slate-300 transition-colors">Tiến độ</Link>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-slate-500">
            Hiểu AI qua hình ảnh và ví dụ đơn giản &mdash; Mã nguồn mở
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Created by Tien Dat Do
          </p>
        </div>
      </div>
    </footer>
  );
}
