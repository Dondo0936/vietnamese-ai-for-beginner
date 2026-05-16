#!/usr/bin/env node
/**
 * `pnpm pipeline:manifest:validate <path-to-json>` — round-trips a manifest
 * file through the Zod schema and prints the normalized JSON. Exits with
 * code 1 on any validation error. Used by CI and the pre-commit hook.
 */

import { promises as fs } from "node:fs";
import {
  PartialTopicManifestSchema,
  TopicManifestSchema,
  captionsScenesDrift,
} from "./manifest";

async function main(): Promise<number> {
  const arg = process.argv[2];
  if (!arg) {
    console.error("usage: validate-manifest <path-to-manifest.json>");
    return 2;
  }
  const raw = await fs.readFile(arg, "utf8");
  const json = JSON.parse(raw);

  const partial = PartialTopicManifestSchema.parse(json);
  const isDone = partial.state.stage === "done";

  if (isDone) {
    const full = TopicManifestSchema.parse(json);
    const drift = captionsScenesDrift(full.scenes, full.captions);
    if (drift) {
      console.error(`drift: ${drift}`);
      return 1;
    }
  }
  console.log(`ok: ${partial.slug} @ stage=${partial.state.stage}`);
  return 0;
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
