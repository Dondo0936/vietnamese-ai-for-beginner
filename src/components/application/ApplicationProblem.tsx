"use client";

import type { ReactNode } from "react";
import { useSectionGuard } from "@/components/topic/SectionDuplicateGuard";

interface Props {
  topicSlug?: string;
  children: ReactNode;
}

export default function ApplicationProblem({
  topicSlug = "unknown",
  children,
}: Props) {
  useSectionGuard("problem", topicSlug);
  return (
    <section className="mb-10" id="problem">
      <h2 className="text-xl font-semibold mb-4">
        Vấn đề công ty cần giải quyết
      </h2>
      <div className="prose prose-sm max-w-none">{children}</div>
    </section>
  );
}
