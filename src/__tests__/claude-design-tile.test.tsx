import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Spy-mode preserves real framer-motion behavior (AnimatePresence +
// motion.*), matching voice / web-search tile test patterns. Lets us
// query annotation labels by text without silencing transitions.
vi.mock("framer-motion", { spy: true });

import ClaudeDesignTile from "@/features/claude/tiles/claude-design";

describe("claude-design tile", () => {
  it("renders the one-sentence Vietnamese answer grounding the Labs framing", () => {
    render(<ClaudeDesignTile />);
    expect(
      screen.getByText(
        /Claude Design \(Anthropic Labs, research preview\) cho bạn mô tả bằng lời/
      )
    ).toBeInTheDocument();
  });

  it("renders the hero demo inside a ClaudeLabsShell (not ClaudeDesktopShell)", () => {
    render(<ClaudeDesignTile />);
    // Labs-shell aria-label is "Bản mô phỏng giao diện Claude Labs".
    // Guards against silently dropping back to the Desktop shell.
    expect(
      screen.getAllByRole("figure", {
        name: /Bản mô phỏng giao diện Claude Labs/,
      }).length
    ).toBeGreaterThanOrEqual(1);
    // No Claude Desktop shell should appear on this tile.
    expect(
      screen.queryByRole("figure", {
        name: /Bản mô phỏng giao diện Claude Desktop/,
      })
    ).toBeNull();
    // Mock badge must be visible (shell default).
    expect(screen.getAllByText("Mô phỏng").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the 'Research preview' chip — Anthropic's terminology, never 'Labs · Beta'", () => {
    render(<ClaudeDesignTile />);
    // Positive assertion — tile must surface "Research preview" in the
    // Labs top bar, matching the wording of Anthropic's announcement.
    expect(screen.getAllByText(/Research preview/).length).toBeGreaterThanOrEqual(1);
    // Regression guard — the chip must not drift back to "Labs · Beta"
    // or any variant using "Beta", since Anthropic's post never uses
    // that framing for Claude Design.
    expect(screen.queryByText(/Labs\s*·\s*Beta/)).toBeNull();
    expect(screen.queryByText(/\bBeta\b/)).toBeNull();
  });

  it("renders the illustrative slider-values caption disclosing the values aren't fixed ranges", () => {
    render(<ClaudeDesignTile />);
    expect(
      screen.getByText(
        /Giá trị minh hoạ — Claude sinh thanh trượt tuỳ ngữ cảnh thiết kế/
      )
    ).toBeInTheDocument();
  });

  it("renders the canvas-language disclosure explaining the English on-canvas labels", () => {
    render(<ClaudeDesignTile />);
    expect(
      screen.getByText(
        /Nội dung canvas hiển thị tiếng Anh — Claude Design hiện sinh ra/
      )
    ).toBeInTheDocument();
  });

  it("links ViewRealUI to the canonical Anthropic announcement post", () => {
    render(<ClaudeDesignTile />);
    const link = screen.getByRole("link", {
      name: /Đọc thông báo Claude Design từ Anthropic Labs/,
    });
    const href = link.getAttribute("href") ?? "";
    expect(href).toBe(
      "https://www.anthropic.com/news/claude-design-anthropic-labs"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders all 3 CropCards under 'Cách nó hoạt động' — describe, refine, export", () => {
    render(<ClaudeDesignTile />);
    expect(
      screen.getByRole("heading", { name: /Cách nó hoạt động/ })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Bước 1 — Mô tả, Claude dựng bản đầu/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Bước 2 — Tinh chỉnh qua chat, comment, slider/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Bước 3 — Xuất, chia sẻ, chuyển giao/)
    ).toBeInTheDocument();
  });

  it("renders the plan-availability note covering Pro/Max/Team/Enterprise, research-preview framing, Opus 4.7, and claude.ai/design", () => {
    render(<ClaudeDesignTile />);
    const notes = screen.getAllByRole("note");
    const planNote = notes.find((n) =>
      /Claude Design ra mắt ngày 17\/4\/2026/.test(n.textContent ?? "")
    );
    expect(planNote).toBeDefined();
    const text = planNote?.textContent ?? "";
    // Plan coverage from the announcement post.
    expect(text).toMatch(/Pro/);
    expect(text).toMatch(/Max/);
    expect(text).toMatch(/Team/);
    expect(text).toMatch(/Enterprise/);
    // Research-preview framing is load-bearing — tile must be honest
    // that the product is experimental.
    expect(text).toMatch(/research preview/);
    // Opus 4.7 — the model that powers it.
    expect(text).toMatch(/Opus 4\.7/);
    // The product URL — must be present so readers know where to go.
    expect(text).toMatch(/claude\.ai\/design/);
    // Enterprise-off-by-default is a concrete fact worth pinning.
    expect(text).toMatch(/admin/);
  });

  it("renders the DeepLinkCTA with the Vietnamese design prompt that exercises the feature (3-slide pitch)", () => {
    render(<ClaudeDesignTile />);
    const cta = screen.getByRole("link", { name: /Thử trong Claude/i });
    const href = cta.getAttribute("href") ?? "";
    expect(href.startsWith("https://claude.ai/new?q=")).toBe(true);
    const q = decodeURIComponent(href.replace("https://claude.ai/new?q=", ""));
    // Prompt must actually ask for multi-slide design output, not a
    // generic text question — otherwise it doesn't exercise Claude
    // Design at all.
    expect(q).toMatch(/3 slide pitch/);
    expect(q).toMatch(/AI dạy tiếng Việt/);
  });

  it("cross-links to ready tiles only (artifacts, chat, files-vision), never planned ones", () => {
    render(<ClaudeDesignTile />);
    // Artifacts — the strong conceptual parent.
    const artifactsLink = screen.getByRole("link", {
      name: /^Artifacts Artifacts là khung xem-bên-trong-chat/,
    });
    expect(artifactsLink).toHaveAttribute("href", "/claude/artifacts");
    // Chat — streaming shares the chat pane model.
    const chatLink = screen.getByRole("link", {
      name: /Chat \+ phản hồi trực tiếp/,
    });
    expect(chatLink).toHaveAttribute("href", "/claude/chat");
    // Files & Vision — vision-model cousin.
    const filesLink = screen.getByRole("link", {
      name: /Files & Vision/,
    });
    expect(filesLink).toHaveAttribute("href", "/claude/files-vision");

    // Sanity: no cross-link to a still-planned tile (e.g. skills, chrome).
    expect(
      screen.queryByRole("link", { name: /Claude for Chrome/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Skills/ })
    ).not.toBeInTheDocument();
  });
});
