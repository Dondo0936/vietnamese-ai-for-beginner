import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import * as fm from "framer-motion";
import type { Annotation } from "@/features/claude/types";
import { AnnotationLayer } from "@/features/claude/components/AnnotationLayer";

// Spy-enable framer-motion so we can toggle useReducedMotion per test.
// Without { spy: true } the ESM namespace exports are frozen.
vi.mock("framer-motion", { spy: true });

const fixture: Annotation[] = [
  {
    id: "a",
    pin: 1,
    label: "Token đầu",
    description: "Token đầu tiên xuất hiện ngay sau khi Enter.",
    showAt: [0, 0.3],
    anchor: { x: 50, y: 50 },
  },
  {
    id: "b",
    pin: 2,
    label: "Token cuối",
    description: "Token cuối cùng trước khi Claude dừng.",
    showAt: [0.7, 1],
    anchor: { x: 60, y: 40 },
  },
];

describe("AnnotationLayer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Default: motion OK — matches the real browser path on non-reduced
    // users. Individual tests override to exercise reduced-motion.
    vi.spyOn(fm, "useReducedMotion").mockReturnValue(false);
  });

  it("shows only annotations whose showAt contains the playhead", () => {
    render(<AnnotationLayer annotations={fixture} playhead={0.1} />);
    expect(screen.getByText("Token đầu")).toBeInTheDocument();
    expect(screen.queryByText("Token cuối")).toBeNull();
  });

  it("hides annotations outside the playhead window", () => {
    render(<AnnotationLayer annotations={fixture} playhead={0.5} />);
    expect(screen.queryByText("Token đầu")).toBeNull();
    expect(screen.queryByText("Token cuối")).toBeNull();
  });

  it("supports multiple simultaneous annotations", () => {
    render(
      <AnnotationLayer
        annotations={[
          { ...fixture[0], showAt: [0, 1] },
          { ...fixture[1], showAt: [0, 1] },
        ]}
        playhead={0.5}
      />
    );
    expect(screen.getByText("Token đầu")).toBeInTheDocument();
    expect(screen.getByText("Token cuối")).toBeInTheDocument();
  });

  it("renders pin numbers with aria-label = description for SR users", () => {
    render(<AnnotationLayer annotations={fixture} playhead={0.1} />);
    const pin = screen.getByLabelText(fixture[0].description);
    expect(pin.textContent).toBe("1");
  });

  it("shows all annotations when staticMode is true regardless of playhead", () => {
    render(
      <AnnotationLayer annotations={fixture} playhead={0} staticMode />
    );
    expect(screen.getByText("Token đầu")).toBeInTheDocument();
    expect(screen.getByText("Token cuối")).toBeInTheDocument();
  });

  it("renders the expected DOM when reduced motion is on (no motion wrappers interfere)", () => {
    vi.spyOn(fm, "useReducedMotion").mockReturnValue(true);
    render(<AnnotationLayer annotations={fixture} playhead={0.1} />);
    // Same text-based assertion still passes — reduced-motion path must
    // never change the rendered copy or aria contract.
    expect(screen.getByText("Token đầu")).toBeInTheDocument();
    expect(screen.getByLabelText(fixture[0].description).textContent).toBe(
      "1"
    );
  });

  it("treats null (pre-hydration) reduced-motion state as reduced and still renders content", () => {
    vi.spyOn(fm, "useReducedMotion").mockReturnValue(null);
    render(
      <AnnotationLayer annotations={fixture} playhead={0} staticMode />
    );
    expect(screen.getByText("Token đầu")).toBeInTheDocument();
    expect(screen.getByText("Token cuối")).toBeInTheDocument();
  });
});
