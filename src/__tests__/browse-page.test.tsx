/**
 * /browse — catalog page contract.
 *
 * After the landing redesign, topic browsing moved from `/` → `/browse`.
 * These tests pin that the catalog features (topic grid, category chips,
 * difficulty filter) still render there.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/browse",
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    React.createElement("a", { href, ...rest }, children),
}));

// Stub the progress context so we don't need a provider in tests.
vi.mock("@/lib/progress-context", () => ({
  useProgress: () => ({
    readTopics: [],
    bookmarks: [],
    toggleBookmark: vi.fn(),
    markRead: vi.fn(),
  }),
  ProgressProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import BrowseContent from "@/components/browse/BrowseContent";
import { topicList, categories } from "@/topics/registry";

describe("/browse catalog", () => {
  it("renders the page heading 'Tất cả chủ đề'", () => {
    render(<BrowseContent topics={topicList} categories={categories} />);
    expect(
      screen.getByRole("heading", { level: 1, name: /tất cả chủ đề/i })
    ).toBeInTheDocument();
  });

  it("renders the category chip rail with 'Tất cả' + at least 4 categories", () => {
    render(<BrowseContent topics={topicList} categories={categories} />);
    expect(
      screen.getByRole("button", { name: /^Tất cả$/ })
    ).toBeInTheDocument();
    // At least 4 more chips beyond "Tất cả".
    const chips = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-pressed") !== null);
    expect(chips.length).toBeGreaterThanOrEqual(5);
  });

  it("renders at least one topic card from the real registry", () => {
    render(<BrowseContent topics={topicList} categories={categories} />);
    // The registry has 200+ entries; the first page of 12 should be visible.
    // TopicCard renders each entry as an <a href="/topics/<slug>">.
    const cards = document.querySelectorAll('a[href^="/topics/"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it("exposes difficulty filter chips (Tất cả / Cơ bản / Trung bình / Nâng cao)", () => {
    render(<BrowseContent topics={topicList} categories={categories} />);
    expect(screen.getByRole("button", { name: /cơ bản/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /trung bình/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /nâng cao/i })).toBeInTheDocument();
  });
});
