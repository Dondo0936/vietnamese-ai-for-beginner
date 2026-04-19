#!/usr/bin/env node
/**
 * Walk each path's stages left→right and bump any slug whose difficulty
 * is *lower* than its predecessor's up to match it. Preserves the
 * concept→application pattern: application topics cannot be easier than
 * the concept they apply.
 *
 * This script edits the TOPIC FILE's `metadata` export (source of truth
 * per Contract §1), and `scripts/sync-registry.mjs` must be re-run
 * afterwards to propagate the change into registry.ts.
 *
 * Run:
 *   node scripts/fix-difficulty-monotonicity.mjs
 *   node scripts/sync-registry.mjs
 *
 * Then re-run `npm test -- contracts` to verify all 4 path tests green.
 *
 * Enforced by `docs/CONTRACTS.md` §2 + `src/__tests__/contracts.test.ts`.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const TOPICS_DIR = path.join(ROOT, "src", "topics");
const PATHS_PATH = path.join(ROOT, "src", "lib", "paths.ts");

const RANK = { beginner: 1, intermediate: 2, advanced: 3 };
const LABEL = { 1: "beginner", 2: "intermediate", 3: "advanced" };

function parseStages(pathsSource) {
  const paths = {};
  const stageBlockRe = /const\s+([A-Z_]+)_STAGES\s*:\s*Stage\[\]\s*=\s*\[([\s\S]*?)\n\];/g;
  let m;
  while ((m = stageBlockRe.exec(pathsSource)) !== null) {
    const name = m[1];
    const body = m[2];
    const stages = [];
    const stageRe = /\{\s*title:\s*"([^"]+)",\s*slugs:\s*\[([\s\S]*?)\]\s*,?\s*\}/g;
    let sm;
    while ((sm = stageRe.exec(body)) !== null) {
      const title = sm[1];
      const slugsText = sm[2];
      const slugMatches = slugsText.match(/"([^"]+)"/g) ?? [];
      const slugs = slugMatches.map((s) => s.slice(1, -1));
      stages.push({ title, slugs });
    }
    paths[name] = stages;
  }
  return paths;
}

function findMetadataBlock(topicSource) {
  const startIdx = topicSource.search(/export\s+const\s+metadata\s*:\s*TopicMeta\s*=\s*\{/);
  if (startIdx === -1) return null;
  const openBraceIdx = topicSource.indexOf("{", startIdx);
  let depth = 0;
  let endIdx = openBraceIdx;
  for (let i = openBraceIdx; i < topicSource.length; i++) {
    const ch = topicSource[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }
  return { start: openBraceIdx, end: endIdx };
}

function readDifficultyFromBlock(block) {
  const m = block.match(/\bdifficulty\s*:\s*"([^"]+)"/);
  return m ? m[1] : null;
}

function setDifficultyInBlock(block, newValue) {
  return block.replace(
    /\bdifficulty\s*:\s*"[^"]+"/,
    `difficulty: "${newValue}"`
  );
}

function readTopicDifficulty(slug) {
  const filePath = path.join(TOPICS_DIR, `${slug}.tsx`);
  if (!fs.existsSync(filePath)) return null;
  const source = fs.readFileSync(filePath, "utf8");
  const range = findMetadataBlock(source);
  if (!range) return null;
  return readDifficultyFromBlock(source.slice(range.start, range.end));
}

function bumpTopicDifficulty(slug, newValue) {
  const filePath = path.join(TOPICS_DIR, `${slug}.tsx`);
  const source = fs.readFileSync(filePath, "utf8");
  const range = findMetadataBlock(source);
  if (!range) return false;
  const block = source.slice(range.start, range.end);
  const updated =
    source.slice(0, range.start) +
    setDifficultyInBlock(block, newValue) +
    source.slice(range.end);
  fs.writeFileSync(filePath, updated, "utf8");
  return true;
}

function passOnce(stages) {
  const bumps = [];
  for (const [pathName, pathStages] of Object.entries(stages)) {
    for (const stage of pathStages) {
      let prevRank = 0;
      let prevSlug = null;
      for (const slug of stage.slugs) {
        const diff = readTopicDifficulty(slug);
        if (!diff) continue;
        let rank = RANK[diff];
        if (prevRank && rank < prevRank) {
          const bumpedDiff = LABEL[prevRank];
          if (bumpTopicDifficulty(slug, bumpedDiff)) {
            bumps.push({
              path: pathName,
              stage: stage.title,
              slug,
              from: diff,
              to: bumpedDiff,
              after: prevSlug,
            });
            rank = prevRank;
          }
        }
        prevRank = rank;
        prevSlug = slug;
      }
    }
  }
  return bumps;
}

function main() {
  const pathsSource = fs.readFileSync(PATHS_PATH, "utf8");
  const stages = parseStages(pathsSource);

  // Iterate to fixed point — a bump in path A can expose a regression in
  // path B that already processed (slugs are shared across paths).
  const allBumps = [];
  for (let pass = 0; pass < 5; pass++) {
    const bumps = passOnce(stages);
    if (bumps.length === 0) break;
    allBumps.push(...bumps);
  }

  console.log(`✓ Bumped ${allBumps.length} topic-file difficulty entries`);
  for (const b of allBumps) {
    console.log(
      `  - [${b.path}/${b.stage}] ${b.slug}: ${b.from} → ${b.to} (after ${b.after})`
    );
  }
  if (allBumps.length) {
    console.log(
      "\nNow run `node scripts/sync-registry.mjs` to propagate into registry.ts."
    );
  }
}

main();
