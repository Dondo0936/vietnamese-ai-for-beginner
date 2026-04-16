import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ApplicationMetrics from "@/components/application/ApplicationMetrics";
import Metric from "@/components/application/Metric";
import type { SourceLink } from "@/lib/types";

const sources: SourceLink[] = [
  {
    title: "Spotify Engineering Blog",
    publisher: "Spotify Engineering",
    url: "https://e.example.com",
    date: "2016-03",
    kind: "engineering-blog",
  },
  {
    title: "NeurIPS Paper",
    publisher: "NeurIPS",
    url: "https://p.example.com",
    date: "2020",
    kind: "paper",
  },
];

describe("<ApplicationMetrics>", () => {
  it("renders heading 'Con số thật'", () => {
    render(
      <ApplicationMetrics sources={sources}>
        <Metric value="500 triệu người dùng" sourceRef={1} />
      </ApplicationMetrics>
    );
    expect(
      screen.getByRole("heading", { name: "Con số thật" })
    ).toBeInTheDocument();
  });

  it("section has id='metrics' for TOC anchoring", () => {
    const { container } = render(
      <ApplicationMetrics sources={sources}>
        <Metric value="A" sourceRef={1} />
      </ApplicationMetrics>
    );
    expect(container.querySelector("section#metrics")).toBeInTheDocument();
  });

  it("renders each metric with a link to its source by ref number", () => {
    render(
      <ApplicationMetrics sources={sources}>
        <Metric value="500 triệu người dùng" sourceRef={1} />
        <Metric value="40% lượt nghe" sourceRef={2} />
      </ApplicationMetrics>
    );
    const first = screen.getByText(/500 triệu người dùng/);
    expect(first.closest("li")?.querySelector("a")).toHaveAttribute(
      "href",
      "https://e.example.com"
    );
    const second = screen.getByText(/40% lượt nghe/);
    expect(second.closest("li")?.querySelector("a")).toHaveAttribute(
      "href",
      "https://p.example.com"
    );
  });

  it("source link opens in new tab with noopener noreferrer", () => {
    render(
      <ApplicationMetrics sources={sources}>
        <Metric value="x" sourceRef={1} />
      </ApplicationMetrics>
    );
    const anchor = screen.getByRole("link");
    expect(anchor).toHaveAttribute("target", "_blank");
    expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
  });
});
