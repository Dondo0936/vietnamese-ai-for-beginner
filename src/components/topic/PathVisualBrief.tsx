"use client";

import type { AdultPathId } from "@/lib/paths";
import { getPathVisualBrief } from "./path-visual-briefs";
import type {
  PathVisualTone,
  PathVisualVariant,
} from "./path-visual-briefs/types";

const TONE_CLASS_BY_TONE: Record<PathVisualTone, string> = {
  neutral: "border-border bg-card",
  data: "border-sky-500/45 bg-sky-500/10 dark:border-sky-300/45 dark:bg-sky-300/10",
  compute:
    "border-indigo-500/45 bg-indigo-500/10 dark:border-indigo-300/45 dark:bg-indigo-300/10",
  model:
    "border-fuchsia-500/40 bg-fuchsia-500/10 dark:border-fuchsia-300/45 dark:bg-fuchsia-300/10",
  serve:
    "border-zinc-500/40 bg-zinc-500/10 dark:border-zinc-300/45 dark:bg-zinc-300/10",
  risk: "border-dashed border-foreground/40 bg-card",
};

const VARIANT_LABEL_BY_VARIANT: Record<PathVisualVariant, string> = {
  pipeline: "Pipeline",
  stack: "Stack",
  loop: "Loop",
  matrix: "Matrix",
  tradeoff: "Trade-off",
  gate: "Gate",
};

interface PathVisualBriefProps {
  pathId: AdultPathId;
  slug: string;
  stageTitle?: string;
}

export default function PathVisualBrief({
  pathId,
  slug,
  stageTitle,
}: PathVisualBriefProps) {
  const brief = getPathVisualBrief(pathId, slug);
  if (!brief) return null;

  return (
    <section
      className="my-8"
      aria-label={`Bản đồ trực quan: ${brief.title}`}
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
            Nhìn nhanh{stageTitle ? ` · ${stageTitle}` : ""}
          </p>
          <h2 className="text-lg font-semibold text-foreground">
            {brief.title}
          </h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-foreground">
            {brief.focus}
          </p>
        </div>
        <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground">
          {VARIANT_LABEL_BY_VARIANT[brief.variant]}
        </span>
      </div>

      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {brief.nodes.map((node, index) => (
          <li
            key={`${node.label}-${index}`}
            className={`min-h-24 rounded-lg border p-3 ${TONE_CLASS_BY_TONE[node.tone]}`}
          >
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs font-bold text-foreground">
                {index + 1}
              </span>
              <p className="text-sm font-semibold leading-snug text-foreground">
                {node.label}
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-foreground">
              {node.caption}
            </p>
          </li>
        ))}
      </ol>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="Checklist kiểm nhanh">
        {brief.checks.map((check) => (
          <li
            key={check}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground"
          >
            {check}
          </li>
        ))}
      </ul>
    </section>
  );
}
