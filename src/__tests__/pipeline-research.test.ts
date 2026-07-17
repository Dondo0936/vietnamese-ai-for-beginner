/**
 * Tests for scripts/pipeline/research.ts — argument parsing and the
 * ingestResearch side effect. Uses a tmp manifest dir so it doesn't
 * pollute content/manifests/.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
  parseArgs,
  ingestResearch,
} from "../../scripts/pipeline/research";
import { readManifest } from "../../scripts/pipeline/util/manifest-store";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "udemi-research-"));
  process.env.UDEMI_PIPELINE_MANIFEST_DIR = tmpDir;
});

afterEach(async () => {
  delete process.env.UDEMI_PIPELINE_MANIFEST_DIR;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

const validPayload = {
  slug: "test-topic",
  title: { vn: "Chủ đề thử nghiệm", en: "Test topic" },
  summary: { vn: "Tóm tắt thử nghiệm.", en: "Test summary." },
  research: {
    sources: [
      {
        url: "https://example.com/a",
        quote: "A quote.",
        fetchedAt: "2026-05-16T00:00:00.000Z",
      },
    ],
    keyPoints: ["Điểm một.", "Điểm hai."],
  },
};

describe("parseArgs", () => {
  it("accepts a single positional slug + --from-file flag", () => {
    const result = parseArgs(["test-topic", "--from-file=research.json"]);
    expect(result).toEqual({ slug: "test-topic", fromFile: "research.json" });
  });

  it("errors when no positional slug is given", () => {
    const result = parseArgs(["--from-file=x.json"]);
    expect(result).toHaveProperty("usageError");
  });

  it("errors when more than one positional is given", () => {
    const result = parseArgs(["a", "b"]);
    expect(result).toHaveProperty("usageError");
  });

  it("errors on unknown flag", () => {
    const result = parseArgs(["slug", "--what=x"]);
    expect(result).toHaveProperty("usageError");
  });
});

describe("ingestResearch", () => {
  it("seeds a new manifest when none exists and advances stage to article", async () => {
    const now = new Date("2026-05-16T12:00:00.000Z");
    await ingestResearch("test-topic", validPayload, now);
    const m = await readManifest("test-topic");
    expect(m.slug).toBe("test-topic");
    expect(m.title.vn).toBe("Chủ đề thử nghiệm");
    expect(m.research?.sources).toHaveLength(1);
    expect(m.state.stage).toBe("article");
    expect(m.state.updatedAt).toBe("2026-05-16T12:00:00.000Z");
  });

  it("rejects a payload whose slug disagrees with the CLI slug", async () => {
    await expect(
      ingestResearch("other-slug", validPayload),
    ).rejects.toThrow(/does not match/);
  });

  it("preserves prior slices and only updates research + state", async () => {
    // Seed once.
    await ingestResearch("test-topic", validPayload);
    // Re-ingest with a new sources list — original title should remain.
    const updated = {
      ...validPayload,
      research: {
        sources: [
          {
            url: "https://example.com/b",
            quote: "Different quote.",
            fetchedAt: "2026-05-16T12:00:00.000Z",
          },
        ],
        keyPoints: ["Updated point."],
      },
    };
    await ingestResearch("test-topic", updated);
    const m = await readManifest("test-topic");
    expect(m.research?.keyPoints).toEqual(["Updated point."]);
  });
});
