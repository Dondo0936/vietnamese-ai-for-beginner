import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Spy-mode preserves the real framer-motion behavior (AnimatePresence +
// motion.*), same pattern as files-vision and voice tile tests. Lets us
// query annotation labels by text without pulling in a mock that
// silences transitions.
vi.mock("framer-motion", { spy: true });

import WebSearchTile from "@/features/claude/tiles/web-search";

describe("web-search tile", () => {
  it("renders the one-sentence Vietnamese answer", () => {
    render(<WebSearchTile />);
    expect(
      screen.getByText(
        /Claude tự tra cứu thông tin mới trên web khi câu hỏi yêu cầu dữ liệu cập nhật/
      )
    ).toBeInTheDocument();
  });

  it("renders the hero demo with the mock-badge visible (shell default)", () => {
    render(<WebSearchTile />);
    expect(screen.getAllByText("Mô phỏng").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("figure", {
        name: /Bản mô phỏng giao diện Claude Desktop/,
      }).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders the ViewRealUI external anchor pointing to the canonical support article (slug 10684626)", () => {
    render(<WebSearchTile />);
    const link = screen.getByRole("link", {
      name: /Xem hướng dẫn Web Search từ Anthropic/,
    });
    const href = link.getAttribute("href") ?? "";
    // Pin both the slug id and the full canonical URL so a silent URL
    // change in Anthropic's help-center routing is caught immediately.
    expect(href).toContain("10684626");
    expect(href).toBe(
      "https://support.claude.com/en/articles/10684626-enabling-and-using-web-search"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders all 3 CropCards under 'Cách nó hoạt động'", () => {
    render(<WebSearchTile />);
    expect(
      screen.getByRole("heading", { name: /Cách nó hoạt động/ })
    ).toBeInTheDocument();
    expect(screen.getByText("Khi nào Claude tra web")).toBeInTheDocument();
    expect(screen.getByText("Trích dẫn có số thứ tự")).toBeInTheDocument();
    expect(
      screen.getByText("Thẻ nguồn mở được ra tận trang gốc")
    ).toBeInTheDocument();
  });

  it("renders the plan-availability note covering Free/Pro/Max + Team/Enterprise admin gating", () => {
    render(<WebSearchTile />);
    // Multiple role=note nodes exist on the page (MockBadge etc.); find
    // the one whose text starts with the plan-availability framing.
    const notes = screen.getAllByRole("note");
    const planNote = notes.find((n) =>
      /Web Search có trên cả bốn gói cá nhân/.test(n.textContent ?? "")
    );
    expect(planNote).toBeDefined();
    const text = planNote?.textContent ?? "";
    // Individual-plan coverage from claude.com/pricing table.
    expect(text).toMatch(/Free/);
    expect(text).toMatch(/Pro/);
    expect(text).toMatch(/Max 5x/);
    expect(text).toMatch(/Max 20x/);
    // Team/Enterprise admin-enablement phrasing from the help-center article.
    expect(text).toMatch(/Team/);
    expect(text).toMatch(/Enterprise/);
    expect(text).toMatch(/Owner/);
  });

  it("renders the DeepLinkCTA with the freshness-sensitive Vietnamese prompt", () => {
    render(<WebSearchTile />);
    const cta = screen.getByRole("link", { name: /Thử trong Claude/i });
    const href = cta.getAttribute("href") ?? "";
    expect(href.startsWith("https://claude.ai/new?q=")).toBe(true);
    const q = decodeURIComponent(href.replace("https://claude.ai/new?q=", ""));
    expect(q).toBe(
      "Tóm tắt 3 tin công nghệ lớn nhất tuần này ở Việt Nam — mỗi tin một đoạn 2-3 câu kèm nguồn."
    );
  });

  it("renders at least one inline [N] citation marker inside Claude's reply", () => {
    // Bonus assertion from the task brief — guards against a regression
    // where citation rendering gets flattened back into plain text and
    // loses its DOM hook.
    render(<WebSearchTile />);
    const markers = document.querySelectorAll("sup[data-citation]");
    expect(markers.length).toBeGreaterThan(0);
    // A specific marker — [1] should be emitted somewhere (the GDP stat
    // row uses cite=1).
    const marker1 = document.querySelector('sup[data-citation="1"]');
    expect(marker1).not.toBeNull();
    expect(marker1?.textContent).toBe("[1]");
  });

  it("cross-links to ready tiles only (chat, files-vision, artifacts), never planned ones", () => {
    render(<WebSearchTile />);
    const chatLink = screen.getByRole("link", {
      name: /Chat \+ phản hồi trực tiếp/,
    });
    expect(chatLink).toHaveAttribute("href", "/claude/chat");
    const filesLink = screen.getByRole("link", {
      name: /Files & Vision/,
    });
    expect(filesLink).toHaveAttribute("href", "/claude/files-vision");
    const artifactsLink = screen.getByRole("link", {
      name: /^Artifacts Sau khi tra cứu xong/,
    });
    expect(artifactsLink).toHaveAttribute("href", "/claude/artifacts");

    // Sanity: no cross-link to a still-planned tile (e.g. thinking).
    expect(
      screen.queryByRole("link", { name: /Extended thinking/ })
    ).not.toBeInTheDocument();
  });
});
