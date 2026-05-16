/**
 * Tests for scripts/pipeline/article.ts — writes the TSX files, prepends
 * the registry entry, and advances the manifest. Uses tmp dirs for the
 * manifest store, the articles dir, and the registry file so nothing
 * touches the real src/articles/.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
  parseArgs,
  ingestArticle,
  type ArticlePayload,
} from "../../scripts/pipeline/article";
import {
  writeManifest,
  readManifest,
} from "../../scripts/pipeline/util/manifest-store";

const STARTING_REGISTRY = `import type { ArticleMeta } from "@/lib/article-types";

export const articleList: ArticleMeta[] = [
  {
    slug: "existing-one",
    title: "Existing title.",
    dek: "Existing dek.",
    source: { name: "x", host: "x.com" },
    date: "2026-05-01",
    readingTime: "5 phút",
    category: "paper",
    lessonRefs: [],
  },
];

export const articleMap = Object.fromEntries(articleList.map((a) => [a.slug, a]));
`;

let tmpManifestDir: string;
let tmpArticlesDir: string;
let tmpRegistryPath: string;

beforeEach(async () => {
  tmpManifestDir = await fs.mkdtemp(path.join(os.tmpdir(), "udemi-article-m-"));
  tmpArticlesDir = await fs.mkdtemp(path.join(os.tmpdir(), "udemi-article-a-"));
  tmpRegistryPath = path.join(tmpArticlesDir, "registry.ts");
  await fs.writeFile(tmpRegistryPath, STARTING_REGISTRY, "utf8");
  process.env.UDEMI_PIPELINE_MANIFEST_DIR = tmpManifestDir;
  process.env.UDEMI_PIPELINE_ARTICLES_DIR = tmpArticlesDir;
  process.env.UDEMI_PIPELINE_ARTICLE_REGISTRY = tmpRegistryPath;

  // Seed a manifest with research already filled in.
  await writeManifest({
    slug: "test-topic",
    title: { vn: "Chủ đề thử nghiệm", en: "Test topic" },
    summary: { vn: "Tóm tắt.", en: "Summary." },
    research: {
      sources: [{ url: "https://example.com/a", quote: "Q", fetchedAt: "2026-05-16T00:00:00.000Z" }],
      keyPoints: ["Một.", "Hai."],
    },
    state: { stage: "article", updatedAt: "2026-05-16T00:00:00.000Z", published: false },
  });
});

afterEach(async () => {
  delete process.env.UDEMI_PIPELINE_MANIFEST_DIR;
  delete process.env.UDEMI_PIPELINE_ARTICLES_DIR;
  delete process.env.UDEMI_PIPELINE_ARTICLE_REGISTRY;
  await fs.rm(tmpManifestDir, { recursive: true, force: true });
  await fs.rm(tmpArticlesDir, { recursive: true, force: true });
});

function makePayload(overrides: Partial<ArticlePayload> = {}): ArticlePayload {
  return {
    slug: "test-topic",
    meta: {
      slug: "test-topic",
      title: "Title của bài.",
      dek: "Dek của bài.",
      source: { name: "udemi", host: "udemi.tech", url: "https://udemi.tech/articles/test-topic" },
      date: "2026-05-16",
      readingTime: "8 phút",
      category: "paper",
      tag: "giải thích",
      lessonRefs: ["sample"],
      relatedArticles: [],
      heroViz: undefined,
      isLead: false,
    },
    tsx: {
      vn: "export default function X() { return null; }\n",
      en: "export default function X() { return null; }\n",
    },
    ...overrides,
  } as ArticlePayload;
}

describe("article parseArgs", () => {
  it("accepts a single positional slug + --from-file", () => {
    expect(parseArgs(["test-topic", "--from-file=a.json"])).toEqual({
      slug: "test-topic",
      fromFile: "a.json",
    });
  });
});

describe("ingestArticle", () => {
  it("writes .tsx and .en.tsx, prepends the registry entry, advances stage to script", async () => {
    await ingestArticle("test-topic", makePayload(), new Date("2026-05-16T12:00:00.000Z"));

    const vn = await fs.readFile(path.join(tmpArticlesDir, "test-topic.tsx"), "utf8");
    const en = await fs.readFile(path.join(tmpArticlesDir, "test-topic.en.tsx"), "utf8");
    expect(vn).toContain("export default function X()");
    expect(en).toContain("export default function X()");

    const registry = await fs.readFile(tmpRegistryPath, "utf8");
    expect(registry).toContain(`slug: "test-topic",`);
    // Order check: new entry should appear BEFORE the existing one.
    expect(registry.indexOf(`slug: "test-topic",`)).toBeLessThan(
      registry.indexOf(`slug: "existing-one",`),
    );

    const m = await readManifest("test-topic");
    expect(m.state.stage).toBe("script");
    expect(m.state.updatedAt).toBe("2026-05-16T12:00:00.000Z");
  });

  it("is idempotent on the registry: re-running does not duplicate the entry", async () => {
    await ingestArticle("test-topic", makePayload());
    await ingestArticle("test-topic", makePayload());
    const registry = await fs.readFile(tmpRegistryPath, "utf8");
    const occurrences = registry.match(/slug: "test-topic",/g) ?? [];
    expect(occurrences.length).toBe(1);
  });

  it("rejects an em-dash in VN article TSX", async () => {
    const bad = makePayload({
      tsx: {
        vn: "export default function X() { return <p>Câu — em dash sai.</p>; }\n",
        en: "ok\n",
      },
    });
    await expect(ingestArticle("test-topic", bad)).rejects.toThrow();
  });

  it("rejects when manifest is missing (must run research first)", async () => {
    await fs.rm(path.join(tmpManifestDir, "test-topic.json"));
    await expect(ingestArticle("test-topic", makePayload())).rejects.toThrow(/research/);
  });

  it("rejects when payload slug disagrees with CLI slug", async () => {
    const bad = makePayload({ slug: "other-slug" });
    await expect(ingestArticle("test-topic", bad)).rejects.toThrow(/does not match/);
  });

  it("rejects when payload meta.slug disagrees with CLI slug", async () => {
    const bad = makePayload({ meta: { ...makePayload().meta, slug: "other-slug" } });
    await expect(ingestArticle("test-topic", bad)).rejects.toThrow(/does not match/);
  });
});
