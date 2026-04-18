import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }),
}));
vi.mock("@/features/claude/tiles", () => ({
  tileBodies: {
    chat: () => <div data-testid="real-chat">real chat body</div>,
  },
}));

import ClaudeFeaturePage from "@/app/claude/[feature]/page";
import { tiles } from "@/features/claude/registry";

describe("/claude/[feature] dispatcher — ready routing", () => {
  it("renders real tile body when status is ready", async () => {
    const chatTile = tiles.find((t) => t.slug === "chat")!;
    const original = chatTile.status;
    chatTile.status = "ready";
    try {
      const node = await ClaudeFeaturePage({
        params: Promise.resolve({ feature: "chat" }),
      });
      render(node);
      expect(screen.getByTestId("real-chat")).toBeInTheDocument();
    } finally {
      chatTile.status = original;
    }
  });

  it("falls back to TilePlaceholder when status is planned", async () => {
    // chat is planned by default in registry
    const node = await ClaudeFeaturePage({
      params: Promise.resolve({ feature: "projects" }), // definitely planned
    });
    render(node);
    // TilePlaceholder renders its "Đang xây dựng" eyebrow
    expect(screen.getByText(/Đang xây dựng/)).toBeInTheDocument();
  });
});
