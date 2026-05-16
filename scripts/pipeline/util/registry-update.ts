/**
 * Prepend an `ArticleMeta` entry to `src/articles/registry.ts`'s
 * `articleList`. Idempotent: if the slug already exists, the file is
 * untouched and the function returns false.
 *
 * String-based mutation, NOT AST. The registry is plain JS object
 * literals; same approach as scripts/sync-registry.mjs which has been
 * stable across 100+ topics. Adding a structured parser is overkill for
 * one-entry inserts.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";

import type { ArticleMeta } from "../../../src/lib/article-types";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const DEFAULT_REGISTRY_PATH = path.join(REPO_ROOT, "src", "articles", "registry.ts");

export function articleRegistryPath(): string {
  return process.env.UDEMI_PIPELINE_ARTICLE_REGISTRY ?? DEFAULT_REGISTRY_PATH;
}

/** Quote a string for embedding in TypeScript source as a double-quoted literal. */
function quote(s: string): string {
  return (
    '"' +
    s
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t") +
    '"'
  );
}

function formatStringArray(items: string[]): string {
  if (items.length === 0) return "[]";
  return "[\n" + items.map((i) => `      ${quote(i)},`).join("\n") + "\n    ]";
}

/** Render an ArticleMeta as a TS object literal matching the project's style. */
export function renderEntry(meta: ArticleMeta): string {
  const lines: string[] = ["  {"];
  lines.push(`    slug: ${quote(meta.slug)},`);
  lines.push(`    title: ${quote(meta.title)},`);
  lines.push(`    dek: ${quote(meta.dek)},`);
  lines.push(`    source: {`);
  lines.push(`      name: ${quote(meta.source.name)},`);
  lines.push(`      host: ${quote(meta.source.host)},`);
  if (meta.source.url) {
    lines.push(`      url: ${quote(meta.source.url)},`);
  }
  lines.push(`    },`);
  lines.push(`    date: ${quote(meta.date)},`);
  lines.push(`    readingTime: ${quote(meta.readingTime)},`);
  lines.push(`    category: ${quote(meta.category)},`);
  if (meta.tag) lines.push(`    tag: ${quote(meta.tag)},`);
  lines.push(`    lessonRefs: ${formatStringArray(meta.lessonRefs)},`);
  if (meta.relatedArticles && meta.relatedArticles.length > 0) {
    lines.push(`    relatedArticles: ${formatStringArray(meta.relatedArticles)},`);
  }
  if (meta.heroViz) lines.push(`    heroViz: ${quote(meta.heroViz)},`);
  if (meta.isLead) lines.push(`    isLead: true,`);
  lines.push("  },");
  return lines.join("\n");
}

/** Has this slug already been registered? */
export function alreadyRegistered(source: string, slug: string): boolean {
  return source.includes(`slug: ${quote(slug)},`);
}

/**
 * Prepend an entry to articleList. Returns the new source. Throws if the
 * `articleList` opening cannot be located.
 */
export function prependEntry(source: string, meta: ArticleMeta): string {
  const marker = "export const articleList: ArticleMeta[] = [";
  const idx = source.indexOf(marker);
  if (idx === -1) {
    throw new Error(`could not find "${marker}" in registry source`);
  }
  const insertAt = idx + marker.length;
  const entry = renderEntry(meta);
  return source.slice(0, insertAt) + "\n" + entry + source.slice(insertAt);
}

export interface PrependResult {
  /** True if the file was written. False if the slug was already present. */
  changed: boolean;
}

export async function prependArticleEntry(meta: ArticleMeta): Promise<PrependResult> {
  const filePath = articleRegistryPath();
  const source = await fs.readFile(filePath, "utf8");
  if (alreadyRegistered(source, meta.slug)) {
    return { changed: false };
  }
  const next = prependEntry(source, meta);
  await fs.writeFile(filePath, next, "utf8");
  return { changed: true };
}
