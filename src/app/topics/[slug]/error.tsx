"use client";

import { AlertTriangle } from "lucide-react";

export default function TopicError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">
          Không thể tải chủ đề này
        </h2>
        <p className="text-muted mb-6">
          Nội dung chủ đề gặp lỗi khi hiển thị. Vui lòng thử lại.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
          >
            Thử lại
          </button>
          <a
            href="/"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            Quay lại trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}
