import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/home/DifficultyFilter", () => ({
  default: () => <div data-testid="diff-filter" />,
}));

import HeroSearch from "@/components/home/HeroSearch";

describe("HeroSearch hero", () => {
  it("does not render the ✳ mark anymore", () => {
    render(
      <HeroSearch
        topics={[]}
        selectedDifficulty="all"
        onDifficultyChange={() => {}}
        counts={{ all: 0 }}
      />
    );
    expect(screen.queryByText("✳")).toBeNull();
  });

  it("renders the gradient-clipped 'hình ảnh và ví dụ' phrase", () => {
    render(
      <HeroSearch
        topics={[]}
        selectedDifficulty="all"
        onDifficultyChange={() => {}}
        counts={{ all: 0 }}
      />
    );
    expect(screen.getByText("hình ảnh và ví dụ")).toBeInTheDocument();
  });

  it("keeps the full headline text accessible", () => {
    render(
      <HeroSearch
        topics={[]}
        selectedDifficulty="all"
        onDifficultyChange={() => {}}
        counts={{ all: 0 }}
      />
    );
    expect(
      screen.getByRole("heading", { level: 1 }).textContent
    ).toContain("Hiểu AI qua hình ảnh và ví dụ");
  });
});
