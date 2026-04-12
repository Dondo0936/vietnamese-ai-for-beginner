import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/link — render as plain anchor so we can assert the href
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock usePathname from next/navigation
const pathnameMock = vi.fn(() => "/topics/linear-regression");
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock both registries with one known slug each
vi.mock("@/topics/registry", () => ({
  topicMap: {
    "linear-regression": { slug: "linear-regression", title: "Linear Regression", titleVi: "Hồi quy tuyến tính" },
  },
}));
vi.mock("@/topics/kids/kids-registry", () => ({
  kidsTopicMap: {
    "may-nhin-pixel": { slug: "may-nhin-pixel", title: "How machines see pixels", titleVi: "Máy nhìn pixel", tier: "nhi" },
  },
}));

import TopicLink from "@/components/interactive/TopicLink";

describe("TopicLink dual-registry awareness", () => {
  beforeEach(() => {
    pathnameMock.mockReset();
  });

  it("links to /topics/:slug on adult routes and validates against topicMap", () => {
    pathnameMock.mockReturnValue("/topics/linear-regression");
    render(<TopicLink slug="linear-regression">Hồi quy tuyến tính</TopicLink>);
    const link = screen.getByRole("link", { name: "Hồi quy tuyến tính" });
    expect(link).toHaveAttribute("href", "/topics/linear-regression");
  });

  it("links to /kids/topics/:slug when rendered inside /kids/*", () => {
    pathnameMock.mockReturnValue("/kids/topics/may-nhin-pixel");
    render(<TopicLink slug="may-nhin-pixel">Máy nhìn pixel</TopicLink>);
    const link = screen.getByRole("link", { name: "Máy nhìn pixel" });
    expect(link).toHaveAttribute("href", "/kids/topics/may-nhin-pixel");
  });

  it("still links correctly from /kids/nhi (non-topic kid route)", () => {
    pathnameMock.mockReturnValue("/kids/nhi");
    render(<TopicLink slug="may-nhin-pixel">Máy nhìn pixel</TopicLink>);
    const link = screen.getByRole("link", { name: "Máy nhìn pixel" });
    expect(link).toHaveAttribute("href", "/kids/topics/may-nhin-pixel");
  });
});
