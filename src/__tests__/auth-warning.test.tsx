import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { for (const k in store) delete store[k]; }),
  length: 0,
  key: vi.fn(() => null),
};
Object.defineProperty(globalThis, "localStorage", { value: mockLocalStorage, writable: true });

vi.mock("@/lib/progress-context", () => ({
  useProgress: () => ({
    readTopics: ["topic-a", "topic-b"],
    bookmarks: [],
    loading: false,
    toggleBookmark: vi.fn(),
    addReadTopic: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  for (const k in store) delete store[k];
});

import AuthWarningBanner from "@/components/ui/AuthWarningBanner";

describe("AuthWarningBanner", () => {
  it("shows warning when user has progress", () => {
    render(<AuthWarningBanner />);
    expect(screen.getByText(/tiến độ chưa được sao lưu/i)).toBeInTheDocument();
  });

  it("can be dismissed", async () => {
    const user = userEvent.setup();
    render(<AuthWarningBanner />);

    const dismissBtn = screen.getByRole("button", { name: /đã hiểu/i });
    await user.click(dismissBtn);

    expect(screen.queryByText(/tiến độ chưa được sao lưu/i)).toBeNull();
  });
});
