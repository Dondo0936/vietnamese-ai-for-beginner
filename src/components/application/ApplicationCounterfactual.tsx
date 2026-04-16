"use client";

import type { ReactNode } from "react";
import { useSectionGuard } from "@/components/topic/SectionDuplicateGuard";

interface Props {
  parentTitleVi: string;
  topicSlug?: string;
  children: ReactNode;
}

export default function ApplicationCounterfactual({
  parentTitleVi,
  topicSlug = "unknown",
  children,
}: Props) {
  useSectionGuard("counterfactual", topicSlug);
  return (
    <section className="mb-10" id="counterfactual">
      <h2 className="text-xl font-semibold mb-4">
        Nếu không có {parentTitleVi}, app sẽ ra sao?
      </h2>
      <div className="prose prose-sm max-w-none">{children}</div>
    </section>
  );
}
