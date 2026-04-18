import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeepLinkCTA } from "@/features/claude/components/DeepLinkCTA";

describe("DeepLinkCTA", () => {
  it("URL-encodes the prompt into claude.ai/new?q=", () => {
    render(<DeepLinkCTA prompt="Viết email xin lỗi sếp vì đi trễ" />);
    const link = screen.getByRole("link", { name: /Thử trong Claude/i });
    expect(link.getAttribute("href")).toBe(
      "https://claude.ai/new?q=" +
        encodeURIComponent("Viết email xin lỗi sếp vì đi trễ")
    );
  });

  it("opens in a new tab with safe rel", () => {
    render(<DeepLinkCTA prompt="hi" />);
    const link = screen.getByRole("link", { name: /Thử trong Claude/i });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("supports a doc-link variant for non-deep-linkable features", () => {
    render(<DeepLinkCTA docHref="https://docs.claude.com/skills" label="Mở tài liệu Skills" />);
    const link = screen.getByRole("link", { name: /Mở tài liệu Skills/ });
    expect(link.getAttribute("href")).toBe("https://docs.claude.com/skills");
  });
});
