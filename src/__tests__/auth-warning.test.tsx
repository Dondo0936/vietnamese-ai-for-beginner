import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
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

// Capture the subscriber registered by the banner so the test can simulate
// a write-intent failure emission from database.ts.
let capturedListener: (() => void) | null = null;
vi.mock("@/lib/database", () => ({
  subscribeToAuthIntentFailure: (listener: () => void) => {
    capturedListener = listener;
    return () => {
      capturedListener = null;
    };
  },
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({
    user: null,
    isAnonymous: true,
    isAuthenticated: false,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signUpGoogle: vi.fn(),
    signInGoogle: vi.fn(),
    signOut: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  capturedListener = null;
  for (const k in store) delete store[k];
});

import AuthWarningBanner from "@/components/ui/AuthWarningBanner";

describe("AuthWarningBanner", () => {
  it("stays hidden on first mount for signed-out users", () => {
    render(<AuthWarningBanner />);
    expect(screen.queryByText(/tiến độ chưa được sao lưu/i)).toBeNull();
  });

  it("shows after a write-intent failure is emitted", () => {
    render(<AuthWarningBanner />);
    expect(capturedListener).toBeTypeOf("function");
    act(() => {
      capturedListener?.();
    });
    expect(screen.getByText(/tiến độ chưa được sao lưu/i)).toBeInTheDocument();
  });

  it("can be dismissed after surfacing", async () => {
    const user = userEvent.setup();
    render(<AuthWarningBanner />);
    act(() => {
      capturedListener?.();
    });

    const dismissBtn = screen.getByRole("button", { name: /đã hiểu/i });
    await user.click(dismissBtn);

    expect(screen.queryByText(/tiến độ chưa được sao lưu/i)).toBeNull();
  });
});
