import type { AdultPathId } from "@/lib/paths";
import { AI_ENGINEER_VISUAL_BRIEFS } from "./aiEngineer";
import type { PathVisualBriefData } from "./types";

const PATH_VISUAL_BRIEFS: Partial<
  Record<AdultPathId, Record<string, PathVisualBriefData>>
> = {
  "ai-engineer": AI_ENGINEER_VISUAL_BRIEFS,
};

export function getPathVisualBrief(
  pathId: AdultPathId,
  slug: string
): PathVisualBriefData | null {
  return PATH_VISUAL_BRIEFS[pathId]?.[slug] ?? null;
}

export { AI_ENGINEER_VISUAL_BRIEFS };
export type { PathVisualBriefData, PathVisualNode } from "./types";
