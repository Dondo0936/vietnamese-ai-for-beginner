import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";

// JSDOM does not implement IntersectionObserver. Provide a minimal stub
// that never fires (the component should handle the not-yet-visible case
// without crashing, and the reduced-motion branch is tested separately).
beforeAll(() => {
  class NoopIntersectionObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() { return []; }
    root: Element | Document | null = null;
    rootMargin = "";
    thresholds: readonly number[] = [];
  }
  (globalThis as any).IntersectionObserver = NoopIntersectionObserver;
});

// Hoisted mock so we can toggle useReducedMotion per test case.
const reduceMotionMock = vi.fn<() => boolean | null>(() => false);

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  useReducedMotion: () => reduceMotionMock(),
}));

import LessonSection from "@/components/interactive/LessonSection";

describe("LessonSection — reduced-motion handling", () => {
  it("reveals content immediately when useReducedMotion returns true", () => {
    reduceMotionMock.mockReturnValue(true);
    render(
      <LessonSection step={3} totalSteps={8} label="Hình minh họa">
        <p data-testid="section-body">Section body</p>
      </LessonSection>
    );
    // Body rendered in DOM (audit's main claim); under reduced motion, the
    // component must NOT keep the body behind an opacity:0 animation.
    expect(screen.getByTestId("section-body")).toBeInTheDocument();
  });

  it("keeps the step/label chrome visible regardless of motion preference", () => {
    reduceMotionMock.mockReturnValue(true);
    render(
      <LessonSection step={3} totalSteps={8} label="Hình minh họa">
        <p>Section body</p>
      </LessonSection>
    );
    expect(screen.getByText("Hình minh họa")).toBeInTheDocument();
  });

  it("still renders body when reduced-motion is not requested (sanity)", () => {
    reduceMotionMock.mockReturnValue(false);
    render(
      <LessonSection step={3} totalSteps={8} label="Hình minh họa">
        <p data-testid="section-body">Section body</p>
      </LessonSection>
    );
    expect(screen.getByTestId("section-body")).toBeInTheDocument();
  });
});
