import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import CategorySection from "@/components/home/CategorySection";
import type { Category } from "@/lib/types";

const categories: Category[] = [
  { slug: "foundations", nameVi: "Nền tảng", icon: "", description: "" },
  { slug: "nlp", nameVi: "Xử lý ngôn ngữ", icon: "", description: "" },
];

const topicsByCategory = {
  foundations: [
    { slug: "topic-a", title: "Topic A", titleVi: "Chủ đề A", category: "foundations", tags: [], difficulty: "beginner" as const, relatedSlugs: [], description: "", vizType: "interactive" as const },
  ],
  nlp: [
    { slug: "topic-b", title: "Topic B", titleVi: "Chủ đề B", category: "nlp", tags: [], difficulty: "intermediate" as const, relatedSlugs: [], description: "", vizType: "interactive" as const },
  ],
};

describe("CategorySection", () => {
  it("allows multiple categories to be expanded simultaneously", async () => {
    const user = userEvent.setup();
    render(
      <CategorySection
        categories={categories}
        topicsByCategory={topicsByCategory}
      />
    );

    // Click first category
    await user.click(screen.getByText("Nền tảng"));
    expect(screen.getByText("Chủ đề A")).toBeInTheDocument();

    // Click second category — first should still be expanded
    await user.click(screen.getByText("Xử lý ngôn ngữ"));
    expect(screen.getByText("Chủ đề B")).toBeInTheDocument();
    expect(screen.getByText("Chủ đề A")).toBeInTheDocument(); // still visible
  });

  it("renders an expand-all / collapse-all toggle", async () => {
    const user = userEvent.setup();
    render(
      <CategorySection
        categories={categories}
        topicsByCategory={topicsByCategory}
      />
    );

    const expandAllBtn = screen.getByRole("button", { name: /mở tất cả/i });
    expect(expandAllBtn).toBeInTheDocument();

    await user.click(expandAllBtn);

    // Both should be visible
    expect(screen.getByText("Chủ đề A")).toBeInTheDocument();
    expect(screen.getByText("Chủ đề B")).toBeInTheDocument();
  });
});
