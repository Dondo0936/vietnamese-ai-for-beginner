import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("framer-motion", { spy: true });

import ProjectsTile from "@/features/claude/tiles/projects";

describe("projects tile", () => {
  it("renders the one-sentence Vietnamese answer", () => {
    render(<ProjectsTile />);
    expect(
      screen.getByText(
        /Projects là không gian làm việc riêng cho mỗi chủ đề — files và instructions gắn liền với project, dùng chung cho mọi chat bên trong\. \(Memory xuyên phiên có trên gói Pro trở lên\.\)/
      )
    ).toBeInTheDocument();
  });

  it("renders the plan-availability note disclosure", () => {
    render(<ProjectsTile />);
    expect(
      screen.getByText(/Free tối đa 5 projects/)
    ).toBeInTheDocument();
  });

  it("renders the hero demo with the mock-badge visible (shell default)", () => {
    render(<ProjectsTile />);
    // MockBadge text is emitted by ClaudeDesktopShell when showMockBadge
    // defaults to true — pairs with the ViewRealUI disclosure below.
    expect(screen.getAllByText("Mô phỏng").length).toBeGreaterThanOrEqual(1);
    // Hero demo figure is the simulated shell.
    expect(
      screen.getAllByRole("figure", {
        name: /Bản mô phỏng giao diện Claude Desktop/,
      }).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders the ViewRealUI external anchor with the Anthropic Projects href", () => {
    render(<ProjectsTile />);
    const link = screen.getByRole("link", {
      name: /Xem trang Projects thật từ Anthropic/,
    });
    expect(link).toHaveAttribute(
      "href",
      "https://support.claude.com/en/articles/9519177-what-are-projects"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders all 3 CropCards under 'Cách nó hoạt động'", () => {
    render(<ProjectsTile />);
    expect(
      screen.getByRole("heading", { name: /Cách nó hoạt động/ })
    ).toBeInTheDocument();
    // The three bespoke crop-card eyebrows.
    expect(
      screen.getByText("Bộ nhớ cục bộ cho một mục đích")
    ).toBeInTheDocument();
    expect(screen.getByText("File và hướng dẫn dùng chung")).toBeInTheDocument();
    expect(
      screen.getByText("Files theo project, không phải theo chat")
    ).toBeInTheDocument();
  });

  it("renders the DeepLinkCTA with the expected Vietnamese prompt", () => {
    render(<ProjectsTile />);
    const cta = screen.getByRole("link", { name: /Thử trong Claude/i });
    const href = cta.getAttribute("href") ?? "";
    expect(href.startsWith("https://claude.ai/new?q=")).toBe(true);
    const q = decodeURIComponent(href.replace("https://claude.ai/new?q=", ""));
    expect(q).toBe(
      "Mình đang xây Projects trong Claude — gợi ý 3 cách tổ chức Instructions để đội marketing dùng chung, mỗi cách 1-2 câu."
    );
  });
});
