import Link from "next/link";
import AppShell from "@/components/layout/AppShell";

export default function KidsLandingPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="text-7xl mb-4" aria-hidden="true">🐙</div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Xin chào! Mình là Mực.
        </h1>
        <p className="text-muted mb-10">Ba mẹ hay bé đang dùng đây nhỉ?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/kids/nhi"
            className="group rounded-[20px] border-2 border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-500/5 p-6 text-center hover:border-amber-400 transition-colors"
          >
            <div className="text-4xl mb-2" aria-hidden="true">🧒</div>
            <div className="text-lg font-semibold text-foreground">Bé đang dùng</div>
            <div className="text-xs text-muted mt-1">6–15 tuổi</div>
          </Link>

          <Link
            href="/kids/parent"
            className="group rounded-[20px] border-2 border-violet-300 dark:border-violet-500/40 bg-violet-50/70 dark:bg-violet-500/5 p-6 text-center hover:border-violet-400 transition-colors"
          >
            <div className="text-4xl mb-2" aria-hidden="true">👨‍👩‍👧</div>
            <div className="text-lg font-semibold text-foreground">Ba mẹ đang dùng</div>
            <div className="text-xs text-muted mt-1">Bảng theo dõi của con</div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
