/**
 * Contract tests for the automated publishing pipeline manifest.
 *
 * The manifest is the spine of every stage (research → … → publish). If
 * the schema accepts a malformed manifest, a downstream stage will fail
 * silently. Every invariant tested here is referenced by the plan in
 * /root/.claude/plans/system-reminder-you-re-running-in-silly-lemon.md.
 */

import { describe, it, expect } from "vitest";
import { promises as fs } from "node:fs";
import * as path from "node:path";

import {
  TopicManifestSchema,
  PartialTopicManifestSchema,
  captionsScenesDrift,
  sceneSumSeconds,
  MANIFEST_FPS,
  type TopicManifest,
} from "../../scripts/pipeline/manifest";

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const EXAMPLE_PATH = path.join(REPO_ROOT, "content", "manifests", "pipeline-example.json");

async function loadExample(): Promise<unknown> {
  return JSON.parse(await fs.readFile(EXAMPLE_PATH, "utf8"));
}

describe("TopicManifest schema", () => {
  it("round-trips the canonical example fixture", async () => {
    const json = await loadExample();
    const parsed = TopicManifestSchema.parse(json);
    expect(parsed.slug).toBe("pipeline-example");
    expect(parsed.scenes.length).toBeGreaterThanOrEqual(1);
    expect(parsed.state.stage).toBe("done");
  });

  it("rejects a Vietnamese narration containing an em-dash", async () => {
    const json = (await loadExample()) as TopicManifest;
    json.scenes[0].narration.vn = "Câu — có em-dash sai chuẩn.";
    const result = TopicManifestSchema.safeParse(json);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toMatch(/em-dash/);
    }
  });

  it("permits the em-dash in English narration (project rule is VN-only)", async () => {
    const json = (await loadExample()) as TopicManifest;
    json.scenes[0].narration.en = "An English sentence — with em-dash allowed.";
    expect(() => TopicManifestSchema.parse(json)).not.toThrow();
  });

  it("rejects a non-kebab-case slug", async () => {
    const json = (await loadExample()) as TopicManifest;
    json.slug = "Bad_Slug";
    expect(() => TopicManifestSchema.parse(json)).toThrow();
  });

  it("rejects scenes longer than 30 seconds (sign of a script bug)", async () => {
    const json = (await loadExample()) as TopicManifest;
    json.scenes[0].durationFrames = 30 * MANIFEST_FPS + 1;
    expect(() => TopicManifestSchema.parse(json)).toThrow();
  });

  it("rejects research with zero sources", async () => {
    const json = (await loadExample()) as TopicManifest;
    json.research.sources = [];
    expect(() => TopicManifestSchema.parse(json)).toThrow();
  });

  it("requires the visual discriminator to be image | clip | remotion-graphic", async () => {
    const json = (await loadExample()) as TopicManifest;
    // @ts-expect-error — bad union member intentional for the test.
    json.scenes[0].visual = { kind: "video", prompt: "wrong kind" };
    expect(() => TopicManifestSchema.parse(json)).toThrow();
  });
});

describe("PartialTopicManifest schema", () => {
  it("accepts a brand-new manifest with only slug + title + state filled", () => {
    const seed = {
      slug: "new-topic",
      title: { vn: "Chủ đề mới", en: "New topic" },
      summary: { vn: "Tóm tắt", en: "Summary" },
      state: { stage: "research", updatedAt: "2026-05-16T00:00:00.000Z", published: false },
    };
    expect(() => PartialTopicManifestSchema.parse(seed)).not.toThrow();
  });

  it("still rejects a bad slug even when partial", () => {
    const seed = {
      slug: "BAD SLUG",
      title: { vn: "x", en: "x" },
      summary: { vn: "y", en: "y" },
      state: { stage: "research", updatedAt: "2026-05-16T00:00:00.000Z", published: false },
    };
    expect(() => PartialTopicManifestSchema.parse(seed)).toThrow();
  });
});

describe("captionsScenesDrift", () => {
  it("returns null when captions match scene-sum within ±1 frame", async () => {
    const m = TopicManifestSchema.parse(await loadExample());
    expect(captionsScenesDrift(m.scenes, m.captions)).toBeNull();
  });

  it("flags drift larger than 1 frame in either language", async () => {
    const m = TopicManifestSchema.parse(await loadExample());
    const targetSec = sceneSumSeconds(m.scenes);
    const driftSec = 2 / MANIFEST_FPS; // 2 frames > 1 frame tolerance
    m.captions.vn.duration = targetSec + driftSec;
    const reason = captionsScenesDrift(m.scenes, m.captions);
    expect(reason).not.toBeNull();
    expect(reason).toMatch(/vn/);
  });
});

describe("sceneSumSeconds", () => {
  it("sums frames at the canonical project FPS (30)", async () => {
    const m = TopicManifestSchema.parse(await loadExample());
    const totalFrames = m.scenes.reduce((a, s) => a + s.durationFrames, 0);
    expect(sceneSumSeconds(m.scenes)).toBeCloseTo(totalFrames / 30, 5);
  });
});
