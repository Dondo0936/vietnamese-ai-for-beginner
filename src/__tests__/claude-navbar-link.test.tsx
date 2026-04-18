import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/ui/ThemeToggle", () => ({
  default: () => <div data-testid="theme-toggle" />,
}));
vi.mock("@/components/auth/AuthButton", () => ({
  default: () => <div data-testid="auth-button" />,
}));

import Navbar from "@/components/layout/Navbar";

describe("Navbar", () => {
  it("links to the Claude guide", () => {
    render(<Navbar />);
    const link = screen.getByRole("link", { name: /Cẩm nang Claude/i });
    expect(link.getAttribute("href")).toBe("/claude");
  });
});
