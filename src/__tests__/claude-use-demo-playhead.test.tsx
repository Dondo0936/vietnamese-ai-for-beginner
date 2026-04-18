import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDemoPlayhead } from "@/features/claude/useDemoPlayhead";

describe("useDemoPlayhead", () => {
  it("starts at playhead=0 playing=false", () => {
    const { result } = renderHook(() => useDemoPlayhead({ duration: 1000 }));
    expect(result.current.playhead).toBe(0);
    expect(result.current.playing).toBe(false);
  });

  it("onPlay flips playing=true", () => {
    const { result } = renderHook(() => useDemoPlayhead({ duration: 1000 }));
    act(() => result.current.onPlay());
    expect(result.current.playing).toBe(true);
  });

  it("onReset returns to playhead=0 playing=false", () => {
    const { result } = renderHook(() => useDemoPlayhead({ duration: 1000 }));
    act(() => {
      result.current.onPlay();
      result.current.onReset();
    });
    expect(result.current.playhead).toBe(0);
    expect(result.current.playing).toBe(false);
  });

  it("onStep nudges playhead forward by the configured step (default 0.1)", () => {
    const { result } = renderHook(() => useDemoPlayhead({ duration: 1000 }));
    act(() => result.current.onStep());
    expect(result.current.playhead).toBeCloseTo(0.1);
  });

  it("onStep clamps at 1.0", () => {
    const { result } = renderHook(() => useDemoPlayhead({ duration: 1000, step: 0.4 }));
    act(() => { result.current.onStep(); result.current.onStep(); result.current.onStep(); });
    expect(result.current.playhead).toBeCloseTo(1);
    act(() => result.current.onStep());
    expect(result.current.playhead).toBeCloseTo(1);
  });

  it("onPlay toggles pause when already playing", () => {
    const { result } = renderHook(() => useDemoPlayhead({ duration: 1000 }));
    act(() => result.current.onPlay()); // play
    act(() => result.current.onPlay()); // pause
    expect(result.current.playing).toBe(false);
  });
});
