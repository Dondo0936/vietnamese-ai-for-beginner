import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClaudeHeroCard from "@/components/home/ClaudeHeroCard";

describe("ClaudeHeroCard", () => {
  it("links to /claude", () => {
    render(<ClaudeHeroCard />);
    const link = screen.getByRole("link", { name: /Cẩm nang Claude/i });
    expect(link.getAttribute("href")).toBe("/claude");
  });

  it("shows the Vietnamese hook copy", () => {
    render(<ClaudeHeroCard />);
    expect(
      screen.getByText(/Chưa dùng Claude\? Bắt đầu ở đây/)
    ).toBeInTheDocument();
  });
});
