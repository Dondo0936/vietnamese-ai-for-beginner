#!/usr/bin/env node
/**
 * Research stage — ingests the JSON payload emitted by the udemi-research
 * subagent and writes it into the manifest's research slice. If the
 * manifest does not yet exist for this slug, seeds it with title +
 * summary + research from the same payload.
 *
 * Usage:
 *   pnpm pipeline:research <slug> --from-file=<path-to-research.json>
 *
 * Payload shape (mirrors agents/udemi-research.md):
 *   {
 *     slug, title:{vn,en}, summary:{vn,en},
 *     research: { sources: [...], keyPoints: [...] }
 *   }
 *
 * Exit codes:
 *   0  ok — manifest written, state.stage advanced to "article"
 *   1  validation or I/O error (message on stderr)
 *   2  bad usage
 */

import { promises as fs } from "node:fs";
import { z } from "zod";

import {
  PartialTopicManifestSchema,
  TopicManifestSchema,
  type PartialTopicManifest,
} from "./manifest";
import {
  manifestExists,
  readManifest,
  writeManifest,
} from "./util/manifest-store";

const ResearchPayloadSchema = z.object({
  slug: PartialTopicManifestSchema.shape.slug,
  title: PartialTopicManifestSchema.shape.title,
  summary: PartialTopicManifestSchema.shape.summary,
  research: TopicManifestSchema.shape.research,
});
type ResearchPayload = z.infer<typeof ResearchPayloadSchema>;

interface Args {
  slug: string;
  fromFile?: string;
}

export function parseArgs(argv: string[]): Args | { usageError: string } {
  const positionals: string[] = [];
  let fromFile: string | undefined;
  for (const a of argv) {
    if (a.startsWith("--from-file=")) {
      fromFile = a.slice("--from-file=".length);
    } else if (a.startsWith("--")) {
      return { usageError: `unknown flag: ${a}` };
    } else {
      positionals.push(a);
    }
  }
  if (positionals.length !== 1) {
    return { usageError: "expected exactly one positional <slug>" };
  }
  return { slug: positionals[0], fromFile };
}

export async function ingestResearch(
  slug: string,
  payload: ResearchPayload,
  now = new Date(),
): Promise<PartialTopicManifest> {
  if (payload.slug !== slug) {
    throw new Error(
      `payload slug "${payload.slug}" does not match CLI slug "${slug}"`,
    );
  }

  const updatedAt = now.toISOString();
  const next: PartialTopicManifest = (await manifestExists(slug))
    ? { ...(await readManifest(slug)), title: payload.title, summary: payload.summary, research: payload.research, state: { stage: "article", updatedAt, published: false } }
    : {
        slug,
        title: payload.title,
        summary: payload.summary,
        research: payload.research,
        state: { stage: "article", updatedAt, published: false },
      };

  await writeManifest(next);
  return next;
}

export async function main(argv: string[]): Promise<number> {
  const parsed = parseArgs(argv);
  if ("usageError" in parsed) {
    console.error(`usage: pipeline:research <slug> --from-file=<path>`);
    console.error(parsed.usageError);
    return 2;
  }
  if (!parsed.fromFile) {
    console.error("pipeline:research currently requires --from-file (L1).");
    return 2;
  }

  const raw = await fs.readFile(parsed.fromFile, "utf8");
  const json = JSON.parse(raw);
  const payload = ResearchPayloadSchema.parse(json);

  const next = await ingestResearch(parsed.slug, payload);
  console.log(`ok: ${next.slug} @ stage=${next.state.stage} (${next.research?.sources.length ?? 0} sources)`);
  return 0;
}

const isDirectInvocation = typeof require !== "undefined" && require.main === module;
if (isDirectInvocation) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
