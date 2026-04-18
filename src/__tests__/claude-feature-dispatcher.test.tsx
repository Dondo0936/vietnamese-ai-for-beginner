import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

import ClaudeFeaturePage, {
  generateStaticParams,
} from "@/app/claude/[feature]/page";
import { notFound } from "next/navigation";
import { tiles } from "@/features/claude/registry";

describe("/claude/[feature] dispatcher", () => {
  it("generateStaticParams returns 24 slugs", async () => {
    const params = await generateStaticParams();
    expect(params).toHaveLength(24);
    expect(params[0]).toHaveProperty("feature");
  });

  it("renders the tile's title for a known slug (via TilePlaceholder for any still-planned slug)", async () => {
    const planned = tiles.find((t) => t.status === "planned");
    if (!planned) {
      throw new Error(
        "Dispatcher test needs at least one tile with status='planned'. All tiles are ready — write a new test."
      );
    }
    const node = await ClaudeFeaturePage({
      params: Promise.resolve({ feature: planned.slug }),
    });
    render(node);
    expect(
      screen.getByRole("heading", { name: new RegExp(planned.viTitle) })
    ).toBeInTheDocument();
  });

  it("calls notFound for an unknown slug", async () => {
    await expect(
      ClaudeFeaturePage({ params: Promise.resolve({ feature: "ghost" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
