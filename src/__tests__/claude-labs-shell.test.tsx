import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ClaudeLabsShell,
  LabsBetaChip,
} from "@/features/claude/components/ClaudeLabsShell";

describe("ClaudeLabsShell", () => {
  it("renders the body slot", () => {
    render(
      <ClaudeLabsShell
        topBar={<div data-testid="top">top</div>}
        body={<div data-testid="body">labs canvas here</div>}
      />
    );
    expect(screen.getByTestId("body")).toBeInTheDocument();
    expect(screen.getByTestId("top")).toBeInTheDocument();
  });

  it("exposes role=figure with the Vietnamese Labs aria-label", () => {
    render(
      <ClaudeLabsShell topBar={<div />} body={<div />} />
    );
    expect(
      screen.getByRole("figure", {
        name: /Bản mô phỏng giao diện Claude Labs/,
      })
    ).toBeInTheDocument();
  });

  it("renders the Mock badge by default", () => {
    render(<ClaudeLabsShell topBar={<div />} body={<div />} />);
    expect(screen.getByText("Mô phỏng")).toBeInTheDocument();
  });

  it("hides the Mock badge when showMockBadge={false}", () => {
    render(
      <ClaudeLabsShell
        topBar={<div />}
        body={<div />}
        showMockBadge={false}
      />
    );
    expect(screen.queryByText("Mô phỏng")).toBeNull();
  });

  it("LabsBetaChip renders with default label", () => {
    render(<LabsBetaChip />);
    expect(screen.getByText(/Labs · Beta/)).toBeInTheDocument();
  });
});
