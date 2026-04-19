import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import type { TileSlug } from "@/features/claude/registry";

/**
 * Slug → lazy body component. Populated per task as tiles ship.
 * When the registry flips a tile to `status: "ready"`, add the
 * corresponding entry here so the dispatcher renders the real
 * body instead of the TilePlaceholder.
 *
 * Keys are narrowed to `TileSlug` (the 24-member union from the
 * registry) so typos in downstream tile registrations fail at
 * compile time instead of silently falling through to the placeholder.
 *
 * Phase 2 progress:
 *  - Task 1: chat — streaming response demo.
 *  - Task 2: projects — workspace (projects) demo.
 *  - Task 3: artifacts — right-side live-preview panel demo.
 */
export const tileBodies: Partial<Record<TileSlug, ComponentType>> = {
  chat: dynamic(() => import("./chat")),
  projects: dynamic(() => import("./projects")),
  artifacts: dynamic(() => import("./artifacts")),
};
