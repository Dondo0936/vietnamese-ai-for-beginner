"use client";

import { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { useProgress } from "@/lib/progress-context";
import { useAuth } from "@/lib/auth-context";

const DISMISSED_KEY = "auth-warning-dismissed";

export default function AuthWarningBanner() {
  const { readTopics, loading } = useProgress();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
  }, []);

  // Hide for authenticated users — their progress is already backed up
  if (authLoading || isAuthenticated) return null;
  if (loading || dismissed || readTopics.length === 0) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-4">
      <div className="flex items-center gap-3 rounded-[12px] border border-amber-300/30 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-600/20 px-4 py-3">
        <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="flex-1 text-[12px] text-amber-800 dark:text-amber-300">
          Tiến độ chưa được sao lưu. Xóa dữ liệu trình duyệt sẽ mất tiến độ học tập.
        </p>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            localStorage.setItem(DISMISSED_KEY, "true");
          }}
          className="text-[11px] font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors whitespace-nowrap"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
}
