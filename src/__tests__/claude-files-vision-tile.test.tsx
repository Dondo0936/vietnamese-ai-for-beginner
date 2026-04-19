import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("framer-motion", { spy: true });

import FilesVisionTile from "@/features/claude/tiles/files-vision";

describe("files-vision tile", () => {
  it("renders the one-sentence Vietnamese answer", () => {
    render(<FilesVisionTile />);
    expect(
      screen.getByText(
        /Kéo thả file PDF hoặc ảnh vào chat là xong — Claude đọc cả chữ, bảng biểu, biểu đồ và hình minh hoạ bên trong/
      )
    ).toBeInTheDocument();
  });

  it("renders the hero demo with the mock-badge visible (shell default)", () => {
    render(<FilesVisionTile />);
    expect(screen.getAllByText("Mô phỏng").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("figure", {
        name: /Bản mô phỏng giao diện Claude Desktop/,
      }).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders the ViewRealUI external anchor with the Anthropic PDF-support href", () => {
    render(<FilesVisionTile />);
    const link = screen.getByRole("link", {
      name: /Xem tài liệu gốc của Anthropic về đọc PDF/,
    });
    expect(link).toHaveAttribute(
      "href",
      "https://docs.claude.com/en/docs/build-with-claude/pdf-support"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders all 3 CropCards under 'Cách nó hoạt động'", () => {
    render(<FilesVisionTile />);
    expect(
      screen.getByRole("heading", { name: /Cách nó hoạt động/ })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Những loại file Claude đọc được")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cách Claude trích xuất nội dung")
    ).toBeInTheDocument();
    expect(screen.getByText("Dẫn nguồn để bạn kiểm tra lại")).toBeInTheDocument();
  });

  it("renders the plan-availability / limits note", () => {
    render(<FilesVisionTile />);
    expect(
      screen.getByText(/30 MB mỗi file và 20 file mỗi cuộc chat/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/32 MB và 600 trang mỗi yêu cầu/)
    ).toBeInTheDocument();
  });

  it("renders the DeepLinkCTA with the expected Vietnamese prompt", () => {
    render(<FilesVisionTile />);
    const cta = screen.getByRole("link", { name: /Thử trong Claude/i });
    const href = cta.getAttribute("href") ?? "";
    expect(href.startsWith("https://claude.ai/new?q=")).toBe(true);
    const q = decodeURIComponent(href.replace("https://claude.ai/new?q=", ""));
    expect(q).toBe(
      "Mình vừa upload hoá đơn tiền điện PDF — tóm tắt giúp mình 3 chi phí lớn nhất theo tháng và đề xuất cách tiết kiệm."
    );
  });
});
