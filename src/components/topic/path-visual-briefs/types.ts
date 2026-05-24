import type { AdultPathId } from "@/lib/paths";

export type PathVisualTone =
  | "neutral"
  | "data"
  | "compute"
  | "model"
  | "serve"
  | "risk";

export type PathVisualVariant =
  | "pipeline"
  | "stack"
  | "loop"
  | "matrix"
  | "tradeoff"
  | "gate";

export interface PathVisualNode {
  label: string;
  caption: string;
  tone: PathVisualTone;
}

export interface PathVisualBriefData {
  pathId: AdultPathId;
  slug: string;
  title: string;
  focus: string;
  variant: PathVisualVariant;
  nodes: readonly PathVisualNode[];
  checks: readonly [string, string];
}
