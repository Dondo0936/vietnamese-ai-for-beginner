"use client";

import { Eye } from "lucide-react";
import { useSectionGuard } from "./SectionDuplicateGuard";

interface VisualizationSectionProps {
  children: React.ReactNode;
  /** Topic slug — used in dev-mode duplicate-section warnings. Optional for backwards compat. */
  topicSlug?: string;
}

export default function VisualizationSection({
  children,
  topicSlug = "unknown",
}: VisualizationSectionProps) {
  useSectionGuard("visualization", topicSlug);
  return (
    <section id="visualization" className="my-8 scroll-mt-20">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Eye size={20} className="text-accent" />
        Hình minh họa
      </h2>
      <div className="rounded-xl border border-border bg-card p-6">
        {children}
      </div>
    </section>
  );
}
