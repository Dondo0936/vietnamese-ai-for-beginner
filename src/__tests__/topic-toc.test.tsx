import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import TopicTOC from "@/components/topic/TopicTOC";
import type { TocSection } from "@/lib/types";

const reduceMotionMock = vi.fn<() => boolean | null>(() => false);

vi.mock("framer-motion", () => ({
  useReducedMotion: () => reduceMotionMock(),
}));

// Deterministic IntersectionObserver stub — tests trigger entries manually.
let ioInstances: Array<{
  callback: IntersectionObserverCallback;
  observed: Element[];
  fire: (id: string) => void;
}> = [];

class StubIntersectionObserver {
  observed: Element[] = [];
  constructor(private readonly cb: IntersectionObserverCallback) {
    ioInstances.push({
      callback: cb,
      observed: this.observed,
      fire: (id: string) => {
        const target = this.observed.find((el) => (el as HTMLElement).id === id);
        if (!target) return;
        cb(
          [{ target, isIntersecting: true } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver
        );
      },
    });
  }
  observe(el: Element) { this.observed.push(el); }
  disconnect() {}
  unobserve() {}
  takeRecords() { return []; }
  root = null;
  rootMargin = "";
  thresholds = [];
}

beforeEach(() => {
  ioInstances = [];
  reduceMotionMock.mockReset();
  reduceMotionMock.mockReturnValue(false);
  (globalThis as any).IntersectionObserver = StubIntersectionObserver;
  // JSDOM doesn't implement MutationObserver with disconnect; provide a basic one
  (globalThis as any).MutationObserver = class {
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  };
});
afterEach(() => { cleanup(); });

const SECTIONS: TocSection[] = [
  { id: "visualization", labelVi: "Minh họa" },
  { id: "explanation", labelVi: "Giải thích" },
];

function withSectionsInDOM(sections: TocSection[]) {
  sections.forEach((s) => {
    const el = document.createElement("section");
    el.id = s.id;
    document.body.appendChild(el);
  });
}

describe("TopicTOC", () => {
  it("renders the entries from the `sections` prop (not a hardcoded list)", () => {
    withSectionsInDOM(SECTIONS);
    render(<TopicTOC sections={SECTIONS} />);
    expect(screen.getAllByText("Minh họa").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Giải thích").length).toBeGreaterThan(0);
    // The old hardcoded "Ví dụ" must NOT appear
    expect(screen.queryByText("Ví dụ")).toBeNull();
  });

  it("renders a single-section TOC when given one entry (viz-less topics)", () => {
    const onlyExp: TocSection[] = [{ id: "explanation", labelVi: "Giải thích" }];
    const el = document.createElement("section");
    el.id = "explanation";
    document.body.appendChild(el);
    render(<TopicTOC sections={onlyExp} />);
    expect(screen.queryByText("Minh họa")).toBeNull();
    expect(screen.getAllByText("Giải thích").length).toBeGreaterThan(0);
  });

  it("exposes a11y landmarks (nav role + aria-label)", () => {
    withSectionsInDOM(SECTIONS);
    render(<TopicTOC sections={SECTIONS} />);
    const navs = screen.getAllByRole("navigation", { name: /mục lục/i });
    expect(navs.length).toBeGreaterThan(0);
  });

  it("highlights the active section when observer fires", () => {
    withSectionsInDOM(SECTIONS);
    render(<TopicTOC sections={SECTIONS} />);
    act(() => { ioInstances[0].fire("explanation"); });
    const active = screen.getAllByRole("link", { current: "location" });
    expect(active.length).toBeGreaterThan(0);
    expect(active[0].textContent).toContain("Giải thích");
  });

  it("scrolls to section when entry is clicked", () => {
    withSectionsInDOM(SECTIONS);
    const scrollSpy = vi.fn();
    const el = document.getElementById("visualization")!;
    el.scrollIntoView = scrollSpy;
    render(<TopicTOC sections={SECTIONS} />);
    fireEvent.click(screen.getAllByText("Minh họa")[0]);
    expect(scrollSpy).toHaveBeenCalled();
  });

  it("renders nothing when sections is empty (topic opted out)", () => {
    const { container } = render(<TopicTOC sections={[]} />);
    expect(container.querySelector('[role="navigation"]')).toBeNull();
  });
});
