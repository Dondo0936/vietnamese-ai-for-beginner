import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Spy on framer-motion without replacing its behavior — same pattern as
// the files-vision tile test. Keeps AnimatePresence / motion.* renders
// real so aria-label queries and the static-fallback paths both work.
vi.mock("framer-motion", { spy: true });

import VoiceTile from "@/features/claude/tiles/voice";

describe("voice tile", () => {
  it("renders the one-sentence Vietnamese answer (cross-platform framing)", () => {
    render(<VoiceTile />);
    expect(
      screen.getByText(
        /Voice Mode \(beta\) cho bạn nói chuyện tự nhiên với Claude/
      )
    ).toBeInTheDocument();
  });

  it("explicitly mentions Claude web in the tile body (guards against mobile-only regression)", () => {
    render(<VoiceTile />);
    // At least one on-page mention of 'Claude web' must exist somewhere in
    // the tile — this catches any accidental revert to a mobile-only
    // framing of Voice Mode.
    expect(
      screen.getAllByText(/Claude web/).length
    ).toBeGreaterThanOrEqual(1);
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

  it("renders the ViewRealUI external anchor pointing to the canonical support article (slug 11101966)", () => {
    render(<VoiceTile />);
    const link = screen.getByRole("link", {
      name: /Xem hướng dẫn Voice Mode từ Anthropic/,
    });
    const href = link.getAttribute("href") ?? "";
    expect(href).toContain("11101966");
    expect(href).toBe(
      "https://support.claude.com/en/articles/11101966-using-voice-mode-on-claude-mobile-apps"
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
    expect(screen.getByText("Lời hiện thành bản chép")).toBeInTheDocument();
    expect(
      screen.getByText("Claude đáp lại bằng giọng nói")
    ).toBeInTheDocument();
  });

  it("renders the plan-availability note with beta + English-only + 5-voices + Enterprise-disable + 20-30 cap", () => {
    render(<VoiceTile />);
    // The plan-availability <p role="note"> must cover all required facts.
    // Multiple role=note nodes exist on the page (MockBadge etc.); find the
    // one whose text contains "Voice Mode đang ở giai đoạn beta".
    const notes = screen.getAllByRole("note");
    const planNote = notes.find((n) =>
      /Voice Mode đang ở giai đoạn beta/.test(n.textContent ?? "")
    );
    expect(planNote).toBeDefined();
    const text = planNote?.textContent ?? "";
    expect(text).toMatch(/beta/);
    expect(text).toMatch(/tiếng Anh/);
    expect(text).toMatch(/5 giọng/);
    expect(text).toMatch(/20.{1,3}30/);
    expect(text).toMatch(/Enterprise admin/);
    // Caps Lock disclosure — distinguish Voice Mode from desktop dictation.
    expect(text).toMatch(/Caps Lock/);
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
