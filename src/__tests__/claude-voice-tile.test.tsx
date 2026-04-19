import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Spy on framer-motion without replacing its behavior — same pattern as
// the files-vision tile test. Keeps AnimatePresence / motion.* renders
// real so aria-label queries and the static-fallback paths both work.
vi.mock("framer-motion", { spy: true });

import VoiceTile from "@/features/claude/tiles/voice";

describe("voice tile", () => {
  it("renders the one-sentence Vietnamese answer", () => {
    render(<VoiceTile />);
    expect(
      screen.getByText(
        /Voice Mode cho bạn nói chuyện tự nhiên với Claude trên điện thoại/
      )
    ).toBeInTheDocument();
  });

  it("renders the phone shell with the mock-badge visible", () => {
    render(<VoiceTile />);
    expect(screen.getAllByText("Mô phỏng").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole("figure", {
        name: /Bản mô phỏng ứng dụng Claude trên điện thoại/,
      }).length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders the ViewRealUI external anchor with the Anthropic product-overview href", () => {
    render(<VoiceTile />);
    const link = screen.getByRole("link", {
      name: /Xem trang sản phẩm của Anthropic mô tả Voice Mode/,
    });
    expect(link).toHaveAttribute(
      "href",
      "https://www.claude.com/product/overview"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders all 3 CropCards under 'Cách nó hoạt động'", () => {
    render(<VoiceTile />);
    expect(
      screen.getByRole("heading", { name: /Cách nó hoạt động/ })
    ).toBeInTheDocument();
    expect(screen.getByText("Nói vào, Claude hiểu ngay")).toBeInTheDocument();
    expect(screen.getByText("Lời hiện thành chữ")).toBeInTheDocument();
    expect(
      screen.getByText("Claude đáp lại bằng giọng nói")
    ).toBeInTheDocument();
  });

  it("renders the plan-availability note with the mobile caveat + pricing-source date", () => {
    render(<VoiceTile />);
    // Mobile-only caveat — must be present because Voice Mode lives in
    // the mobile app surface, not desktop/web.
    expect(
      screen.getByText(
        /tính năng trong ứng dụng Claude trên điện thoại.*iOS và Android/
      )
    ).toBeInTheDocument();
    // Plan list grounded in claude.com/pricing fetched 2026-04-19.
    expect(
      screen.getByText(/Free, Pro, Max, Team và Enterprise/)
    ).toBeInTheDocument();
  });

  it("cross-links to ready tiles only (chat, projects, files-vision), never planned ones", () => {
    render(<VoiceTile />);
    const chatLink = screen.getByRole("link", {
      name: /Chat \+ phản hồi trực tiếp/,
    });
    expect(chatLink).toHaveAttribute("href", "/claude/chat");
    const projectsLink = screen.getByRole("link", {
      name: /Workspace \(Projects\)/,
    });
    expect(projectsLink).toHaveAttribute("href", "/claude/projects");
    const filesLink = screen.getByRole("link", {
      name: /Files & Vision/,
    });
    expect(filesLink).toHaveAttribute("href", "/claude/files-vision");

    // Sanity: no link to web-search (a planned tile) in the Liên quan nav.
    expect(
      screen.queryByRole("link", { name: /^Web Search$/ })
    ).not.toBeInTheDocument();
  });

  it("renders the DeepLinkCTA with the voice-style Vietnamese prompt", () => {
    render(<VoiceTile />);
    const cta = screen.getByRole("link", { name: /Thử trong Claude/i });
    const href = cta.getAttribute("href") ?? "";
    expect(href.startsWith("https://claude.ai/new?q=")).toBe(true);
    const q = decodeURIComponent(href.replace("https://claude.ai/new?q=", ""));
    expect(q).toBe(
      "Tôi đang trên đường đi làm, giải thích ngắn gọn về supervised learning trong 60 giây bằng tiếng Việt."
    );
  });
});
