"use client";

import type { ReactNode } from "react";
import { useSectionGuard } from "@/components/topic/SectionDuplicateGuard";

interface Props {
  parentTitleVi: string;
  topicSlug?: string;
  children: ReactNode;
}

export default function ApplicationMechanism({
  parentTitleVi,
  topicSlug = "unknown",
  children,
}: Props) {
  useSectionGuard("mechanism", topicSlug);
  return (
    <section className="mb-10" id="mechanism">
      <h2 className="text-xl font-semibold mb-4">
        Cách {parentTitleVi} giải quyết vấn đề
      </h2>
      <ol className="space-y-4 list-none p-0">{children}</ol>
    </section>
  );
}
