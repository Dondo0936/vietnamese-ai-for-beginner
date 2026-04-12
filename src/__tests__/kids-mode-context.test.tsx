import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KidsModeProvider, useKidsMode } from "@/lib/kids/mode-context";

function Probe() {
  const { tier, audioNarration, setAudioNarration } = useKidsMode();
  return (
    <div>
      <span data-testid="tier">{tier ?? "none"}</span>
      <span data-testid="audio">{audioNarration ? "on" : "off"}</span>
      <button onClick={() => setAudioNarration(!audioNarration)}>toggle</button>
    </div>
  );
}

describe("KidsModeProvider", () => {
  it("defaults to no tier and audio narration off when tier is null", () => {
    render(
      <KidsModeProvider>
        <Probe />
      </KidsModeProvider>
    );
    expect(screen.getByTestId("tier")).toHaveTextContent("none");
    expect(screen.getByTestId("audio")).toHaveTextContent("off");
  });

  it("defaults audio narration to 'on' when tier is nhi", () => {
    render(
      <KidsModeProvider initialTier="nhi">
        <Probe />
      </KidsModeProvider>
    );
    expect(screen.getByTestId("tier")).toHaveTextContent("nhi");
    expect(screen.getByTestId("audio")).toHaveTextContent("on");
  });

  it("defaults audio narration to 'off' when tier is teen", () => {
    render(
      <KidsModeProvider initialTier="teen">
        <Probe />
      </KidsModeProvider>
    );
    expect(screen.getByTestId("tier")).toHaveTextContent("teen");
    expect(screen.getByTestId("audio")).toHaveTextContent("off");
  });

  it("lets consumers toggle audio narration", async () => {
    const user = userEvent.setup();
    render(
      <KidsModeProvider initialTier="teen">
        <Probe />
      </KidsModeProvider>
    );
    expect(screen.getByTestId("audio")).toHaveTextContent("off");
    await user.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("audio")).toHaveTextContent("on");
  });
});
