import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ApplicationLayout from "@/components/application/ApplicationLayout";
import type { TopicMeta } from "@/lib/types";

const meta: TopicMeta = {
  slug: "k-means-in-music-recs",
  title: "K-means in Music Recs",
  titleVi: "K-means trong gợi ý nhạc",
  description: "Spotify dùng K-means.",
  category: "ai-applications",
  tags: ["application"],
  difficulty: "beginner",
  relatedSlugs: ["k-means"],
  vizType: "interactive",
  applicationOf: "k-means",
  featuredApp: {
    name: "Spotify",
    productFeature: "Discover Weekly",
    company: "Spotify AB",
    countryOrigin: "SE",
  },
  sources: [
    {
      title: "How Discover Weekly Works",
      publisher: "Spotify Engineering",
      url: "https://engineering.atspotify.com/foo",
      date: "2016-03",
      kind: "engineering-blog",
    },
    {
      title: "Recs at Spotify",
      publisher: "NeurIPS",
      url: "https://arxiv.org/abs/2020.00001",
      date: "2020",
      kind: "paper",
    },
  ],
};

describe("<ApplicationLayout>", () => {
  it("renders children in order", () => {
    render(
      <ApplicationLayout metadata={meta} parentTitleVi="K-means">
        <div data-testid="first">first</div>
        <div data-testid="second">second</div>
      </ApplicationLayout>
    );
    const first = screen.getByTestId("first");
    const second = screen.getByTestId("second");
    expect(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("auto-renders SourceCard from metadata.sources", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(
      <ApplicationLayout metadata={meta} parentTitleVi="K-means">
        <div>body</div>
      </ApplicationLayout>
    );
    // The heading should exist with source count visible
    expect(screen.getByText(/Tài liệu tham khảo/)).toBeInTheDocument();
    // Open the collapsible
    const toggle = screen.getByRole("button", { name: /Tài liệu tham khảo/ });
    await user.click(toggle);
    // Now the source link should appear
    expect(
      screen.getByRole("link", { name: /How Discover Weekly Works/ })
    ).toHaveAttribute("href", "https://engineering.atspotify.com/foo");
  });

  it("renders the ribbon back-link to theory topic", () => {
    render(
      <ApplicationLayout metadata={meta} parentTitleVi="K-means" currentPath="student">
        <div>body</div>
      </ApplicationLayout>
    );
    const ribbon = screen.getByRole("link", { name: /Bài lý thuyết: K-means/ });
    expect(ribbon).toHaveAttribute("href", "/topics/k-means?path=student");
  });
});
