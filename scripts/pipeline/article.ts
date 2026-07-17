#!/usr/bin/env node
/**
 * Article stage — ingests the JSON bundle emitted by the udemi-article
 * subagent, writes the TSX files, prepends the meta entry to the article
 * registry, and advances the manifest stage.
 *
 * Usage:
 *   pnpm pipeline:article <slug> --from-file=<path-to-article.json>
 *
 * Payload shape (mirrors agents/udemi-article.md):
 *   { slug, meta: ArticleMeta, tsx: { vn: string, en: string } }
 *
 * Side effects on success:
 *   - writes src/articles/<slug>.tsx
 *   - writes src/articles/<slug>.en.tsx
 *   - prepends meta to articleList in src/articles/registry.ts
 *   - advances manifest state.stage to "script"
 *
 * Exit codes:
 *   0  ok
 *   1  validation, parity, or I/O error (message on stderr)
 *   2  bad usage
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { z } from "zod";

import {
  manifestExists,
  readManifest,
  writeManifest,
} from "./util/manifest-store";
import {
  alreadyRegistered,
  articleRegistryPath,
  prependEntry,
} from "./util/registry-update";

const REPO_ROOT = path.resolve(__dirname, "..", "..");

/**
 * Articles directory. Tests override via UDEMI_PIPELINE_ARTICLES_DIR so
 * they don't pollute src/articles.
 */
export function articlesDir(): string {
  return (
    process.env.UDEMI_PIPELINE_ARTICLES_DIR ??
    path.join(REPO_ROOT, "src", "articles")
  );
}

/** Inline of ArticleMeta — kept loose; the real type is in src/lib/article-types.ts. */
const ArticleSourceSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  url: z.string().url().optional(),
});
const ArticleMetaSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).refine((s) => !s.includes("—"), {
    message: "VN article title must not contain an em-dash (—)",
  }),
  dek: z.string().min(1).refine((s) => !s.includes("—"), {
    message: "VN article dek must not contain an em-dash (—)",
  }),
  source: ArticleSourceSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  readingTime: z.string().min(1),
  category: z.enum([
    "model", "paper", "open", "agent", "infra", "report", "tool", "vietnam",
  ]),
  tag: z.string().optional(),
  lessonRefs: z.array(z.string()).default([]),
  relatedArticles: z.array(z.string()).optional(),
  heroViz: z.string().nullable().optional().transform((v) => v ?? undefined),
  isLead: z.boolean().optional(),
});
const ArticlePayloadSchema = z.object({
  slug: z.string(),
  meta: ArticleMetaSchema,
  tsx: z.object({
    vn: z.string().refine((s) => !s.includes("—"), {
      message: "VN article TSX must not contain an em-dash (—)",
    }),
    en: z.string().min(1),
  }),
});
export type ArticlePayload = z.infer<typeof ArticlePayloadSchema>;

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

export async function ingestArticle(
  slug: string,
  payload: ArticlePayload,
  now = new Date(),
): Promise<void> {
  // Validate up front so direct callers (tests, other scripts) get the
  // same em-dash + shape guarantees the CLI gets.
  const validated = ArticlePayloadSchema.parse(payload);
  if (validated.slug !== slug) {
    throw new Error(`payload slug "${validated.slug}" does not match CLI slug "${slug}"`);
  }
  if (validated.meta.slug !== slug) {
    throw new Error(`payload meta.slug "${validated.meta.slug}" does not match CLI slug "${slug}"`);
  }
  payload = validated;
  if (!(await manifestExists(slug))) {
    throw new Error(
      `manifest for "${slug}" not found — run pipeline:research first`,
    );
  }
  const m = await readManifest(slug);
  if (!m.research) {
    throw new Error(`manifest for "${slug}" is missing research — run pipeline:research first`);
  }

  // Write the two TSX files.
  const dir = articlesDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${slug}.tsx`), payload.tsx.vn, "utf8");
  await fs.writeFile(path.join(dir, `${slug}.en.tsx`), payload.tsx.en, "utf8");

  // Prepend the meta entry to articleList (idempotent).
  const registryPath = articleRegistryPath();
  const source = await fs.readFile(registryPath, "utf8");
  if (!alreadyRegistered(source, slug)) {
    const next = prependEntry(source, payload.meta);
    await fs.writeFile(registryPath, next, "utf8");
  }

  // Advance manifest stage.
  await writeManifest({
    ...m,
    state: { stage: "script", updatedAt: now.toISOString(), published: false },
  });
}

export async function main(argv: string[]): Promise<number> {
  const parsed = parseArgs(argv);
  if ("usageError" in parsed) {
    console.error(`usage: pipeline:article <slug> --from-file=<path>`);
    console.error(parsed.usageError);
    return 2;
  }
  if (!parsed.fromFile) {
    console.error("pipeline:article currently requires --from-file (L1).");
    return 2;
  }

  const raw = await fs.readFile(parsed.fromFile, "utf8");
  const json = JSON.parse(raw);
  const payload = ArticlePayloadSchema.parse(json);

  await ingestArticle(parsed.slug, payload);
  console.log(`ok: ${parsed.slug} @ stage=script (wrote ${parsed.slug}.tsx + ${parsed.slug}.en.tsx)`);
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
