import type { ComponentType } from "react";
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
 * Phase 1: empty. Phase 2 tasks 1-8 populate this one by one.
 */
export const tileBodies: Partial<Record<TileSlug, ComponentType>> = {
  // Task 1 will add: chat: dynamic(() => import("./chat"))
};
