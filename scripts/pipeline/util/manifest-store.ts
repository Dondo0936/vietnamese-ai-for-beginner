/**
 * Read/write `content/manifests/<slug>.json`. The store validates every
 * read and every write against the partial schema; the full schema is
 * only enforced when the orchestrator promotes a manifest to
 * `state.stage === "done"`.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import {
  PartialTopicManifestSchema,
  TopicManifestSchema,
  type PartialTopicManifest,
  type TopicManifest,
} from "../manifest";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const MANIFEST_DIR = path.join(REPO_ROOT, "content", "manifests");

export function manifestPath(slug: string): string {
  return path.join(MANIFEST_DIR, `${slug}.json`);
}

export async function readManifest(slug: string): Promise<PartialTopicManifest> {
  const raw = await fs.readFile(manifestPath(slug), "utf8");
  const json = JSON.parse(raw);
  return PartialTopicManifestSchema.parse(json);
}

export async function writeManifest(m: PartialTopicManifest): Promise<void> {
  const validated = PartialTopicManifestSchema.parse(m);
  await fs.mkdir(MANIFEST_DIR, { recursive: true });
  const json = JSON.stringify(validated, null, 2) + "\n";
  await fs.writeFile(manifestPath(validated.slug), json, "utf8");
}

/**
 * Validate a manifest as fully complete. Throws ZodError if any required
 * slice is still missing or malformed. Called by the orchestrator before
 * flipping `state.stage` to `"done"`.
 */
export function assertComplete(m: PartialTopicManifest): TopicManifest {
  return TopicManifestSchema.parse(m);
}
