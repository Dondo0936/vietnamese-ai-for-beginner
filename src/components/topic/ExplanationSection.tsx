"use client";

import { BookOpen } from "lucide-react";
import { useSectionGuard } from "./SectionDuplicateGuard";

interface ExplanationSectionProps {
  children: React.ReactNode;
  /** Topic slug — used in dev-mode duplicate-section warnings. Optional for backwards compat. */
  topicSlug?: string;
}

export default function ExplanationSection({
  children,
  topicSlug = "unknown",
}: ExplanationSectionProps) {
  useSectionGuard("explanation", topicSlug);
  return (
    <section id="explanation" className="my-8 scroll-mt-20">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
        <BookOpen size={20} className="text-accent" />
        Giải thích
      </h2>
      <div className="space-y-4 text-foreground/90 leading-relaxed">
        {children}
      </div>
    </section>
  );
}
