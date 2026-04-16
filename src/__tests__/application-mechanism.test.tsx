import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ApplicationMechanism from "@/components/application/ApplicationMechanism";
import Beat from "@/components/application/Beat";

describe("<ApplicationMechanism> + <Beat>", () => {
  it("interpolates concept name into heading", () => {
    render(
      <ApplicationMechanism parentTitleVi="K-means">
        <Beat step={1}>Bước một</Beat>
      </ApplicationMechanism>
    );
    expect(
      screen.getByRole("heading", { name: "Cách K-means giải quyết vấn đề" })
    ).toBeInTheDocument();
  });

  it("section has id='mechanism' for TOC anchoring", () => {
    const { container } = render(
      <ApplicationMechanism parentTitleVi="K-means">
        <Beat step={1}>x</Beat>
      </ApplicationMechanism>
    );
    expect(container.querySelector("section#mechanism")).toBeInTheDocument();
  });

  it("renders beats in order", () => {
    render(
      <ApplicationMechanism parentTitleVi="K-means">
        <Beat step={1}>Alpha</Beat>
        <Beat step={2}>Beta</Beat>
        <Beat step={3}>Gamma</Beat>
      </ApplicationMechanism>
    );
    const list = screen.getByRole("list");
    const items = list.querySelectorAll("li");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("1");
    expect(items[0]).toHaveTextContent("Alpha");
    expect(items[1]).toHaveTextContent("2");
    expect(items[1]).toHaveTextContent("Beta");
    expect(items[2]).toHaveTextContent("3");
    expect(items[2]).toHaveTextContent("Gamma");
  });
});
