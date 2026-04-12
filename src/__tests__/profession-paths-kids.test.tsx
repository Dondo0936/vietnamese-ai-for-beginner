import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import ProfessionPaths from "@/components/home/ProfessionPaths";

describe("ProfessionPaths — kid cards", () => {
  it("renders a Nhí card linking to /kids/nhi", () => {
    render(<ProfessionPaths topics={[]} />);
    const nhi = screen.getByRole("link", { name: /nhí|bé làm quen/i });
    expect(nhi).toHaveAttribute("href", "/kids/nhi");
  });

  it("renders a Teen card linking to /kids/teen", () => {
    render(<ProfessionPaths topics={[]} />);
    const teen = screen.getByRole("link", { name: /teen|tự làm dự án/i });
    expect(teen).toHaveAttribute("href", "/kids/teen");
  });

  it("still renders the four existing adult profession cards", () => {
    render(<ProfessionPaths topics={[]} />);
    expect(screen.getByRole("link", { name: /học sinh · sinh viên/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nhân viên văn phòng/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ai engineer/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ai researcher/i })).toBeInTheDocument();
  });
});
