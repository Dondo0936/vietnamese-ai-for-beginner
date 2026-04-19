/**
 * Skip-link contract — punchlist item #11.
 *
 * The skip-link is declared in `src/app/layout.tsx` as
 * `<a href="#main-content">Bỏ qua đến nội dung chính</a>`.
 * This test asserts:
 * - The anchor is present in the layout source as a first-focus target.
 * - The matching `#main-content` id is applied to the main region in
 *   AppShell.
 *
 * A full focus-flow test (Tab → Enter → subsequent Tab lands inside
 * main-content) requires a real browser and is handled by manual QA. This
 * test locks the static contract so App Router re-mounts don't silently
 * drop the anchor or the id.
 */

import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Contract: skip-link wires to #main-content", () => {
  it("root layout renders an anchor whose href is #main-content", () => {
    const layout = fs.readFileSync(
      path.resolve(__dirname, "..", "app", "layout.tsx"),
      "utf8"
    );
    expect(layout).toMatch(/href=["']#main-content["']/);
    expect(layout).toMatch(/sr-only[^"]*focus:not-sr-only/);
    expect(layout).toMatch(/Bỏ qua đến nội dung chính/);
  });

  it("AppShell renders a <main> region with id=main-content", () => {
    const shell = fs.readFileSync(
      path.resolve(__dirname, "..", "components", "layout", "AppShell.tsx"),
      "utf8"
    );
    expect(shell).toMatch(/<main[^>]+id=["']main-content["']/);
  });
});
