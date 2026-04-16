import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ApplicationProblem from "@/components/application/ApplicationProblem";
import { SectionDuplicateGuard } from "@/components/topic/SectionDuplicateGuard";

describe("<ApplicationProblem>", () => {
  it("renders heading 'Vấn đề công ty cần giải quyết'", () => {
    render(
      <ApplicationProblem>
        <p>Spotify phải đề xuất 30 bài mới mỗi tuần…</p>
      </ApplicationProblem>
    );
    expect(
      screen.getByRole("heading", { name: "Vấn đề công ty cần giải quyết" })
    ).toBeInTheDocument();
  });

  it("uses section#problem for TOC anchoring", () => {
    const { container } = render(
      <ApplicationProblem>
        <p>x</p>
      </ApplicationProblem>
    );
    expect(container.querySelector("section#problem")).toBeInTheDocument();
  });

  it("warns when two ApplicationProblem sections render inside one guard", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <SectionDuplicateGuard>
        <ApplicationProblem topicSlug="k-means-in-music-recs"><p>A</p></ApplicationProblem>
        <ApplicationProblem topicSlug="k-means-in-music-recs"><p>B</p></ApplicationProblem>
      </SectionDuplicateGuard>
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate "problem" section')
    );
    warn.mockRestore();
  });
});
