import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as fm from "framer-motion";
import { DemoCanvas } from "@/features/claude/components/DemoCanvas";

// Same Vitest 4 ESM workaround we used for AccentHueSweep tests.
vi.mock("framer-motion", { spy: true });

describe("DemoCanvas", () => {
  it("calls onPlay when space is pressed", () => {
    vi.spyOn(fm, "useReducedMotion").mockReturnValue(false);
    const onPlay = vi.fn();
    render(
      <DemoCanvas title="t" onPlay={onPlay} onReset={() => {}}>
        <div>body</div>
      </DemoCanvas>
    );
    const region = screen.getByRole("region", { name: /t/i });
    region.focus();
    fireEvent.keyDown(region, { key: " " });
    expect(onPlay).toHaveBeenCalled();
  });

  it("renders a 'Xem tĩnh' skip button in reduced-motion mode", () => {
    vi.spyOn(fm, "useReducedMotion").mockReturnValue(true);
    render(
      <DemoCanvas title="t" onPlay={() => {}} onReset={() => {}}>
        <div>body</div>
      </DemoCanvas>
    );
    expect(screen.getByRole("button", { name: /Xem tĩnh/ })).toBeInTheDocument();
  });
});
