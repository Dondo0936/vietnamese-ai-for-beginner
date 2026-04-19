#!/usr/bin/env node
/**
 * Sync `src/topics/registry.ts` from each topic file's `metadata` export.
 *
 * Registry is the source of truth for HTML `<title>` and Open Graph (see
 * `src/app/topics/[slug]/page.tsx`). When topic authors update `titleVi`
 * or `description` inside a topic .tsx file, those changes must flow into
 * registry.ts or SEO surfaces will serve stale copy.
 *
 * Run:
 *   node scripts/sync-registry.mjs
 *
 * Then re-run `npm test -- contracts` to verify parity.
 *
 * Enforced by `docs/CONTRACTS.md` §1 + `src/__tests__/contracts.test.ts`.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const TOPICS_DIR = path.join(ROOT, "src", "topics");
const REGISTRY_PATH = path.join(TOPICS_DIR, "registry.ts");
const NON_TOPIC_FILES = new Set(["topic-loader.tsx", "registry.ts"]);

function parseTopicMetadata(source) {
  const startIdx = source.search(/export\s+const\s+metadata\s*:\s*TopicMeta\s*=\s*\{/);
  if (startIdx === -1) return null;

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

  const readStringField = (name) => {
    const keyRe = new RegExp(`\\b${name}\\s*:\\s*`);
    const keyMatch = block.match(keyRe);
    if (!keyMatch) return undefined;
    const startAt = (keyMatch.index ?? 0) + keyMatch[0].length;
    const tail = block.slice(startAt);

    let i = 0;
    const parts = [];
    while (i < tail.length) {
      while (i < tail.length && /[\s+]/.test(tail[i])) i++;
      if (tail[i] !== '"') break;
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
      i++;
      parts.push(buf);
    }
    return parts.length ? parts.join("") : undefined;
  };

  return {
    titleVi: readStringField("titleVi"),
    description: readStringField("description"),
    difficulty: readStringField("difficulty"),
    category: readStringField("category"),
  };
}

/**
 * Escape a JavaScript string literal for source output.
 * Returns the quoted form, e.g. `"Hello \"world\""`.
 */
function quote(str) {
  return (
    '"' +
    str
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\t/g, "\\t") +
    '"'
  );
}

function findSlugBlock(registrySource, slug) {
  // Match the registry entry object that starts with `slug: "<slug>",`
  // and walk to the matching closing brace.
  const slugLiteral = `slug: "${slug}",`;
  const slugIdx = registrySource.indexOf(slugLiteral);
  if (slugIdx === -1) return null;

  // Walk backward to the opening brace of this object.
  let openIdx = slugIdx;
  while (openIdx > 0 && registrySource[openIdx] !== "{") openIdx--;
  if (registrySource[openIdx] !== "{") return null;

  // Walk forward from the opening brace to find the matching close.
  let depth = 0;
  let closeIdx = openIdx;
  for (let i = openIdx; i < registrySource.length; i++) {
    const ch = registrySource[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        closeIdx = i + 1;
        break;
      }
    }
  }
  return { start: openIdx, end: closeIdx };
}

function replaceField(block, name, newValue) {
  // Find `    <name>: "..."` (possibly multi-line "a" + "b") followed by a
  // comma OR end-of-line, and replace the value portion. Preserves the
  // leading whitespace and trailing comma.
  const keyRe = new RegExp(`(\\n?\\s*${name}\\s*:\\s*)`);
  const keyMatch = block.match(keyRe);
  if (!keyMatch) return block; // field not present — skip

  const keyStart = keyMatch.index;
  const afterKey = keyStart + keyMatch[0].length;

  // Walk from afterKey to find end of the string-literal run (possibly
  // "a" + "b") ending at the comma.
  let i = afterKey;
  while (i < block.length) {
    while (i < block.length && /[\s+]/.test(block[i])) i++;
    if (block[i] !== '"') break;
    i++;
    while (i < block.length && block[i] !== '"') {
      if (block[i] === "\\" && i + 1 < block.length) i += 2;
      else i++;
    }
    i++;
  }
  // i now points past the last closing quote. Don't include trailing comma.
  const before = block.slice(0, keyStart) + keyMatch[0] + quote(newValue);
  const after = block.slice(i);
  return before + after;
}

function main() {
  const registrySource = fs.readFileSync(REGISTRY_PATH, "utf8");
  let updated = registrySource;

  const topicFiles = fs
    .readdirSync(TOPICS_DIR)
    .filter(
      (f) => f.endsWith(".tsx") && !f.startsWith("_") && !NON_TOPIC_FILES.has(f)
    );

  let syncedCount = 0;
  const missing = [];

  for (const file of topicFiles) {
    const slug = file.replace(/\.tsx$/, "");
    const topicSource = fs.readFileSync(path.join(TOPICS_DIR, file), "utf8");
    const meta = parseTopicMetadata(topicSource);
    if (!meta) {
      missing.push({ slug, reason: "no metadata export" });
      continue;
    }

    const range = findSlugBlock(updated, slug);
    if (!range) {
      missing.push({ slug, reason: "no registry entry" });
      continue;
    }

    let block = updated.slice(range.start, range.end);
    const original = block;

    if (meta.titleVi !== undefined) {
      block = replaceField(block, "titleVi", meta.titleVi);
    }
    if (meta.description !== undefined) {
      block = replaceField(block, "description", meta.description);
    }
    if (meta.difficulty !== undefined) {
      block = replaceField(block, "difficulty", meta.difficulty);
    }
    if (meta.category !== undefined) {
      block = replaceField(block, "category", meta.category);
    }

    if (block !== original) {
      updated = updated.slice(0, range.start) + block + updated.slice(range.end);
      syncedCount++;
    }
  }

  if (updated !== registrySource) {
    fs.writeFileSync(REGISTRY_PATH, updated, "utf8");
  }

  console.log(`✓ Synced ${syncedCount} entries from topic files → registry.ts`);
  if (missing.length) {
    console.log("⚠ Skipped:");
    for (const m of missing) {
      console.log(`  - ${m.slug}: ${m.reason}`);
    }
  }
}

main();
