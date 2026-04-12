import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/topics/test-topic",
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock("framer-motion", () => ({
  motion: {
    article: ({ children, ...props }: any) => <article {...props}>{children}</article>,
  },
  useReducedMotion: () => false,
}));
vi.mock("@/lib/database", () => ({
  markTopicRead: vi.fn(),
}));
vi.mock("@/topics/registry", () => ({
  topicList: [
    { slug: "test-topic", title: "Test", titleVi: "Test Vi", category: "foundations", difficulty: "beginner", tags: [], relatedSlugs: [], description: "" },
  ],
  topicMap: {
    "test-topic": { slug: "test-topic", title: "Test", titleVi: "Test Vi", category: "foundations", difficulty: "beginner", tags: [], relatedSlugs: [], description: "" },
  },
}));
vi.mock("@/components/ui/Tag", () => ({
  default: ({ label }: any) => <span data-testid="tag">{label}</span>,
}));
vi.mock("@/components/topic/BookmarkButton", () => ({
  default: () => <button>bookmark</button>,
}));
vi.mock("@/components/topic/RelatedTopics", () => ({
  default: () => <div>related</div>,
}));
vi.mock("@/components/ui/ReadingProgressBar", () => ({
  default: () => <div>progress bar</div>,
}));
vi.mock("@/components/topic/TopicTOC", () => ({
  default: () => <div>toc</div>,
}));

import TopicLayout from "@/components/topic/TopicLayout";
import { markTopicRead } from "@/lib/database";

const testMeta = {
  slug: "test-topic",
  title: "Test Topic",
  titleVi: "Chủ đề kiểm tra",
  description: "A test topic",
  category: "foundations" as const,
  tags: ["test"],
  difficulty: "beginner" as const,
  relatedSlugs: [],
  vizType: "interactive" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TopicLayout", () => {
  it("does not show hardcoded reading time", () => {
    render(<TopicLayout meta={testMeta}><p>content</p></TopicLayout>);

    expect(screen.queryByText(/3-5 phút/)).toBeNull();
    expect(screen.queryByText(/~3-5/)).toBeNull();
  });

  it("renders a mark-as-complete button", () => {
    render(<TopicLayout meta={testMeta}><p>content</p></TopicLayout>);

    const btn = screen.getByRole("button", { name: /đánh dấu đã đọc/i });
    expect(btn).toBeInTheDocument();
  });

  it("calls markTopicRead when mark-complete button is clicked", async () => {
    const user = userEvent.setup();
    render(<TopicLayout meta={testMeta}><p>content</p></TopicLayout>);

    const btn = screen.getByRole("button", { name: /đánh dấu đã đọc/i });
    await user.click(btn);

    expect(markTopicRead).toHaveBeenCalledWith("test-topic");
  });
});
