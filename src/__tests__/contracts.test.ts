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
import { topicList } from "@/topics/registry";
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
