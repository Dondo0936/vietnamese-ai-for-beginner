/**
 * Primitive contracts — DOM-level invariants.
 *
 * These are paired with static contracts in `contracts.test.ts`. Together
 * they enforce `docs/CONTRACTS.md` section 3.
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import InlineChallenge from "@/components/interactive/InlineChallenge";
import SliderGroup from "@/components/interactive/SliderGroup";
import { DraggableDot, HITBOX_R } from "@/components/interactive/DraggableDot";
import { MetricReadout } from "@/components/interactive/MetricReadout";

// ─── InlineChallenge retry flow ─────────────────────────────────────
describe("Contract 3.1: InlineChallenge retry after wrong answer", () => {
  const baseProps = {
    question: "2 + 2 = ?",
    options: ["3", "4", "5"],
    correct: 1,
    explanation: "Phép cộng cơ bản.",
  };

  it("clicking a wrong answer surfaces a retry affordance", () => {
    render(<InlineChallenge {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /A\.?\s*3/ }));
    // A retry button must appear — accept "Thử lại" label or role=button
    // with name matching retry Vietnamese/English.
    const retry = screen.queryByRole("button", { name: /thử lại|làm lại|retry/i });
    expect(retry).not.toBeNull();
  });

  it("clicking retry re-enables all option buttons", () => {
    render(<InlineChallenge {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /A\.?\s*3/ }));
    const retry = screen.getByRole("button", { name: /thử lại|làm lại|retry/i });
    fireEvent.click(retry);

    // All three option buttons must now be enabled.
    const a = screen.getByRole("button", { name: /A\.?\s*3/ });
    const b = screen.getByRole("button", { name: /B\.?\s*4/ });
    const c = screen.getByRole("button", { name: /C\.?\s*5/ });
    expect(a).not.toBeDisabled();
    expect(b).not.toBeDisabled();
    expect(c).not.toBeDisabled();
  });

  it("correct answer does NOT show retry (no regression after success)", () => {
    render(<InlineChallenge {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /B\.?\s*4/ }));
    const retry = screen.queryByRole("button", { name: /thử lại|làm lại|retry/i });
    expect(retry).toBeNull();
  });
});

// ─── SliderGroup reset ──────────────────────────────────────────────
describe("Contract 3.2: SliderGroup reset restores defaults", () => {
  const sliders = [
    { key: "alpha", label: "Alpha", min: 0, max: 10, defaultValue: 5 },
    { key: "beta", label: "Beta", min: 0, max: 100, defaultValue: 50 },
  ];

  it("renders a reset button when showReset is true", () => {
    render(
      <SliderGroup
        sliders={sliders}
        showReset
        visualization={(v) => <span data-testid="viz">{JSON.stringify(v)}</span>}
      />
    );
    expect(
      screen.queryByRole("button", { name: /đặt lại|reset/i })
    ).not.toBeNull();
  });

  it("clicking reset restores every slider to its defaultValue", () => {
    render(
      <SliderGroup
        sliders={sliders}
        showReset
        visualization={(v) => <span data-testid="viz">{JSON.stringify(v)}</span>}
      />
    );

    const inputs = screen.getAllByRole("slider") as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: "8" } });
    fireEvent.change(inputs[1], { target: { value: "90" } });
    expect(inputs[0].value).toBe("8");
    expect(inputs[1].value).toBe("90");

    fireEvent.click(
      screen.getByRole("button", { name: /đặt lại|reset/i })
    );

    expect(inputs[0].value).toBe("5");
    expect(inputs[1].value).toBe("50");
  });

  it("does NOT render reset by default (backwards compatibility)", () => {
    render(
      <SliderGroup
        sliders={sliders}
        visualization={(v) => <span data-testid="viz">{JSON.stringify(v)}</span>}
      />
    );
    expect(screen.queryByRole("button", { name: /đặt lại|reset/i })).toBeNull();
  });
});

// ─── DraggableDot accessibility + hitbox ────────────────────────────
describe("Contract 3.3: DraggableDot primitive", () => {
  function Wrap() {
    const ref = React.useRef<SVGSVGElement>(null);
    return (
      <svg ref={ref} viewBox="0 0 100 100" width={300} height={300}>
        <DraggableDot
          cx={50}
          cy={50}
          r={6}
          svgRef={ref}
          onMove={() => {}}
          label="điểm kéo"
          valueText="x=50, y=50"
        />
      </svg>
    );
  }

  it("renders an invisible hitbox with radius ≥ HITBOX_R (18)", () => {
    const { container } = render(<Wrap />);
    const circles = container.querySelectorAll("circle");
    // 2 circles: visible (first) + hitbox (second). Hitbox r ≥ HITBOX_R.
    expect(circles.length).toBe(2);
    const hitbox = circles[1];
    const radius = parseFloat(hitbox.getAttribute("r") ?? "0");
    expect(radius).toBeGreaterThanOrEqual(HITBOX_R);
    expect(HITBOX_R).toBeGreaterThanOrEqual(18);
  });

  it("hitbox is keyboard-focusable with slider role + aria-label", () => {
    render(<Wrap />);
    const slider = screen.getByRole("slider", { name: /điểm kéo/ });
    expect(slider).toHaveAttribute("tabindex", "0");
    expect(slider).toHaveAttribute("aria-valuetext", "x=50, y=50");
  });
});

// ─── MetricReadout aria-live ────────────────────────────────────────
describe("Contract 3.4: MetricReadout", () => {
  it('wraps in aria-live="polite"', () => {
    const { container } = render(<MetricReadout label="MSE" value={0.123} />);
    const live = container.querySelector("[aria-live='polite']");
    expect(live).not.toBeNull();
    expect(live!.textContent).toContain("MSE");
    expect(live!.textContent).toContain("0.123");
  });

  it("applies a number formatter when provided", () => {
    const { container } = render(
      <MetricReadout label="Hệ số" value={0.12345} format={(v) => v.toFixed(2)} />
    );
    expect(container.textContent).toContain("0.12");
    expect(container.textContent).not.toContain("0.12345");
  });
});
