import { describe, it, expect } from "vitest";
import { tiles, shelves, SHELF_ORDER } from "@/features/claude/registry";

describe("claude registry", () => {
  it("has exactly 24 tiles", () => {
    expect(tiles).toHaveLength(24);
  });

  it("assigns 8 tiles to each of the 3 shelves", () => {
    const counts = SHELF_ORDER.map(
      (s) => tiles.filter((t) => t.shelf === s).length
    );
    expect(counts).toEqual([8, 8, 8]);
  });

  it("has unique slugs", () => {
    const slugs = tiles.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("builds shelves map in SHELF_ORDER order", () => {
    expect(Object.keys(shelves)).toEqual([...SHELF_ORDER]);
    for (const key of SHELF_ORDER) {
      expect(shelves[key].tiles.length).toBe(8);
    }
  });

  it("tracks per-tile status through Phase 2 rollout", () => {
    // Phase 2 ships tiles one-by-one; keep this test as a live snapshot of
    // which tiles have flipped from "planned" → "ready" so the rollout is
    // visible in CI. Update this set as each tile ships.
    const ready = tiles.filter((t) => t.status === "ready").map((t) => t.slug);
    expect(ready).toEqual(["chat", "projects", "artifacts"]);
  });
});
