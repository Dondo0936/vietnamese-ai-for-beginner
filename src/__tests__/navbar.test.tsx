import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock ThemeToggle
vi.mock("@/components/ui/ThemeToggle", () => ({
  default: () => <button data-testid="theme-toggle">toggle</button>,
}));

import Navbar from "@/components/layout/Navbar";

describe("Navbar", () => {
  it("uses theme-aware background classes instead of hardcoded dark", () => {
    const { container } = render(<Navbar />);
    const nav = container.querySelector("nav")!;

    // Should NOT have hardcoded dark classes
    expect(nav.className).not.toContain("bg-dark");
    expect(nav.className).not.toContain("text-white");

    // Should use glassy backdrop with theme-aware classes
    expect(nav.className).toContain("backdrop-blur");
    expect(nav.className).toContain("border-border");
  });

  it("uses theme-aware text colors for nav links", () => {
    render(<Navbar />);

    const progressLink = screen.getByLabelText("Tiến độ");
    const bookmarkLink = screen.getByLabelText("Đã lưu");

    // Should NOT have hardcoded slate colors
    expect(progressLink.className).not.toContain("text-slate-300");
    expect(bookmarkLink.className).not.toContain("text-slate-300");
  });

  it("renders the search button with theme-aware styling", () => {
    render(<Navbar />);
    const searchBtn = screen.getByText("Tìm kiếm...");
    const button = searchBtn.closest("button")!;

    // Should NOT use white-based opacity classes
    expect(button.className).not.toContain("border-white/10");
    expect(button.className).not.toContain("bg-white/5");
  });
});
