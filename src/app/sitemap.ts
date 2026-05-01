import type { MetadataRoute } from "next";
import { getAllTopics } from "@/topics/registry";
import { tiles } from "@/features/claude/registry";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://udemi.tech";

export default function sitemap(): MetadataRoute.Sitemap {
  const topics = getAllTopics();

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...topics.map((topic) => ({
      url: `${BASE_URL}/topics/${topic.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    {
      url: `${BASE_URL}/claude`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/resources`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...tiles.map((tile) => ({
      url: `${BASE_URL}/claude/${tile.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
