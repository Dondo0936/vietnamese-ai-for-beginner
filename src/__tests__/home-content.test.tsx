import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock dependencies
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock("@/lib/progress-context", () => ({
  useProgress: () => ({
    readTopics: [],
    bookmarks: [],
    loading: false,
    toggleBookmark: vi.fn(),
    addReadTopic: vi.fn(),
  }),
}));
vi.mock("@/components/home/HeroSearch", () => ({
  default: () => <div data-testid="hero-search">hero</div>,
}));
vi.mock("@/components/home/ProfessionPaths", () => ({
  default: () => <div>paths</div>,
}));
vi.mock("@/components/home/TopicGrid", () => ({
  default: ({ topics }: any) => (
    <div data-testid="topic-grid">
      {topics.map((t: any) => (
        <div key={t.slug} data-testid={`topic-${t.slug}`}>{t.title}</div>
      ))}
    </div>
  ),
}));
vi.mock("@/components/home/CategorySection", () => ({
  default: () => <div>categories</div>,
}));

import HomeContent from "@/components/home/HomeContent";

const topics = [
  { slug: "t1", title: "Topic 1", titleVi: "C1", category: "foundations", tags: [], difficulty: "beginner" as const, relatedSlugs: [], description: "", vizType: "interactive" as const },
  { slug: "t2", title: "Topic 2", titleVi: "C2", category: "nlp", tags: [], difficulty: "intermediate" as const, relatedSlugs: [], description: "", vizType: "interactive" as const },
  { slug: "t3", title: "Topic 3", titleVi: "C3", category: "foundations", tags: [], difficulty: "advanced" as const, relatedSlugs: [], description: "", vizType: "interactive" as const },
];

const categories = [
  { slug: "foundations", nameVi: "Nền tảng", icon: "", description: "" },
  { slug: "nlp", nameVi: "Xử lý ngôn ngữ", icon: "", description: "" },
];

vi.mock("@/components/ui/AuthWarningBanner", () => ({
  default: () => null,
}));

describe("HomeContent category filtering", () => {
  it("renders category filter chips", () => {
    render(<HomeContent topics={topics} categories={categories} />);

    expect(screen.getByRole("button", { name: "Nền tảng" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xử lý ngôn ngữ" })).toBeInTheDocument();
  });

  it("filters topics when category chip is clicked", async () => {
    const user = userEvent.setup();
    render(<HomeContent topics={topics} categories={categories} />);

    await user.click(screen.getByRole("button", { name: "Xử lý ngôn ngữ" }));

    // Should show only nlp topics
    const grid = screen.getByTestId("topic-grid");
    expect(grid).toHaveTextContent("Topic 2");
    expect(grid).not.toHaveTextContent("Topic 1");
    expect(grid).not.toHaveTextContent("Topic 3");
  });
});
