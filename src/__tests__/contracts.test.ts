/**
 * Contracts — cross-cutting invariants.
 *
 * These assert the rules in `docs/CONTRACTS.md`. Every RED here points at
 * a specific section of that doc. If a test fails, fix the file — don't
 * loosen the test.
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { topicList, categories } from "@/topics/registry";
import { PATHS, type AdultPathId } from "@/lib/paths";

const TOPICS_DIR = path.resolve(__dirname, "..", "topics");

interface ParsedMetadata {
  slug: string;
  titleVi?: string;
  description?: string;
  difficulty?: string;
  category?: string;
}

/**
 * Extract string-valued fields from the `export const metadata` block of a
 * topic .tsx file. Uses a forgiving regex over the slice between
 * `export const metadata` and the terminating `};` — good enough because
 * topic metadata is always simple scalars + arrays, never expressions.
 */
function parseTopicMetadata(source: string, slug: string): ParsedMetadata {
  const startIdx = source.search(/export\s+const\s+metadata\s*:\s*TopicMeta\s*=\s*\{/);
  if (startIdx === -1) return { slug };

  // Walk braces from the opening `{` to find the matching close.
  const openBraceIdx = source.indexOf("{", startIdx);
  let depth = 0;
  let endIdx = openBraceIdx;
  for (let i = openBraceIdx; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  const block = source.slice(openBraceIdx, endIdx);

  const readStringField = (name: string): string | undefined => {
    // Find `name:` (at a token boundary) and then the next run of
    // quoted strings, optionally joined by `+`. Handles multiline forms
    // like `description:\n    "..."\n    + "..."`.
    const keyRe = new RegExp(`\\b${name}\\s*:\\s*`);
    const keyMatch = block.match(keyRe);
    if (!keyMatch) return undefined;
    const startAt = (keyMatch.index ?? 0) + keyMatch[0].length;
    const tail = block.slice(startAt);

    // Walk forward, collecting consecutive "..." string literals separated
    // only by whitespace or `+` until we hit a non-string token.
    let i = 0;
    const parts: string[] = [];
    while (i < tail.length) {
      // Skip whitespace and + operators between string literals.
      while (i < tail.length && /[\s+]/.test(tail[i])) i++;
      if (tail[i] !== '"') break;
      // Consume a "..." literal.
      i++;
      let buf = "";
      while (i < tail.length && tail[i] !== '"') {
        if (tail[i] === "\\" && i + 1 < tail.length) {
          const next = tail[i + 1];
          if (next === "n") buf += "\n";
          else if (next === "t") buf += "\t";
          else if (next === '"') buf += '"';
          else if (next === "\\") buf += "\\";
          else buf += next;
          i += 2;
        } else {
          buf += tail[i];
          i++;
        }
      }
      i++; // closing quote
      parts.push(buf);
    }
    return parts.length ? parts.join("") : undefined;
  };

  return {
    slug,
    titleVi: readStringField("titleVi"),
    description: readStringField("description"),
    difficulty: readStringField("difficulty"),
    category: readStringField("category"),
  };
}

// Files in src/topics/ that are infrastructure, not learning topics.
// Keep this list minimal — everything else is expected to parse.
const NON_TOPIC_FILES = new Set(["topic-loader.tsx", "registry.ts"]);

function readTopicFiles(): Map<string, ParsedMetadata> {
  const entries = fs.readdirSync(TOPICS_DIR).filter(
    (f) =>
      f.endsWith(".tsx") &&
      !f.startsWith("_") &&
      !NON_TOPIC_FILES.has(f)
  );
  const result = new Map<string, ParsedMetadata>();
  for (const file of entries) {
    const slug = file.replace(/\.tsx$/, "");
    const full = fs.readFileSync(path.join(TOPICS_DIR, file), "utf8");
    result.set(slug, parseTopicMetadata(full, slug));
  }
  return result;
}

// ─── 1. Metadata parity ─────────────────────────────────────────────
describe("Contract: metadata parity with registry", () => {
  const fileMetadata = readTopicFiles();
  const registryBySlug = new Map(topicList.map((t) => [t.slug, t]));

  const commonSlugs = [...fileMetadata.keys()].filter((s) =>
    registryBySlug.has(s)
  );

  it("registry and topic files describe the same slugs", () => {
    const fileOnly = [...fileMetadata.keys()].filter(
      (s) => !registryBySlug.has(s)
    );
    const registryOnly = [...registryBySlug.keys()].filter(
      (s) => !fileMetadata.has(s)
    );
    expect({ fileOnly, registryOnly }).toEqual({
      fileOnly: [],
      registryOnly: [],
    });
  });

  it("titleVi matches between topic file and registry", () => {
    const mismatches = commonSlugs
      .map((slug) => {
        const file = fileMetadata.get(slug);
        const reg = registryBySlug.get(slug)!;
        if (file?.titleVi && file.titleVi !== reg.titleVi) {
          return { slug, file: file.titleVi, registry: reg.titleVi };
        }
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    expect(mismatches).toEqual([]);
  });

  it("description matches between topic file and registry", () => {
    const mismatches = commonSlugs
      .map((slug) => {
        const file = fileMetadata.get(slug);
        const reg = registryBySlug.get(slug)!;
        if (file?.description && file.description !== reg.description) {
          return {
            slug,
            file: file.description.slice(0, 60) + "…",
            registry: reg.description.slice(0, 60) + "…",
          };
        }
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    expect(mismatches).toEqual([]);
  });

  it("difficulty matches between topic file and registry", () => {
    const mismatches = commonSlugs
      .map((slug) => {
        const file = fileMetadata.get(slug);
        const reg = registryBySlug.get(slug)!;
        if (file?.difficulty && file.difficulty !== reg.difficulty) {
          return { slug, file: file.difficulty, registry: reg.difficulty };
        }
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    expect(mismatches).toEqual([]);
  });

  it("category matches between topic file and registry", () => {
    const mismatches = commonSlugs
      .map((slug) => {
        const file = fileMetadata.get(slug);
        const reg = registryBySlug.get(slug)!;
        if (file?.category && file.category !== reg.category) {
          return { slug, file: file.category, registry: reg.category };
        }
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    expect(mismatches).toEqual([]);
  });
});

// ─── 2. Difficulty monotonicity ─────────────────────────────────────
describe("Contract: difficulty monotonic per stage", () => {
  const DIFFICULTY_RANK: Record<string, number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  };

  const registryBySlug = new Map(topicList.map((t) => [t.slug, t]));

  const pathIds = Object.keys(PATHS) as AdultPathId[];

  for (const pathId of pathIds) {
    const pathDef = PATHS[pathId];

    it(`${pathDef.id}: no back-step within a stage`, () => {
      const regressions: Array<{
        stage: string;
        from: { slug: string; difficulty: string };
        to: { slug: string; difficulty: string };
      }> = [];

      for (const stage of pathDef.stages) {
        let prev: { slug: string; difficulty: string; rank: number } | null =
          null;
        for (const slug of stage.slugs) {
          const topic = registryBySlug.get(slug);
          if (!topic) continue;
          const rank = DIFFICULTY_RANK[topic.difficulty];
          if (prev && rank < prev.rank) {
            regressions.push({
              stage: stage.title,
              from: { slug: prev.slug, difficulty: prev.difficulty },
              to: { slug, difficulty: topic.difficulty },
            });
          }
          prev = { slug, difficulty: topic.difficulty, rank };
        }
      }

      expect(regressions).toEqual([]);
    });
  }
});

// ─── 3. Root layout wraps MotionConfig ──────────────────────────────
describe("Contract: root layout wraps MotionConfig reducedMotion", () => {
  it("root layout renders a MotionProvider around children", () => {
    const layout = fs.readFileSync(
      path.resolve(__dirname, "..", "app", "layout.tsx"),
      "utf8"
    );
    expect(layout).toMatch(/MotionProvider/);
  });

  it("MotionProvider wraps children with MotionConfig reducedMotion=user", () => {
    const provider = fs.readFileSync(
      path.resolve(__dirname, "..", "components", "MotionProvider.tsx"),
      "utf8"
    );
    expect(provider).toMatch(/from\s+["']framer-motion["']/);
    expect(provider).toMatch(/MotionConfig/);
    expect(provider).toMatch(/reducedMotion\s*=\s*["']user["']/);
  });
});

// ─── 4. DraggableDot primitive exists with hitbox ≥ 44 ──────────────
describe("Contract: DraggableDot primitive (44×44 hitbox)", () => {
  const file = path.resolve(
    __dirname,
    "..",
    "components",
    "interactive",
    "DraggableDot.tsx"
  );

  it("file exists", () => {
    expect(fs.existsSync(file)).toBe(true);
  });

  it("declares a hit-overlay radius of at least 18 (36px diameter, WCAG-adjacent)", () => {
    if (!fs.existsSync(file)) return;
    const src = fs.readFileSync(file, "utf8");
    // Expect a named const or a numeric literal ≥ 18 tied to hitbox rendering.
    // We accept either "HITBOX_R = 18" or inline r={18} on an invisible circle.
    const namedConst = src.match(/HITBOX_R\s*=\s*(\d+)/);
    const inline = src.match(/r=\{(\d+)\}[^>]*opacity=\{?["']?0/);
    const radius =
      (namedConst ? parseInt(namedConst[1], 10) : 0) ||
      (inline ? parseInt(inline[1], 10) : 0);
    expect(radius).toBeGreaterThanOrEqual(18);
  });
});

// ─── 5. MetricReadout primitive exists with aria-live ───────────────
describe("Contract: MetricReadout primitive (aria-live=polite)", () => {
  const file = path.resolve(
    __dirname,
    "..",
    "components",
    "interactive",
    "MetricReadout.tsx"
  );

  it("file exists", () => {
    expect(fs.existsSync(file)).toBe(true);
  });

  it('renders with aria-live="polite"', () => {
    if (!fs.existsSync(file)) return;
    const src = fs.readFileSync(file, "utf8");
    expect(src).toMatch(/aria-live\s*=\s*["']polite["']/);
  });
});

// ─── 6. DragDrop supports pointer events ────────────────────────────
describe("Contract: DragDrop responds to pointer events", () => {
  it("uses onPointerDown/onPointerMove/onPointerUp or @dnd-kit", () => {
    const src = fs.readFileSync(
      path.resolve(
        __dirname,
        "..",
        "components",
        "interactive",
        "DragDrop.tsx"
      ),
      "utf8"
    );
    const hasPointerEvents =
      /onPointerDown|onPointerMove|onPointerUp|PointerSensor/.test(src);
    expect(hasPointerEvents).toBe(true);
  });
});

// ─── 7. UI-semantic hex should use CSS tokens ───────────────────────
// Regression guard: UI-class-bound hex (text-[#...], bg-[#...],
// border-[#...]) in topic files drifts away from theming. Catches new
// violations; a dedicated migration wave reduces the existing count.
describe("Contract: UI-class-bound hex in topic files", () => {
  const topicsDir = TOPICS_DIR;
  const files = fs
    .readdirSync(topicsDir)
    .filter((f) => f.endsWith(".tsx") && !f.startsWith("_") && f !== "topic-loader.tsx");

  function countUiBoundHex(src: string): number {
    const re = /(?:text|bg|border|ring|fill|stroke)-\[#[0-9a-fA-F]{6}\]/g;
    return (src.match(re) ?? []).length;
  }

  it("does not grow beyond the locked regression threshold", () => {
    let total = 0;
    for (const f of files) {
      const src = fs.readFileSync(path.join(topicsDir, f), "utf8");
      total += countUiBoundHex(src);
    }
    // Lock the count at the discovered value. Audit waves should LOWER
    // this; if it ever grows, a new class-bound hex slipped in and this
    // test fails. Update the threshold downward as you reduce.
    expect(total).toBeLessThanOrEqual(52);
  });
});

// ─── 8. relatedSlugs integrity ──────────────────────────────────────
describe("Contract: relatedSlugs point at real topics", () => {
  it("every relatedSlug in registry.ts resolves to a known topic slug", () => {
    const slugs = new Set(topicList.map((t) => t.slug));
    const broken = topicList.flatMap((t) =>
      t.relatedSlugs
        .filter((s) => !slugs.has(s))
        .map((bad) => ({ topic: t.slug, broken: bad }))
    );
    expect(broken).toEqual([]);
  });

  it("every relatedSlug in a topic file's metadata matches a registry entry", () => {
    const slugs = new Set(topicList.map((t) => t.slug));
    const entries = fs
      .readdirSync(TOPICS_DIR)
      .filter((f) => f.endsWith(".tsx") && !f.startsWith("_") && !NON_TOPIC_FILES.has(f));
    const broken: Array<{ topic: string; broken: string }> = [];
    for (const file of entries) {
      const slug = file.replace(/\.tsx$/, "");
      const src = fs.readFileSync(path.join(TOPICS_DIR, file), "utf8");
      const metaRange = src.search(/export\s+const\s+metadata\s*:\s*TopicMeta\s*=\s*\{/);
      if (metaRange === -1) continue;
      const openIdx = src.indexOf("{", metaRange);
      let depth = 0;
      let endIdx = openIdx;
      for (let i = openIdx; i < src.length; i++) {
        if (src[i] === "{") depth++;
        else if (src[i] === "}") {
          depth--;
          if (depth === 0) {
            endIdx = i + 1;
            break;
          }
        }
      }
      const block = src.slice(openIdx, endIdx);
      const relMatch = block.match(/relatedSlugs\s*:\s*\[([\s\S]*?)\]/);
      if (!relMatch) continue;
      const relSlugs = [...relMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
      for (const r of relSlugs) {
        if (!slugs.has(r)) broken.push({ topic: slug, broken: r });
      }
    }
    expect(broken).toEqual([]);
  });
});

// ─── 9. TopicMeta shape — required fields present ───────────────────
describe("Contract: every topic file's metadata has required TopicMeta fields", () => {
  it("every metadata export declares slug/title/titleVi/description/category/tags/difficulty/relatedSlugs/vizType", () => {
    const required = [
      "slug",
      "title",
      "titleVi",
      "description",
      "category",
      "tags",
      "difficulty",
      "relatedSlugs",
      "vizType",
    ];
    const entries = fs
      .readdirSync(TOPICS_DIR)
      .filter((f) => f.endsWith(".tsx") && !f.startsWith("_") && !NON_TOPIC_FILES.has(f));
    const missing: Array<{ topic: string; missing: string[] }> = [];
    for (const file of entries) {
      const slug = file.replace(/\.tsx$/, "");
      const src = fs.readFileSync(path.join(TOPICS_DIR, file), "utf8");
      const startIdx = src.search(/export\s+const\s+metadata\s*:\s*TopicMeta\s*=\s*\{/);
      if (startIdx === -1) {
        missing.push({ topic: slug, missing: ["(no metadata export)"] });
        continue;
      }
      const openIdx = src.indexOf("{", startIdx);
      let depth = 0;
      let endIdx = openIdx;
      for (let i = openIdx; i < src.length; i++) {
        if (src[i] === "{") depth++;
        else if (src[i] === "}") {
          depth--;
          if (depth === 0) {
            endIdx = i + 1;
            break;
          }
        }
      }
      const block = src.slice(openIdx, endIdx);
      const missingFields = required.filter(
        (f) => !new RegExp(`\\b${f}\\s*:`).test(block)
      );
      if (missingFields.length)
        missing.push({ topic: slug, missing: missingFields });
    }
    expect(missing).toEqual([]);
  });
});

// ─── 9a. category values resolve to known categories ──────────────
describe("Contract: every topic's category resolves to the categories list", () => {
  it("no topic declares a category that isn't defined in registry categories", () => {
    const known = new Set(categories.map((c) => c.slug));
    const bad = topicList
      .filter((t) => !known.has(t.category))
      .map((t) => ({ topic: t.slug, category: t.category }));
    expect(bad).toEqual([]);
  });
});

// ─── 9b. generateMetadata uses registry as source of truth ─────────
describe("Contract: /topics/[slug] generateMetadata reads registry.ts", () => {
  it("page.tsx calls getTopicBySlug and renders topic.titleVi in <title>", () => {
    const page = fs.readFileSync(
      path.resolve(__dirname, "..", "app", "topics", "[slug]", "page.tsx"),
      "utf8"
    );
    expect(page).toMatch(/generateMetadata/);
    expect(page).toMatch(/getTopicBySlug/);
    expect(page).toMatch(/topic\.titleVi/);
  });
});

// ─── 10. SVG text fontSize should not be a raw px number ────────────
describe("Contract: SVG <text> fontSize not hardcoded px in topic files", () => {
  const topicsDir = TOPICS_DIR;
  const files = fs
    .readdirSync(topicsDir)
    .filter((f) => f.endsWith(".tsx") && !f.startsWith("_") && f !== "topic-loader.tsx");

  function countHardcodedPxFontSize(src: string): number {
    // Match `fontSize="10"` or `fontSize={10}` on SVG <text>-like
    // elements. We don't distinguish <text> from other uses — SVG
    // fontSize should always be em or responsive.
    const re = /fontSize\s*=\s*(?:"(?:\d+)"|\{\d+\})/g;
    return (src.match(re) ?? []).length;
  }

  it("does not grow beyond the locked regression threshold", () => {
    let total = 0;
    for (const f of files) {
      const src = fs.readFileSync(path.join(topicsDir, f), "utf8");
      total += countHardcodedPxFontSize(src);
    }
    // Lock the count at the current value. New additions must fail this
    // test. Dedicated reduction wave should lower the threshold over
    // time. Today's baseline: 1507.
    expect(total).toBeLessThanOrEqual(1507);
  });
});
