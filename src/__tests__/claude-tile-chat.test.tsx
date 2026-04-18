import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("framer-motion", { spy: true });

import ChatTile from "@/features/claude/tiles/chat";

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
