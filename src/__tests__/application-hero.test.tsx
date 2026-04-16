import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ApplicationHero from "@/components/application/ApplicationHero";
import { SectionDuplicateGuard } from "@/components/topic/SectionDuplicateGuard";

describe("<ApplicationHero>", () => {
  it("renders heading 'Công ty nào đang ứng dụng {parentTitleVi}?'", () => {
    render(
      <ApplicationHero parentTitleVi="K-means">
        <p>Mỗi thứ Hai khi bạn mở Spotify…</p>
      </ApplicationHero>
    );
    expect(
      screen.getByRole("heading", {
        name: "Công ty nào đang ứng dụng K-means?",
      })
    ).toBeInTheDocument();
  });

  it("renders children below the heading", () => {
    render(
      <ApplicationHero parentTitleVi="K-means">
        <p data-testid="body">Body content here</p>
      </ApplicationHero>
    );
    expect(screen.getByTestId("body")).toBeInTheDocument();
  });

  it("section has id='hero' for TOC anchoring", () => {
    const { container } = render(
      <ApplicationHero parentTitleVi="K-means">
        <p>x</p>
      </ApplicationHero>
    );
    expect(container.querySelector("section#hero")).toBeInTheDocument();
  });

  it("warns when two ApplicationHeroes render inside one SectionDuplicateGuard", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <SectionDuplicateGuard>
        <ApplicationHero parentTitleVi="K-means" topicSlug="k-means-in-music-recs">
          <p>first</p>
        </ApplicationHero>
        <ApplicationHero parentTitleVi="K-means" topicSlug="k-means-in-music-recs">
          <p>second</p>
        </ApplicationHero>
      </SectionDuplicateGuard>
    );
    // useEffect registers after commit; wait a tick for the warning to surface
    await new Promise((r) => setTimeout(r, 0));
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate "hero" section')
    );
    warn.mockRestore();
  });
});
