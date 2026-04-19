#!/usr/bin/env node
/**
 * Raise SVG label fontSize values below 11 up to 11 (user units).
 *
 * Motivation: `fontSize="9"` / `"10"` become illegible when an SVG with a
 * wide viewBox is rendered on a 360px phone (physical size drops below
 * 7px). A simple bump improves legibility with minimal visual impact on
 * desktop.
 *
 * This is a safe, reversible codemod. For a full migration to
 * responsive-sized labels (em-based or vw-based), see `docs/CONTRACTS.md`
 * §4.6.
 *
 * Run:
 *   node scripts/raise-svg-fontsize.mjs
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const TOPICS_DIR = path.join(ROOT, "src", "topics");
const MIN_SIZE = 11;
const SKIP_FILES = new Set(["topic-loader.tsx", "registry.ts"]);

function raiseInSource(src) {
  let changes = 0;
  const updated = src.replace(
    /fontSize\s*=\s*(?:"(\d+)"|\{(\d+)\})/g,
    (match, strVal, braceVal) => {
      const raw = strVal ?? braceVal;
      const n = parseInt(raw, 10);
      if (Number.isNaN(n) || n >= MIN_SIZE) return match;
      changes++;
      return strVal !== undefined ? `fontSize="${MIN_SIZE}"` : `fontSize={${MIN_SIZE}}`;
    }
  );
  return { updated, changes };
}

function main() {
  const files = fs
    .readdirSync(TOPICS_DIR)
    .filter((f) => f.endsWith(".tsx") && !SKIP_FILES.has(f));
  let totalChanges = 0;
  const touched = [];
  for (const f of files) {
    const full = path.join(TOPICS_DIR, f);
    const src = fs.readFileSync(full, "utf8");
    const { updated, changes } = raiseInSource(src);
    if (changes > 0) {
      fs.writeFileSync(full, updated, "utf8");
      totalChanges += changes;
      touched.push({ file: f, changes });
    }
  }
  console.log(`✓ Raised ${totalChanges} fontSize values (<${MIN_SIZE} → ${MIN_SIZE})`);
  for (const t of touched) {
    console.log(`  - ${t.file}: ${t.changes}`);
  }
}

main();
