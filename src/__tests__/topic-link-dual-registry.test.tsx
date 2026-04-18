import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const pathnameMock = vi.fn(() => "/topics/linear-regression");
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/topics/registry", () => ({
  topicMap: {
    "linear-regression": { slug: "linear-regression", title: "Linear Regression", titleVi: "Hồi quy tuyến tính" },
  },
}));

import TopicLink from "@/components/interactive/TopicLink";

describe("TopicLink registry awareness", () => {
  beforeEach(() => {
    pathnameMock.mockReset();
  });

  it("links to /topics/:slug and validates against topicMap", () => {
    pathnameMock.mockReturnValue("/topics/linear-regression");
    render(<TopicLink slug="linear-regression">Hồi quy tuyến tính</TopicLink>);
    const link = screen.getByRole("link", { name: "Hồi quy tuyến tính" });
    expect(link).toHaveAttribute("href", "/topics/linear-regression");
  });
});
