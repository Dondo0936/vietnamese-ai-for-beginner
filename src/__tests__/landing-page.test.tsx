/**
 * Landing page — behavior contracts.
 *
 * The landing lives at `/` and is the marketing front door (catalog browse
 * moves to `/browse`). These tests pin the user-requested deltas from the
 * design bundle so they cannot regress:
 *
 *   - Hero says "Hỏi bất cứ gì về AI."
 *   - Search placeholder is a plain catalog search (NOT a prompt-box
 *     "thử: 'rag là gì'..." AI-style teaser).
 *   - Clicking the search bar (or its keyboard shortcut) opens the
 *     real ⌘K palette — it is not a fake input.
 *   - Featured grid has exactly 6 hardcoded topic titles from the design.
 *   - Testimonials are ANONYMOUS — no named people.
 *   - Footer MUST NOT carry "Built with Claude Opus 4.7" or
 *     "Type: Space Grotesk · Inter Tight · Be Vietnam Pro".
 *   - "Chủ đề" nav link routes to /browse.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    React.createElement("a", { href, ...rest }, children),
}));

import Landing from "@/components/landing/Landing";

describe("Landing page", () => {
  it("renders the 'Hỏi bất cứ gì về AI' hero search H2", () => {
    render(<Landing />);
    expect(
      screen.getByRole("heading", { level: 2, name: /Hỏi bất cứ gì/i })
    ).toBeInTheDocument();
  });

  it("search input has a plain-catalog placeholder, NOT a prompt-style teaser", () => {
    render(<Landing />);
    const search = screen.getByRole("searchbox", { name: /tìm chủ đề/i });
    const placeholder = search.getAttribute("placeholder") ?? "";
    expect(placeholder).toMatch(/tìm chủ đề/i);
    // The design's original AI-teaser phrasing must be absent.
    expect(placeholder).not.toMatch(/thử:/i);
    expect(placeholder).not.toMatch(/rag là gì/i);
    expect(placeholder).not.toMatch(/vì sao transformer thắng/i);
  });

  it("renders at least 9 suggestion chips under the search bar", () => {
    render(<Landing />);
    const chipRail = screen.getByTestId("landing-search-chips");
    const chips = chipRail.querySelectorAll("[data-chip]");
    expect(chips.length).toBeGreaterThanOrEqual(9);
  });

  it("nav 'Chủ đề' link routes to /browse", () => {
    render(<Landing />);
    const chude = screen.getByRole("link", { name: /^Chủ đề$/ });
    expect(chude.getAttribute("href")).toBe("/browse");
  });

  it("renders all 4 profession path cards with correct titles", () => {
    render(<Landing />);
    expect(
      screen.getByRole("heading", { level: 3, name: /Học sinh · Sinh viên/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /Nhân viên văn phòng/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /^AI Engineer$/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /^AI Researcher$/ })
    ).toBeInTheDocument();
  });

  it("renders exactly the 6 hardcoded featured topic titles from the design", () => {
    render(<Landing />);
    const FEATURED = [
      "Reasoning models",
      "Agentic RAG",
      "Constitutional AI",
      "Mixture of Experts",
      "KV cache",
      "LoRA & QLoRA",
    ];
    for (const title of FEATURED) {
      expect(
        screen.getByRole("heading", { level: 4, name: title })
      ).toBeInTheDocument();
    }
  });

  it("renders all 8 process steps", () => {
    render(<Landing />);
    const STEPS = [
      "Dự đoán",
      "Ẩn dụ",
      "Trực quan",
      "Khoảnh khắc à-ha",
      "Thử thách",
      "Giải thích",
      "Tóm tắt",
      "Quiz",
    ];
    for (const step of STEPS) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
  });

  it("testimonials are anonymous — no named people like 'Nam, 17' or 'Linh, 20'", () => {
    render(<Landing />);
    const { textContent } = document.body;
    expect(textContent).not.toMatch(/Nam,\s*17/);
    expect(textContent).not.toMatch(/Linh,\s*20/);
    expect(textContent).not.toMatch(/Quân,\s*28/);
    expect(textContent).not.toMatch(/Mai,\s*24/);
  });

  it("footer does NOT contain 'Built with Claude Opus 4.7' or font-type credits", () => {
    render(<Landing />);
    const footer = screen.getByRole("contentinfo");
    expect(footer.textContent).not.toMatch(/Built with Claude Opus/i);
    expect(footer.textContent).not.toMatch(/Space Grotesk/i);
    expect(footer.textContent).not.toMatch(/Inter Tight/i);
    expect(footer.textContent).not.toMatch(/Be Vietnam Pro/i);
    expect(footer.textContent).not.toMatch(/Type:/i);
  });

  it("footer DOES contain the MIT license line", () => {
    render(<Landing />);
    const footer = screen.getByRole("contentinfo");
    expect(footer.textContent).toMatch(/MIT License/);
  });

  it("renders the big CTA 'học thử đi' at the bottom", () => {
    render(<Landing />);
    expect(screen.getByText(/học thử đi/i)).toBeInTheDocument();
  });
});
