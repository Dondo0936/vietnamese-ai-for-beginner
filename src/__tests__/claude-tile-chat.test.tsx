import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("framer-motion", { spy: true });

import ChatTile, {
  streamedSubstring,
  isStreaming,
} from "@/features/claude/tiles/chat";

describe("chat tile", () => {
  it("renders the tile H1 with the viTitle from the registry", () => {
    render(<ChatTile />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Chat \+ phản hồi trực tiếp/ })
    ).toBeInTheDocument();
  });

  it("renders a DemoCanvas region with the tile title", () => {
    render(<ChatTile />);
    expect(
      screen.getByRole("region", { name: /Chat \+ phản hồi trực tiếp/i })
    ).toBeInTheDocument();
  });

  it("renders at least one ClaudeDesktopShell via its figure role", () => {
    render(<ChatTile />);
    const shells = screen.getAllByRole("figure", {
      name: /Bản mô phỏng giao diện Claude Desktop/,
    });
    expect(shells.length).toBeGreaterThanOrEqual(1); // hero demo + still frames
  });

  it("renders a DeepLinkCTA pointing to claude.ai/new with an encoded prompt", () => {
    render(<ChatTile />);
    const cta = screen.getByRole("link", { name: /Thử trong Claude/i });
    expect(cta.getAttribute("href")).toMatch(/^https:\/\/claude\.ai\/new\?q=/);
  });

  it("renders cross-links to sibling tiles", () => {
    render(<ChatTile />);
    const crossLinks = screen
      .getAllByRole("link")
      .filter((l) => (l.getAttribute("href") ?? "").startsWith("/claude/"));
    expect(crossLinks.length).toBeGreaterThanOrEqual(2);
  });
});

describe("chat tile — boundary math", () => {
  it("streamedSubstring is empty at or before STREAM_START (0.05)", () => {
    expect(streamedSubstring(0.0)).toBe("");
    expect(streamedSubstring(0.04)).toBe("");
    expect(streamedSubstring(0.05)).toBe("");
  });

  it("streamedSubstring is full at or after STREAM_END (0.85)", () => {
    const full = streamedSubstring(1.0);
    expect(streamedSubstring(0.85)).toBe(full);
    expect(streamedSubstring(0.9)).toBe(full);
    expect(full.length).toBeGreaterThan(100); // sanity — full text is ~200 chars
  });

  it("streamedSubstring grows monotonically inside the stream window", () => {
    const a = streamedSubstring(0.2).length;
    const b = streamedSubstring(0.5).length;
    const c = streamedSubstring(0.8).length;
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });

  it("isStreaming toggles at the window edges", () => {
    expect(isStreaming(0.0)).toBe(false);
    expect(isStreaming(0.05)).toBe(false); // boundary is exclusive
    expect(isStreaming(0.5)).toBe(true);
    expect(isStreaming(0.85)).toBe(false); // boundary is exclusive
    expect(isStreaming(1.0)).toBe(false);
  });
});
