import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://udemi.tech";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/bookmarks",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
