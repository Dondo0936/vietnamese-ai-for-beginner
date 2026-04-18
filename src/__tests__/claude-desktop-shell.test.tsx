import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClaudeDesktopShell } from "@/features/claude/components/ClaudeDesktopShell";

describe("ClaudeDesktopShell", () => {
  it("renders all slots when provided", () => {
    render(
      <ClaudeDesktopShell
        topBar={<div data-testid="tb">tb</div>}
        leftRail={<div data-testid="lr">lr</div>}
        main={<div data-testid="main">main</div>}
        artifactsPanel={<div data-testid="ap">ap</div>}
      />
    );
    expect(screen.getByTestId("tb")).toBeInTheDocument();
    expect(screen.getByTestId("lr")).toBeInTheDocument();
    expect(screen.getByTestId("main")).toBeInTheDocument();
    expect(screen.getByTestId("ap")).toBeInTheDocument();
  });

  it("omits the artifacts panel when not provided", () => {
    render(
      <ClaudeDesktopShell
        topBar={<div>tb</div>}
        leftRail={<div>lr</div>}
        main={<div>main</div>}
      />
    );
    expect(screen.queryByRole("complementary", { name: /artifacts/i })).toBeNull();
  });

  it("exposes a shell container with data-claude-shell for testing", () => {
    const { container } = render(
      <ClaudeDesktopShell topBar={<div />} leftRail={<div />} main={<div />} />
    );
    expect(container.querySelector("[data-claude-shell]")).not.toBeNull();
  });
});
