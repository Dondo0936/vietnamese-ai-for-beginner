import type { KidsTopicMeta } from "@/lib/kids/types";

/**
 * Kid topic registry — separate from the adult topicMap. See spec §11.1.
 *
 * Phase 1 ships empty. Phase 5 adds all 48 kid topics. Phase 3 adds
 * the two exemplar lessons (one Nhí + one Teen).
 *
 * Kept as a dedicated module so imports from /kids/* routes never
 * accidentally pull in adult topic code, and vice versa.
 */

export const kidsTopicList: KidsTopicMeta[] = [];

export const kidsTopicMap: Record<string, KidsTopicMeta> = Object.fromEntries(
  kidsTopicList.map((t) => [t.slug, t])
);

/** Topics filtered by tier — used by /kids/nhi and /kids/teen pages. */
export const nhiTopics: KidsTopicMeta[] = kidsTopicList.filter((t) => t.tier === "nhi");
export const teenTopics: KidsTopicMeta[] = kidsTopicList.filter((t) => t.tier === "teen");
