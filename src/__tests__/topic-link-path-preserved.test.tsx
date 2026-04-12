import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const searchParamsMock = vi.fn(() => new URLSearchParams());
const pathnameMock = vi.fn(() => "/topics/linear-regression");

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
  useSearchParams: () => searchParamsMock(),
}));
vi.mock("@/topics/registry", () => ({
  topicMap: {
    "logistic-regression": { slug: "logistic-regression", title: "Logistic Regression", titleVi: "Hồi quy logistic" },
    "transformer": { slug: "transformer", title: "Transformer", titleVi: "Transformer" },
  },
}));
vi.mock("@/topics/kids/kids-registry", () => ({
  kidsTopicMap: {},
}));

import TopicLink from "@/components/interactive/TopicLink";

beforeEach(() => {
  pathnameMock.mockReset();
  pathnameMock.mockReturnValue("/topics/linear-regression");
  searchParamsMock.mockReset();
  searchParamsMock.mockReturnValue(new URLSearchParams());
});

describe("TopicLink — ?path= preservation", () => {
  it("without ?path= on the current URL, produces a plain /topics/:slug href", () => {
    render(<TopicLink slug="logistic-regression">Hồi quy logistic</TopicLink>);
    const link = screen.getByRole("link", { name: "Hồi quy logistic" });
    expect(link).toHaveAttribute("href", "/topics/logistic-regression");
  });

  it("with ?path=student on the current URL, carries path into the href", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("path=student"));
    render(<TopicLink slug="logistic-regression">Hồi quy logistic</TopicLink>);
    const link = screen.getByRole("link", { name: "Hồi quy logistic" });
    expect(link).toHaveAttribute("href", "/topics/logistic-regression?path=student");
  });

  it("with ?path=ai-engineer on the current URL, carries that path into the href", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("path=ai-engineer"));
    render(<TopicLink slug="transformer">Transformer</TopicLink>);
    const link = screen.getByRole("link", { name: "Transformer" });
    expect(link).toHaveAttribute("href", "/topics/transformer?path=ai-engineer");
  });

  it("with ?path=garbage (unknown path), drops it rather than echoing invalid input", () => {
    searchParamsMock.mockReturnValue(new URLSearchParams("path=garbage"));
    render(<TopicLink slug="logistic-regression">Hồi quy logistic</TopicLink>);
    const link = screen.getByRole("link", { name: "Hồi quy logistic" });
    expect(link).toHaveAttribute("href", "/topics/logistic-regression");
  });

  it("on a /kids/* route, ignores ?path= entirely and routes to /kids/topics/:slug", () => {
    pathnameMock.mockReturnValue("/kids/topics/may-nhin-pixel");
    searchParamsMock.mockReturnValue(new URLSearchParams("path=student"));
    render(<TopicLink slug="logistic-regression">Hồi quy</TopicLink>);
    const link = screen.getByRole("link", { name: "Hồi quy" });
    expect(link).toHaveAttribute("href", "/kids/topics/logistic-regression");
  });
});
