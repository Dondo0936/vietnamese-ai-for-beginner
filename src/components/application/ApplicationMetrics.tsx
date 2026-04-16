"use client";

import { Children, isValidElement, type ReactNode } from "react";
import { useSectionGuard } from "@/components/topic/SectionDuplicateGuard";
import type { MetricData } from "./Metric";
import type { SourceLink } from "@/lib/types";

interface Props {
  sources: SourceLink[];
  topicSlug?: string;
  children: ReactNode;
}

export default function ApplicationMetrics({
  sources,
  topicSlug = "unknown",
  children,
}: Props) {
  useSectionGuard("metrics", topicSlug);

  const metrics: MetricData[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as Partial<MetricData>;
    if (typeof props.value === "string" && typeof props.sourceRef === "number") {
      metrics.push({ value: props.value, sourceRef: props.sourceRef });
    }
  });

  return (
    <section className="mb-10" id="metrics">
      <h2 className="text-xl font-semibold mb-4">Con số thật</h2>
      <ul className="space-y-2">
        {metrics.map((m, i) => {
          const source = sources[m.sourceRef - 1];
          if (!source) return null;
          return (
            <li key={i}>
              {m.value}{" "}
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-link hover:underline"
              >
                [{m.sourceRef}]
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
