import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("framer-motion", { spy: true });

import ArtifactsTile from "@/features/claude/tiles/artifacts";

describe("artifacts tile", () => {
  it("renders the one-sentence Vietnamese answer", () => {
    render(<ArtifactsTile />);
    expect(
      screen.getByText(
        /Artifacts là khung xem ở cạnh chat — Claude tự mở để hiển thị code, React, biểu đồ hay tài liệu dài, giữ riêng khỏi cuộc hội thoại để bạn xem, sửa và tải về\./
      )
    ).toBeInTheDocument();
  });

  it("renders the hero demo with the mock-badge visible (shell default)", () => {
    render(<ArtifactsTile />);
    // ClaudeDesktopShell emits the "Mô phỏng" badge by default. Pairs with
    // the ViewRealUI disclosure below the hero.
    expect(screen.getAllByText("Mô phỏng").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("figure", {
        name: /Bản mô phỏng giao diện Claude Desktop/,
      }).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders the ViewRealUI external anchor with the Anthropic Artifacts href", () => {
    render(<ArtifactsTile />);
    const link = screen.getByRole("link", {
      name: /Xem bài viết gốc của Anthropic về Artifacts/,
    });
    expect(link).toHaveAttribute(
      "href",
      "https://support.claude.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders all 3 CropCards under 'Cách nó hoạt động'", () => {
    render(<ArtifactsTile />);
    expect(
      screen.getByRole("heading", { name: /Cách nó hoạt động/ })
    ).toBeInTheDocument();
    expect(screen.getByText("Khi nào Artifacts tự mở")).toBeInTheDocument();
    expect(screen.getByText("Xem trực quan hoặc code gốc")).toBeInTheDocument();
    expect(screen.getByText("Lịch sử phiên bản")).toBeInTheDocument();
  });

  it("renders the plan-availability note disclosure", () => {
    render(<ArtifactsTile />);
    expect(
      screen.getByText(/Free, Pro, Max, Team và Enterprise/)
    ).toBeInTheDocument();
  });

  it("renders the DeepLinkCTA with the expected Vietnamese prompt", () => {
    render(<ArtifactsTile />);
    const cta = screen.getByRole("link", { name: /Thử trong Claude/i });
    const href = cta.getAttribute("href") ?? "";
    expect(href.startsWith("https://claude.ai/new?q=")).toBe(true);
    const q = decodeURIComponent(href.replace("https://claude.ai/new?q=", ""));
    expect(q).toBe(
      "Mình muốn thử Artifacts — hãy vẽ giúp mình một biểu đồ cột so sánh tỉ lệ người dùng Android/iOS ở Việt Nam năm 2025, kèm chú thích nguồn."
    );
  });
});
