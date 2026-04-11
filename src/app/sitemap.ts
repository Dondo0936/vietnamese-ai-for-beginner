import type { MetadataRoute } from "next";
import { getAllTopics } from "@/topics/registry";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ai-edu-app.vercel.app";

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
  ];
}
