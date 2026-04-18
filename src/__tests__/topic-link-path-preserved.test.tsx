import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const pathnameMock = vi.fn(() => "/topics/linear-regression");

// TopicLink reads ?path= from window.location.search inside useEffect to
// avoid SSR bailout. Tests simulate path by mutating jsdom's location.
function setSearch(search: string) {
  const url = new URL(window.location.href);
  url.search = search;
  window.history.replaceState({}, "", url.toString());
}

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));
vi.mock("@/topics/registry", () => ({
  topicMap: {
    "logistic-regression": { slug: "logistic-regression", title: "Logistic Regression", titleVi: "Hồi quy logistic" },
    "transformer": { slug: "transformer", title: "Transformer", titleVi: "Transformer" },
  },
}));
import TopicLink from "@/components/interactive/TopicLink";

beforeEach(() => {
  pathnameMock.mockReset();
  pathnameMock.mockReturnValue("/topics/linear-regression");
  setSearch("");
});

describe("TopicLink — ?path= preservation", () => {
  it("without ?path= on the current URL, produces a plain /topics/:slug href", () => {
    render(<TopicLink slug="logistic-regression">Hồi quy logistic</TopicLink>);
    const link = screen.getByRole("link", { name: "Hồi quy logistic" });
    expect(link).toHaveAttribute("href", "/topics/logistic-regression");
  });

  it("with ?path=student on the current URL, carries path into the href", () => {
    setSearch("?path=student");
    render(<TopicLink slug="logistic-regression">Hồi quy logistic</TopicLink>);
    const link = screen.getByRole("link", { name: "Hồi quy logistic" });
    expect(link).toHaveAttribute("href", "/topics/logistic-regression?path=student");
  });

  it("with ?path=ai-engineer on the current URL, carries that path into the href", () => {
    setSearch("?path=ai-engineer");
    render(<TopicLink slug="transformer">Transformer</TopicLink>);
    const link = screen.getByRole("link", { name: "Transformer" });
    expect(link).toHaveAttribute("href", "/topics/transformer?path=ai-engineer");
  });

  it("with ?path=garbage (unknown path), drops it rather than echoing invalid input", () => {
    setSearch("?path=garbage");
    render(<TopicLink slug="logistic-regression">Hồi quy logistic</TopicLink>);
    const link = screen.getByRole("link", { name: "Hồi quy logistic" });
    expect(link).toHaveAttribute("href", "/topics/logistic-regression");
  });

});
