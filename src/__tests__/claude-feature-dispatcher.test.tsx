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

describe("/claude/[feature] dispatcher", () => {
  it("generateStaticParams returns 24 slugs", async () => {
    const params = await generateStaticParams();
    expect(params).toHaveLength(24);
    expect(params[0]).toHaveProperty("feature");
  });

  it("renders the TilePlaceholder title for a known planned slug", async () => {
    // Use a slug that's still "planned" — the dispatcher delegates to
    // TilePlaceholder which synchronously renders the title. Tiles flipped
    // to "ready" resolve to `next/dynamic` components whose body requires
    // Suspense to resolve and so aren't accessible synchronously here.
    const node = await ClaudeFeaturePage({
      params: Promise.resolve({ feature: "projects" }),
    });
    render(node);
    expect(
      screen.getByRole("heading", { name: /Projects/ })
    ).toBeInTheDocument();
  });

  it("calls notFound for an unknown slug", async () => {
    await expect(
      ClaudeFeaturePage({ params: Promise.resolve({ feature: "ghost" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
