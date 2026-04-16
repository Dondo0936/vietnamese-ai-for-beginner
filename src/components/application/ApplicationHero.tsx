"use client";

import type { ReactNode } from "react";
import { useSectionGuard } from "@/components/topic/SectionDuplicateGuard";

interface ApplicationHeroProps {
  parentTitleVi: string;
  topicSlug?: string;
  children: ReactNode;
}

export default function ApplicationHero({
  parentTitleVi,
  topicSlug = "unknown",
  children,
}: ApplicationHeroProps) {
  useSectionGuard("hero", topicSlug);

  return (
    <section className="mb-10" id="hero">
      <h1 className="text-2xl font-bold mb-4">
        Công ty nào đang ứng dụng {parentTitleVi}?
      </h1>
      <div className="prose prose-sm max-w-none">{children}</div>
    </section>
  );
}
