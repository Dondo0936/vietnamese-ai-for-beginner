// Server Component — mirrors src/topics/topic-loader.tsx pattern.
// Literal import paths so Turbopack/webpack can statically split each
// article chunk and SSR the right module.
//
// When adding a new article:
//   1. Create src/articles/<slug>.tsx (default export the article body)
//   2. Add a matching ArticleMeta entry to src/articles/registry.ts
//   3. Add a line to `articleComponents` below

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const articleComponents: Record<string, ComponentType> = {
  "claude-design-launch": dynamic(
    () => import("@/articles/claude-design-launch"),
  ),
  "claude-opus-4-7-launch": dynamic(
    () => import("@/articles/claude-opus-4-7-launch"),
  ),
  "mixture-of-depths": dynamic(() => import("@/articles/mixture-of-depths")),
  "deepseek-v4-open-weights": dynamic(
    () => import("@/articles/deepseek-v4-open-weights"),
  ),
  "operator-2-browser-agent": dynamic(
    () => import("@/articles/operator-2-browser-agent"),
  ),
  "phogpt-7b-reasoning": dynamic(
    () => import("@/articles/phogpt-7b-reasoning"),
  ),
  "ai-index-report-2026": dynamic(
    () => import("@/articles/ai-index-report-2026"),
  ),
  "response-streaming": dynamic(
    () => import("@/articles/response-streaming"),
  ),
  "large-tabular-models": dynamic(
    () => import("@/articles/large-tabular-models"),
  ),
  "llm-math-weakness": dynamic(
    () => import("@/articles/llm-math-weakness"),
  ),
};

export function getArticleComponent(slug: string): ComponentType | undefined {
  return articleComponents[slug];
}
