import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import * as fm from "framer-motion";
import AccentHueSweep from "@/features/claude/AccentHueSweep";

// Spy-enable the framer-motion module so vi.spyOn can stub useReducedMotion.
// Without { spy: true }, ESM namespace exports are frozen and not configurable.
vi.mock("framer-motion", { spy: true });

describe("AccentHueSweep", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders children inline with lang attr when provided", () => {
    render(<AccentHueSweep lang="vi">hình ảnh và ví dụ</AccentHueSweep>);
    const el = screen.getByText("hình ảnh và ví dụ");
    expect(el.tagName).toBe("SPAN");
    expect(el.getAttribute("lang")).toBe("vi");
  });

  it("applies animated gradient when reduced motion is off", () => {
    vi.spyOn(fm, "useReducedMotion").mockReturnValue(false);
    render(<AccentHueSweep>hi</AccentHueSweep>);
    const el = screen.getByText("hi");
    expect(el.className).toContain("animate-[hue-sweep");
  });

  it("applies static gradient when reduced motion is on", () => {
    vi.spyOn(fm, "useReducedMotion").mockReturnValue(true);
    render(<AccentHueSweep>hi</AccentHueSweep>);
    const el = screen.getByText("hi");
    expect(el.className).not.toContain("animate-");
  });
});
