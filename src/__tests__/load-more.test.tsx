import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
  default: () => <div>hero</div>,
}));
vi.mock("@/components/home/ProfessionPaths", () => ({
  default: () => <div>paths</div>,
}));
vi.mock("@/components/home/TopicGrid", () => ({
  default: ({ topics }: any) => (
    <div data-testid="topic-grid">
      {topics.map((t: any) => <div key={t.slug}>{t.slug}</div>)}
      <span data-testid="grid-count">{topics.length}</span>
    </div>
  ),
}));
vi.mock("@/components/home/CategorySection", () => ({
  default: () => <div>categories</div>,
}));
vi.mock("@/components/ui/AuthWarningBanner", () => ({
  default: () => null,
}));

import HomeContent from "@/components/home/HomeContent";

// Generate 30 topics to exceed INITIAL_COUNT (12)
const topics = Array.from({ length: 30 }, (_, i) => ({
  slug: `topic-${i}`,
  title: `Topic ${i}`,
  titleVi: `Chủ đề ${i}`,
  category: "foundations",
  tags: [],
  difficulty: "beginner" as const,
  relatedSlugs: [],
  description: "",
  vizType: "interactive" as const,
}));

const categories = [{ slug: "foundations", nameVi: "Nền tảng", icon: "", description: "" }];

describe("Incremental load-more", () => {
  it("initially shows 12 topics, then loads 12 more per click", async () => {
    const user = userEvent.setup();
    render(<HomeContent topics={topics} categories={categories} />);

    // Initially 12
    expect(screen.getByTestId("grid-count")).toHaveTextContent("12");

    // Click "Xem thêm" — should load 12 more (24 total)
    const loadMoreBtn = screen.getByRole("button", { name: /xem thêm/i });
    await user.click(loadMoreBtn);
    expect(screen.getByTestId("grid-count")).toHaveTextContent("24");

    // Click again — should show all 30
    const loadMoreBtn2 = screen.getByRole("button", { name: /xem thêm/i });
    await user.click(loadMoreBtn2);
    expect(screen.getByTestId("grid-count")).toHaveTextContent("30");

    // No more "load more" button
    expect(screen.queryByRole("button", { name: /xem thêm/i })).toBeNull();
  });
});
