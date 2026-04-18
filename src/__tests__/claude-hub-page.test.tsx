import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClaudeHub from "@/app/claude/page";

describe("/claude hub", () => {
  it("renders all 24 tile links", () => {
    render(<ClaudeHub />);
    const links = screen.getAllByRole("link");
    const tileLinks = links.filter((l) =>
      /^\/claude\/[a-z-]+$/.test(l.getAttribute("href") ?? "")
    );
    expect(tileLinks.length).toBe(24);
  });

  it("renders the 3 shelf headings", () => {
    render(<ClaudeHub />);
    expect(screen.getByRole("heading", { name: /Khởi đầu/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Nâng cao/ })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Dành cho nhà phát triển/ })
    ).toBeInTheDocument();
  });
});
