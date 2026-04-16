import { describe, it, expectTypeOf } from "vitest";
import type {
  TopicMeta,
  TocSectionId,
  FeaturedApp,
  SourceLink,
} from "@/lib/types";

describe("TopicMeta application extensions", () => {
  it("accepts application-topic shape with applicationOf, featuredApp, sources", () => {
    const meta: TopicMeta = {
      slug: "k-means-in-music-recs",
      title: "K-means in Music Recs",
      titleVi: "K-means trong gợi ý nhạc",
      description: "Spotify dùng K-means để gợi ý Discover Weekly.",
      category: "ai-applications",
      tags: ["application", "music", "recommendations"],
      difficulty: "beginner",
      relatedSlugs: ["k-means"],
      vizType: "interactive",
      applicationOf: "k-means",
      featuredApp: {
        name: "Spotify",
        productFeature: "Discover Weekly",
        company: "Spotify AB",
        countryOrigin: "SE",
      },
      sources: [
        {
          title: "How Discover Weekly Works",
          publisher: "Spotify Engineering",
          url: "https://engineering.atspotify.com/...",
          date: "2016-03",
          kind: "engineering-blog",
        },
        {
          title: "Recommender Systems at Spotify",
          publisher: "NeurIPS",
          url: "https://arxiv.org/abs/...",
          date: "2020",
          kind: "paper",
        },
      ],
    };
    expectTypeOf(meta).toMatchTypeOf<TopicMeta>();
  });

  it("accepts theory-topic shape without application fields", () => {
    const meta: TopicMeta = {
      slug: "k-means",
      title: "K-means",
      titleVi: "K-means",
      description: "Thuật toán phân cụm K-means.",
      category: "ml-fundamentals",
      tags: ["clustering"],
      difficulty: "intermediate",
      relatedSlugs: ["knn"],
      vizType: "interactive",
    };
    expectTypeOf(meta).toMatchTypeOf<TopicMeta>();
  });

  it("TocSectionId covers both theory and application IDs", () => {
    const ids: TocSectionId[] = [
      "visualization",
      "explanation",
      "hero",
      "problem",
      "mechanism",
      "metrics",
      "tryIt",
      "counterfactual",
    ];
    expectTypeOf(ids).toEqualTypeOf<TocSectionId[]>();
  });
});
