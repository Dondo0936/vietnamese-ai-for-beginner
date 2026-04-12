import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import {
  SectionDuplicateGuard,
  useSectionGuard,
} from "@/components/topic/SectionDuplicateGuard";

// Minimal consumer that calls the hook and renders nothing visible.
function ProbeSection({ id }: { id: "visualization" | "explanation" }) {
  useSectionGuard(id, "test-topic-slug");
  return <div data-section-id={id} />;
}

describe("SectionDuplicateGuard", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("stays silent when a section id appears exactly once", () => {
    render(
      <SectionDuplicateGuard>
        <ProbeSection id="visualization" />
        <ProbeSection id="explanation" />
      </SectionDuplicateGuard>
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("warns on the second instance of the same section id", () => {
    render(
      <SectionDuplicateGuard>
        <ProbeSection id="visualization" />
        <ProbeSection id="visualization" />
      </SectionDuplicateGuard>
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const msg = String(warnSpy.mock.calls[0][0]);
    expect(msg).toContain("visualization");
    expect(msg).toContain("test-topic-slug");
  });

  it("tracks visualization and explanation independently", () => {
    render(
      <SectionDuplicateGuard>
        <ProbeSection id="visualization" />
        <ProbeSection id="explanation" />
        <ProbeSection id="visualization" />
        <ProbeSection id="explanation" />
      </SectionDuplicateGuard>
    );
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("is a no-op when used outside a provider (no warn, no crash)", () => {
    render(<ProbeSection id="visualization" />);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
