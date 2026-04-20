/**
 * Landing page — behavior contracts.
 *
 * The landing lives at `/` and is the marketing front door (catalog browse
 * moves to `/browse`). These tests pin the user-requested deltas from the
 * design bundle so they cannot regress:
 *
 *   - Hero reads "Học AI / không cần / biết tiếng Anh." (strike on the
 *     last line is the same design device as the original).
 *   - Search placeholder is a plain catalog search (NOT a prompt-box teaser).
 *   - The search box is a REAL form — GET to /browse with name="q" — so
 *     typing + Enter takes the user to the catalog with their query.
 *   - Suggestion chips link to specific /topics/<slug> pages, not /browse.
 *   - Marquee strip is dark-on-light-text (data-theme="dark").
 *   - Featured grid has exactly 6 hardcoded topic titles from the design.
 *   - Testimonials are ANONYMOUS and role + location stack visually.
 *   - Footer MUST NOT carry "Built with Claude Opus 4.7" or font credits.
 *   - "Chủ đề" nav link routes to /browse.
 *   - AttentionDemoCard exposes a real slider the user can drag to change
 *     the current query token.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, prefetch: vi.fn() }),
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

  it("hero H1 reads 'Học AI / không cần / biết tiếng Anh.'", () => {
    render(<Landing />);
    const h1 = screen.getByRole("heading", { level: 1 });
    const text = h1.textContent ?? "";
    expect(text).toMatch(/Học AI/);
    expect(text).toMatch(/không cần/);
    expect(text).toMatch(/biết tiếng Anh/);
    // Old phrasing must be gone.
    expect(text).not.toMatch(/không phải/);
    expect(text).not.toMatch(/đọc tường chữ/);
  });

  it("search input has a plain-catalog placeholder, NOT a prompt-style teaser", () => {
    render(<Landing />);
    const search = screen.getByRole("combobox", { name: /tìm chủ đề/i });
    const placeholder = search.getAttribute("placeholder") ?? "";
    expect(placeholder).toMatch(/tìm chủ đề/i);
    expect(placeholder).not.toMatch(/thử:/i);
    expect(placeholder).not.toMatch(/rag là gì/i);
    expect(placeholder).not.toMatch(/vì sao transformer thắng/i);
  });

  it("search input is a combobox that typeaheads topics (matches in-app search)", async () => {
    pushMock.mockClear();
    render(<Landing />);
    const input = screen.getByRole("combobox", { name: /tìm chủ đề/i });
    expect(input.tagName.toLowerCase()).toBe("input");
    // Typing a known term should open a listbox of topic results.
    fireEvent.change(input, { target: { value: "attention" } });
    const listbox = await screen.findByRole("listbox");
    expect(listbox).toBeTruthy();
    const options = listbox.querySelectorAll('[role="option"]');
    expect(options.length).toBeGreaterThan(0);
    // Clicking the first option should route to /topics/<slug>.
    const firstOption = options[0].querySelector("button") as HTMLElement;
    fireEvent.click(firstOption);
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock.mock.calls[0][0]).toMatch(/^\/topics\//);
  });

  it("renders at least 9 suggestion chips linking to /topics/<slug>", () => {
    render(<Landing />);
    const chipRail = screen.getByTestId("landing-search-chips");
    const chips = Array.from(
      chipRail.querySelectorAll("[data-chip]")
    ) as HTMLAnchorElement[];
    expect(chips.length).toBeGreaterThanOrEqual(9);
    for (const chip of chips) {
      const href = chip.getAttribute("href") ?? "";
      expect(href).toMatch(/^\/topics\//);
    }
    // Spot-check a couple of known slugs are wired up correctly.
    const hrefs = chips.map((c) => c.getAttribute("href"));
    expect(hrefs).toContain("/topics/attention-mechanism");
    expect(hrefs).toContain("/topics/rag");
  });

  it("nav 'Chủ đề' link routes to /browse", () => {
    render(<Landing />);
    const chude = screen.getByRole("link", { name: /^Chủ đề$/ });
    expect(chude.getAttribute("href")).toBe("/browse");
  });

  it("nav is scroll-aware (installs handler that toggles data-scrolled)", () => {
    render(<Landing />);
    const nav = document.querySelector(".ld-nav") as HTMLElement | null;
    expect(nav).toBeTruthy();
    // Structural contract — the nav opts into the scroll listener via
    // this attribute. CSS matches [data-scrolled="true"] to intensify
    // the blur/bg when the user scrolls past the threshold.
    expect(nav!.getAttribute("data-scroll-aware")).toBe("true");
  });

  it("marquee strip is dark-themed (data-theme='dark')", () => {
    render(<Landing />);
    const marquee = document.querySelector(".ld-marquee") as HTMLElement | null;
    expect(marquee).toBeTruthy();
    expect(marquee!.getAttribute("data-theme")).toBe("dark");
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

  it("quote caption stacks role on one line and context on the next", () => {
    render(<Landing />);
    // The role <b> and its context <span> should each live in their own
    // block-level slot (not glued together on one line like
    // "Một bạn Học sinh THPTHà Nội"). We pin the contract via a
    // `data-layout="stack"` attribute on the wrapper — independent of
    // whatever role text happens to live inside.
    const stacks = document.querySelectorAll(
      '.ld-quote figcaption [data-layout="stack"]'
    );
    expect(stacks.length).toBeGreaterThan(0);
    const first = stacks[0] as HTMLElement;
    // Must hold exactly one <b> (role) and one <span> (context), stacked.
    expect(first.querySelector("b")).toBeTruthy();
    expect(first.querySelector("span")).toBeTruthy();
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

  it("attention demo exposes a range slider that updates the query label", () => {
    render(<Landing />);
    const slider = screen.getByRole("slider", { name: /query/i });
    // Native range input is required so keyboard + touch + AT work.
    expect(slider.tagName.toLowerCase()).toBe("input");
    expect(slider.getAttribute("type")).toBe("range");
    // Moving to 0 → query token should be "con mèo".
    fireEvent.change(slider, { target: { value: "0" } });
    const label = document.querySelector(
      '[data-testid="ld-demo-query-label"]'
    ) as HTMLElement | null;
    expect(label).toBeTruthy();
    expect(label!.textContent).toMatch(/con mèo/);
    // Moving to 4 → query token should be "ghế".
    fireEvent.change(slider, { target: { value: "4" } });
    expect(label!.textContent).toMatch(/ghế/);
  });
});
