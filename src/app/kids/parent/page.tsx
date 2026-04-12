import AppShell from "@/components/layout/AppShell";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Parent dashboard stub — Phase 2 will:
 *   - move to a server component behind a proxy.ts cookie check +
 *     Supabase session verification in the layout.tsx
 *   - render ParentDashboard (artifacts gallery, retention score, etc.)
 * Spec §7, §9, §10.3.
 */
export default function ParentDashboardStubPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Link
          href="/kids"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Quay lại
        </Link>
        <div className="text-6xl mb-4" aria-hidden="true">📊</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Bảng theo dõi của ba mẹ
        </h1>
        <p className="text-sm text-muted">
          Phần này đang được chuẩn bị. Phiên bản chính thức sẽ có: đăng nhập bằng email,
          theo dõi tiến độ con, xem tác phẩm con làm, và kiểm tra khả năng nhớ sau 3 ngày.
        </p>
      </div>
    </AppShell>
  );
}
