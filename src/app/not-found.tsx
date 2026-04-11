import Link from "next/link";
import { SearchX } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md py-16">
          <SearchX className="mx-auto h-14 w-14 text-slate-400 mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Không tìm thấy trang
          </h2>
          <p className="text-muted mb-8">
            Trang bạn đang tìm không tồn tại hoặc đã được di chuyển. Hãy thử
            tìm kiếm chủ đề trên trang chủ.
          </p>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
          >
            Về trang chủ
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
