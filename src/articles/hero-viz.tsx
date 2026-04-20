import type { ComponentType } from "react";
import { HandoffFlow } from "./claude-design-launch";
import { ReasoningChainViz } from "./claude-opus-4-7-launch";
import { DepthRouterViz } from "./mixture-of-depths";
import { MoERoutingViz } from "./deepseek-v4-open-weights";
import { CoBrowserViz } from "./operator-2-browser-agent";
import { VMLUBarsViz } from "./phogpt-7b-reasoning";
import { CostCurveViz } from "./ai-index-report-2026";

/**
 * Map an article's `heroViz` frontmatter key to the same SVG the
 * article itself renders in its read-view hero. This lets the
 * landing lead card + /articles index lead card show the real
 * viz instead of a gradient placeholder — the visual hook the
 * user signed off on in V1.
 */
const map: Record<string, ComponentType> = {
  "design-handoff-flow": HandoffFlow,
  "reasoning-chain": ReasoningChainViz,
  "depth-router": DepthRouterViz,
  "moe-routing": MoERoutingViz,
  "co-browser": CoBrowserViz,
  "vmlu-bars": VMLUBarsViz,
  "cost-curve": CostCurveViz,
};

export function getHeroViz(key: string | undefined): ComponentType | null {
  if (!key) return null;
  return map[key] ?? null;
}
