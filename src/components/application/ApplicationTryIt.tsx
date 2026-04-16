"use client";

import type { ReactNode } from "react";
import { useSectionGuard } from "@/components/topic/SectionDuplicateGuard";

interface Props {
  topicSlug?: string;
  children: ReactNode;
}

export default function ApplicationTryIt({
  topicSlug = "unknown",
  children,
}: Props) {
  useSectionGuard("tryIt", topicSlug);
  return (
    <section className="mb-10" id="tryIt">
      <h2 className="text-xl font-semibold mb-4">Thử tự tay</h2>
      <div>{children}</div>
    </section>
  );
}
