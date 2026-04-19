import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Spy-mode preserves real framer-motion behavior (AnimatePresence +
// motion.*), matching the pattern used by the voice / web-search /
// claude-design tile tests. Lets us query annotation labels by text
// without silencing transitions.
vi.mock("framer-motion", { spy: true });

import ClaudeChromeTile from "@/features/claude/tiles/chrome";
import { tiles } from "@/features/claude/registry";
import { tileBodies } from "@/features/claude/tiles";

describe("claude-for-chrome tile", () => {
  it("renders the tile H1 with the viTitle from the registry", () => {
    render(<ClaudeChromeTile />);
    expect(
      screen.getByRole("heading", { level: 1, name: /Claude for Chrome/ })
    ).toBeInTheDocument();
  });

  it("renders the one-liner grounding the tile in Claude for Chrome product facts", () => {
    render(<ClaudeChromeTile />);
    expect(
      screen.getByText(
        /Claude for Chrome là tiện ích mở rộng trình duyệt/
      )
    ).toBeInTheDocument();
  });

  it("renders the Chrome shell (not the Desktop or Labs shell) with the Vietnamese aria-label", () => {
    render(<ClaudeChromeTile />);
    expect(
      screen.getByRole("figure", {
        name: /Bản mô phỏng trình duyệt Chrome với Claude side panel/,
      })
    ).toBeInTheDocument();
    // Regression guards — this tile must not fall back to a different
    // shell primitive.
    expect(
      screen.queryByRole("figure", {
        name: /Bản mô phỏng giao diện Claude Desktop/,
      })
    ).toBeNull();
    expect(
      screen.queryByRole("figure", {
        name: /Bản mô phỏng giao diện Claude Labs/,
      })
    ).toBeNull();
  });

  it("renders the MockBadge by default (visible 'Mô phỏng' disclosure)", () => {
    render(<ClaudeChromeTile />);
    expect(screen.getAllByText("Mô phỏng").length).toBeGreaterThanOrEqual(1);
  });

  it("surfaces the 'Ask before acting' chip label — Anthropic's own product wording", () => {
    render(<ClaudeChromeTile />);
    // Appears at least in the side panel top bar; the "Cách nó hoạt
    // động" card adds a second instance. Either way, it must be present.
    expect(
      screen.getAllByText(/Ask before acting/).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("links ViewRealUI to the canonical Anthropic blog post", () => {
    render(<ClaudeChromeTile />);
    const link = screen.getByRole("link", {
      name: /Đọc thông báo Claude for Chrome từ Anthropic/,
    });
    expect(link).toHaveAttribute("href", "https://claude.com/blog/claude-for-chrome");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("surfaces the safety disclosure with the Anthropic prompt-injection warning", () => {
    render(<ClaudeChromeTile />);
    expect(
      screen.getAllByText(
        /significantly increases prompt injection risk/
      ).length
    ).toBeGreaterThanOrEqual(1);
    // Always-required actions must be listed so readers know the
    // safety floor.
    expect(screen.getByText(/Mua hàng hoặc giao dịch tài chính/)).toBeInTheDocument();
    expect(screen.getByText(/Xoá file hoặc dữ liệu vĩnh viễn/)).toBeInTheDocument();
  });

  it("renders the Chrome Web Store install link as an external anchor", () => {
    render(<ClaudeChromeTile />);
    const storeLink = screen.getByRole("link", {
      name: /Cài Claude for Chrome từ Web Store/,
    });
    expect(storeLink.getAttribute("href")).toContain(
      "chromewebstore.google.com/detail/claude"
    );
    expect(storeLink).toHaveAttribute("target", "_blank");
    expect(storeLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});

describe("claude-for-chrome — registry + tileBodies wiring", () => {
  it("registry has chrome tile flipped to status ready", () => {
    const chrome = tiles.find((t) => t.slug === "chrome");
    expect(chrome?.status).toBe("ready");
  });

  it("tileBodies.chrome is registered so the dispatcher resolves it", () => {
    expect(tileBodies.chrome).toBeDefined();
  });
});
