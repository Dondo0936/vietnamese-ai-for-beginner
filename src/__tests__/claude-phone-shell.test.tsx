import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClaudePhoneShell } from "@/features/claude/components/ClaudePhoneShell";

describe("ClaudePhoneShell", () => {
  it("renders children inside the phone shell", () => {
    render(
      <ClaudePhoneShell>
        <div data-testid="body">voice ui here</div>
      </ClaudePhoneShell>
    );
    expect(screen.getByTestId("body")).toBeInTheDocument();
  });

  it("exposes role=figure with the Vietnamese mobile aria-label", () => {
    render(
      <ClaudePhoneShell>
        <div />
      </ClaudePhoneShell>
    );
    expect(
      screen.getByRole("figure", {
        name: /Bản mô phỏng ứng dụng Claude trên điện thoại/,
      })
    ).toBeInTheDocument();
  });

  it("renders the Mock badge by default", () => {
    render(
      <ClaudePhoneShell>
        <div />
      </ClaudePhoneShell>
    );
    expect(screen.getByText("Mô phỏng")).toBeInTheDocument();
  });

  it("hides the Mock badge when showMockBadge={false}", () => {
    render(
      <ClaudePhoneShell showMockBadge={false}>
        <div />
      </ClaudePhoneShell>
    );
    expect(screen.queryByText("Mô phỏng")).toBeNull();
  });

  it("renders the default app title in the status bar", () => {
    render(
      <ClaudePhoneShell>
        <div />
      </ClaudePhoneShell>
    );
    expect(screen.getByText("Claude")).toBeInTheDocument();
  });
});
