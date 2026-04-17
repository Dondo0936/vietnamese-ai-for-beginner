"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { KidsTopicMeta } from "@/lib/kids/types";
import { useProgress } from "@/lib/progress-context";
import MascotBubble from "./MascotBubble";

const NHI_TOPIC_SLUGS = [
  "nhi-coral-factory",
  "nhi-creature-garden",
  "nhi-treasure-map",
  "nhi-magic-marble-bag",
  "nhi-shadow-theater",
  "nhi-ocean-race",
];

interface KidsTopicLayoutProps {
  meta: KidsTopicMeta;
  introText: string;
  children: React.ReactNode;
}

export default function KidsTopicLayout({
  meta,
  introText,
  children,
}: KidsTopicLayoutProps) {
  const { readTopics } = useProgress();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-cyan-50 dark:from-sky-950/30 dark:to-cyan-950/30">
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href="/kids/nhi"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại bản đồ
        </Link>
        <div className="flex items-center gap-1.5" aria-label={`Đã tìm được ${NHI_TOPIC_SLUGS.filter((s) => readTopics.includes(s)).length} trên 6 viên ngọc`}>
          {NHI_TOPIC_SLUGS.map((slug) => (
            <span
              key={slug}
              className={`inline-block w-5 h-5 rounded-full border-2 transition-colors ${
                readTopics.includes(slug)
                  ? "bg-amber-400 border-amber-500"
                  : "bg-transparent border-border"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
      <div className="px-4 mb-4">
        <MascotBubble
          text={introText}
          mood={meta.mascotMood ?? "curious"}
        />
      </div>
      <div className="px-2">
        {children}
      </div>
    </div>
  );
}
