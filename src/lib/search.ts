import Fuse from "fuse.js";
import type { TopicMeta } from "./types";

let fuseInstance: Fuse<TopicMeta> | null = null;

export function initSearch(topics: TopicMeta[]) {
  fuseInstance = new Fuse(topics, {
    keys: [
      { name: "title", weight: 0.4 },
      { name: "titleVi", weight: 0.3 },
      { name: "tags", weight: 0.2 },
      { name: "description", weight: 0.1 },
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 2,
  });
  return fuseInstance;
}

export function searchTopics(query: string): TopicMeta[] {
  if (!fuseInstance || !query.trim()) return [];
  const results = fuseInstance.search(query);
  return results.map((r) => r.item);
}
