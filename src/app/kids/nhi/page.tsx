"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { KidsModeProvider } from "@/lib/kids/mode-context";
import { useProgress } from "@/lib/progress-context";
import OceanMap from "@/components/kids/nhi/OceanMap";

const NHI_SLUGS = [
  "nhi-coral-factory",
  "nhi-creature-garden",
  "nhi-treasure-map",
  "nhi-magic-marble-bag",
  "nhi-shadow-theater",
  "nhi-ocean-race",
];

function NhiContent() {
  const { readTopics } = useProgress();
  const done = NHI_SLUGS.filter((s) => readTopics.includes(s)).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Trang chủ
        </Link>
      </div>

      <div className="px-4 py-4 text-center">
        <h1 className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2">
          <Sparkles size={24} className="text-amber-500" />
          Cuộc phiêu lưu của Bé Bạch Tuộc
        </h1>
        <p className="mt-2 text-sm text-muted max-w-md mx-auto">
          Bão đã cuốn đi 6 viên ngọc thần kỳ! Giúp Bé Bạch Tuộc tìm lại chúng nhé.
        </p>

        {/* Progress bar — only visible when at least 1 pearl is found */}
        {done > 0 && (
          <div className="mt-3 mx-auto max-w-xs">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
              <span>{done}/6 viên ngọc đã tìm được</span>
            </div>
            <div className="h-2 rounded-full bg-amber-100 dark:bg-amber-900/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                style={{ width: `${(done / 6) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Ocean Map */}
      <div className="px-4 pb-8">
        <OceanMap />
      </div>
    </div>
  );
}

export default function NhiPathPage() {
  return (
    <AppShell>
      <KidsModeProvider initialTier="nhi">
        <NhiContent />
      </KidsModeProvider>
    </AppShell>
  );
}
