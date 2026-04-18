import type { ComponentType } from "react";

/**
 * Slug → lazy body component. Populated per task as tiles ship.
 * When the registry flips a tile to `status: "ready"`, add the
 * corresponding entry here so the dispatcher renders the real
 * body instead of the TilePlaceholder.
 *
 * Phase 1: empty. Phase 2 tasks 1-8 populate this one by one.
 */
export const tileBodies: Record<string, ComponentType> = {
  // Task 1 will add: chat: dynamic(() => import("./chat"))
};
