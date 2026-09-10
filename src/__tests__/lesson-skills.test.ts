import { describe, expect, it } from "vitest";
import {
  LESSON_SKILLS,
  SKILL_URLS,
  getLessonSkill,
} from "@/lib/lesson-skills";
import { topicMap } from "@/topics/registry";

const EM_DASH = "\u2014";
const ALIGNED_SLUGS = [
  "ai-for-writing",
  "prompt-engineering",
  "prompt-engineering-in-writing-tools",
  "ai-for-social-media",
  "text-to-video",
];
const BLOCKED_URL_SNIPPETS = [
  "emailaiexpert",
  "akwab",
  "ykfcdn",
  "loaders",
];

function collectCopy(): string[] {
  return Object.values(LESSON_SKILLS).flatMap((block) => [
    block.heading,
    block.intro,
    ...block.offers.flatMap((offer) => [
      offer.price,
      offer.title,
      offer.body,
      offer.also?.label ?? "",
    ]),
  ]);
}

describe("lesson-skills alignment", () => {
  it("maps only the agreed lesson slugs", () => {
    expect(Object.keys(LESSON_SKILLS).sort()).toEqual([...ALIGNED_SLUGS].sort());
  });

  it("every mapped slug exists in the topic registry", () => {
    for (const slug of Object.keys(LESSON_SKILLS)) {
      expect(topicMap[slug], slug).toBeTruthy();
    }
  });

  it("does not send udemi readers to loaders or email outreach", () => {
    const hrefs = Object.values(LESSON_SKILLS).flatMap((block) =>
      block.offers.flatMap((offer) =>
        [offer.href, offer.also?.href].filter(Boolean)
      )
    );
    for (const href of hrefs) {
      for (const bad of BLOCKED_URL_SNIPPETS) {
        expect(href).not.toContain(bad);
      }
    }
  });

  it("keeps Vietnamese copy free of em dashes", () => {
    for (const text of collectCopy()) {
      expect(text.includes(EM_DASH), text).toBe(false);
    }
  });

  it("returns null for unaligned lessons", () => {
    expect(getLessonSkill("attention-mechanism")).toBeNull();
    expect(getLessonSkill("claude-code-excel")).toBeNull();
  });

  it("puts the Vietnamese writing skill first on writing lessons", () => {
    const writing = getLessonSkill("ai-for-writing");
    expect(writing?.offers[0]?.href).toBe(SKILL_URLS.vietnameseWriting);
  });

  it("describes video QA as render QA, not generative video", () => {
    const video = getLessonSkill("text-to-video");
    expect(video?.intro).toMatch(/Remotion/);
    expect(video?.intro).toMatch(/ffmpeg/);
    expect(video?.intro).toMatch(/không phải clip kiểu Sora/);
  });
});
