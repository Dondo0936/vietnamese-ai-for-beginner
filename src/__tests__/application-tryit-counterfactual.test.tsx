import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ApplicationTryIt from "@/components/application/ApplicationTryIt";
import ApplicationCounterfactual from "@/components/application/ApplicationCounterfactual";

describe("<ApplicationTryIt>", () => {
  it("renders heading 'Thử tự tay'", () => {
    render(
      <ApplicationTryIt>
        <div data-testid="slider">slider</div>
      </ApplicationTryIt>
    );
    expect(
      screen.getByRole("heading", { name: "Thử tự tay" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("slider")).toBeInTheDocument();
  });

  it("section has id='tryIt' for TOC anchoring", () => {
    const { container } = render(
      <ApplicationTryIt>
        <div>x</div>
      </ApplicationTryIt>
    );
    expect(container.querySelector("section#tryIt")).toBeInTheDocument();
  });
});

describe("<ApplicationCounterfactual>", () => {
  it("renders heading 'Nếu không có {parentTitleVi}, app sẽ ra sao?'", () => {
    render(
      <ApplicationCounterfactual parentTitleVi="K-means">
        <p>Spotify sẽ phải…</p>
      </ApplicationCounterfactual>
    );
    expect(
      screen.getByRole("heading", {
        name: "Nếu không có K-means, app sẽ ra sao?",
      })
    ).toBeInTheDocument();
  });

  it("section has id='counterfactual' for TOC anchoring", () => {
    const { container } = render(
      <ApplicationCounterfactual parentTitleVi="K-means">
        <p>x</p>
      </ApplicationCounterfactual>
    );
    expect(container.querySelector("section#counterfactual")).toBeInTheDocument();
  });
});
