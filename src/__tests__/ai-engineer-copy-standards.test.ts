import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { PATHS } from "@/lib/paths";
import { topicMap } from "@/topics/registry";

const TOPICS_DIR = path.resolve(__dirname, "..", "topics");
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const EM_DASH = "\u2014";
const AI_ENGINEER_SLUGS = PATHS["ai-engineer"].stages.flatMap(
  (stage) => stage.slugs,
);

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

function emDashLines(source: string): number[] {
  return source
    .split("\n")
    .map((line, index) => (line.includes(EM_DASH) ? index + 1 : null))
    .filter((line): line is number => line !== null);
}

describe("AI Engineer Vietnamese copy standards", () => {
  it("does not render em dashes from shared topic chrome", () => {
    const chromeFiles = [
      "src/app/topics/[slug]/page.tsx",
      "src/components/topic/RelatedTopics.tsx",
    ];
    const violations = chromeFiles.filter((file) =>
      fs.readFileSync(path.join(PROJECT_ROOT, file), "utf8").includes(EM_DASH),
    );

    expect(violations).toEqual([]);
  });

  it("does not ship em dashes in AI Engineer topic files or registry data", () => {
    const violations: string[] = [];

    for (const slug of AI_ENGINEER_SLUGS) {
      const sourceFile = path.join(TOPICS_DIR, `${slug}.tsx`);
      if (fs.existsSync(sourceFile)) {
        const lines = emDashLines(fs.readFileSync(sourceFile, "utf8"));
        if (lines.length) {
          violations.push(`${slug}.tsx:${lines.slice(0, 5).join(",")}`);
        }
      }

      const registryEntry = topicMap[slug];
      for (const text of collectStrings(registryEntry)) {
        if (text.includes(EM_DASH)) {
          violations.push(`${slug} registry: ${text.slice(0, 80)}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
