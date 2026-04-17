import { describe, it, expect } from "vitest";
import { kidsTopicList, kidsTopicMap, nhiTopics } from "@/topics/kids/kids-registry";

describe("kids-registry: Nhí topics", () => {
  it("has exactly 6 Nhí topics", () => {
    expect(nhiTopics).toHaveLength(6);
  });

  it("all Nhí topics have tier=nhi and durationMinutes=6", () => {
    for (const t of nhiTopics) {
      expect(t.tier).toBe("nhi");
      expect(t.durationMinutes).toBe(6);
    }
  });

  it("all slugs are in kidsTopicMap", () => {
    for (const t of kidsTopicList) {
      expect(kidsTopicMap[t.slug]).toBeDefined();
      expect(kidsTopicMap[t.slug].titleVi).toBe(t.titleVi);
    }
  });

  it("slugs follow nhi- prefix convention", () => {
    for (const t of nhiTopics) {
      expect(t.slug).toMatch(/^nhi-/);
    }
  });

  it("all Vietnamese text uses correct diacritics (no ASCII Vietnamese)", () => {
    const asciiPatterns = [
      /\bNha may\b/i, /\bVuon\b/i, /\bBan do\b/i, /\bTui bi\b/i,
      /\bRap chieu\b/i, /\bDuong dua\b/i, /\bsan ho\b/i, /\bsinh vat\b/i,
      /\bkho bau\b/i, /\bthan ky\b/i, /\bchieu bong\b/i, /\bdai duong\b/i,
    ];
    for (const t of nhiTopics) {
      for (const pattern of asciiPatterns) {
        expect(t.titleVi).not.toMatch(pattern);
        expect(t.description).not.toMatch(pattern);
      }
    }
  });

  const expectedSlugs = [
    "nhi-coral-factory", "nhi-creature-garden", "nhi-treasure-map",
    "nhi-magic-marble-bag", "nhi-shadow-theater", "nhi-ocean-race",
  ];

  it("has all expected slugs", () => {
    const slugs = nhiTopics.map((t) => t.slug).sort();
    expect(slugs).toEqual(expectedSlugs.sort());
  });
});
