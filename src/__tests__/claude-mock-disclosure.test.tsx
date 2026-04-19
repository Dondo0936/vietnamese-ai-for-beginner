import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { ClaudeDesktopShell } from "@/features/claude/components/ClaudeDesktopShell";
import { ViewRealUI } from "@/features/claude/components/ViewRealUI";

describe("Mock disclosure", () => {
  it("renders the 'Mô phỏng' badge on ClaudeDesktopShell by default", () => {
    render(
      <ClaudeDesktopShell
        topBar={<div>tb</div>}
        main={<div>m</div>}
      />
    );
    // Badge text is visible — sighted disclosure.
    expect(screen.getByText("Mô phỏng")).toBeInTheDocument();
    // And carries an accessible description for AT users.
    expect(
      screen.getByRole("note", { name: /Bản mô phỏng giao diện Claude/i })
    ).toBeInTheDocument();
  });

  it("hides the badge when showMockBadge is false", () => {
    render(
      <ClaudeDesktopShell
        topBar={<div>tb</div>}
        main={<div>m</div>}
        showMockBadge={false}
      />
    );
    expect(screen.queryByText("Mô phỏng")).toBeNull();
  });

  it("stamps the badge tooltip with the given snapshot date", () => {
    render(
      <ClaudeDesktopShell
        topBar={<div>tb</div>}
        main={<div>m</div>}
        mockBadgeDate="2026-05-30"
      />
    );
    // The accessible name includes the date so the user/AT knows how fresh
    // the simulation is.
    expect(
      screen.getByRole("note", { name: /2026-05-30/ })
    ).toBeInTheDocument();
  });

  it("renders ViewRealUI as an external anchor pointing to the given Anthropic URL", () => {
    render(
      <ViewRealUI
        href="https://www.claude.com/claude"
        caption="Ảnh chụp trang sản phẩm Claude."
      />
    );
    const link = screen.getByRole("link", {
      name: /Xem ảnh chụp thật từ Anthropic/,
    });
    expect(link).toHaveAttribute("href", "https://www.claude.com/claude");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Ảnh chụp trang sản phẩm Claude.")).toBeInTheDocument();
  });
});
