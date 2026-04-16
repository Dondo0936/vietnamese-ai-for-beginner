import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, extname, resolve } from "node:path";

const TOPICS_DIR = resolve(process.cwd(), "src/topics");

function readTopicFiles(): Array<{ slug: string; source: string }> {
  return readdirSync(TOPICS_DIR)
    .filter((f) => extname(f) === ".tsx")
    .filter((f) => f !== "_template.tsx")
    .filter((f) => f !== "topic-loader.tsx")
    .map((f) => ({
      slug: f.replace(/\.tsx$/, ""),
      source: readFileSync(join(TOPICS_DIR, f), "utf-8"),
    }));
}

function countOccurrences(source: string, pattern: RegExp): number {
  return (source.match(pattern) ?? []).length;
}

describe("topic files — section uniqueness", () => {
  const topics = readTopicFiles();

  it("discovers topic files", () => {
    expect(topics.length).toBeGreaterThan(100);
  });

  it("no topic renders more than one <VisualizationSection>", () => {
    const offenders = topics.filter(
      ({ source }) => countOccurrences(source, /<VisualizationSection[\s/>]/g) > 1
    );
    expect(offenders.map((o) => o.slug)).toEqual([]);
  });

  it("no topic renders more than one <ExplanationSection>", () => {
    const offenders = topics.filter(
      ({ source }) => countOccurrences(source, /<ExplanationSection[\s/>]/g) > 1
    );
    expect(offenders.map((o) => o.slug)).toEqual([]);
  });

  const APPLICATION_SECTION_PATTERNS: Record<string, RegExp> = {
    ApplicationHero: /<ApplicationHero[\s/>]/g,
    ApplicationProblem: /<ApplicationProblem[\s/>]/g,
    ApplicationMechanism: /<ApplicationMechanism[\s/>]/g,
    ApplicationMetrics: /<ApplicationMetrics[\s/>]/g,
    ApplicationTryIt: /<ApplicationTryIt[\s/>]/g,
    ApplicationCounterfactual: /<ApplicationCounterfactual[\s/>]/g,
  };

  for (const [name, pattern] of Object.entries(APPLICATION_SECTION_PATTERNS)) {
    it(`no topic renders more than one <${name}>`, () => {
      const offenders = topics.filter(
        ({ source }) => countOccurrences(source, pattern) > 1
      );
      expect(offenders.map((o) => o.slug)).toEqual([]);
    });
  }
});
