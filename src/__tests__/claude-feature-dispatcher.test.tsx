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

  it("renders the tile's title for a known slug", async () => {
    const node = await ClaudeFeaturePage({
      params: Promise.resolve({ feature: "chat" }),
    });
    render(node);
    expect(
      screen.getByRole("heading", { name: /Chat \+ phản hồi trực tiếp/ })
    ).toBeInTheDocument();
  });

  it("calls notFound for an unknown slug", async () => {
    await expect(
      ClaudeFeaturePage({ params: Promise.resolve({ feature: "ghost" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
