import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock("@/components/layout/AppShell", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

import KidsLandingPage from "@/app/kids/page";

describe("/kids landing page", () => {
  it("renders the Vietnamese choice prompt", () => {
    render(<KidsLandingPage />);
    expect(screen.getByText(/ba mẹ hay bé/i)).toBeInTheDocument();
  });

  it("has a 'Bé đang dùng' link to /kids/nhi", () => {
    render(<KidsLandingPage />);
    const kid = screen.getByRole("link", { name: /bé đang dùng/i });
    expect(kid).toHaveAttribute("href", "/kids/nhi");
  });

  it("has a 'Ba mẹ đang dùng' link to /kids/parent", () => {
    render(<KidsLandingPage />);
    const parent = screen.getByRole("link", { name: /ba mẹ đang dùng/i });
    expect(parent).toHaveAttribute("href", "/kids/parent");
  });
});
