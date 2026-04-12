import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import SignInToast from "./SignInToast";
import * as AuthCtx from "@/lib/auth-context";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

const LS_KEY = "auth-toast-last-shown-at";

function mockAuth(isAnonymous: boolean) {
  vi.mocked(AuthCtx.useAuth).mockReturnValue({
    user: null,
    isAnonymous,
    isAuthenticated: false,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signUpGoogle: vi.fn(),
    signInGoogle: vi.fn(),
    signOut: vi.fn(),
  });
}

describe("SignInToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.removeItem(LS_KEY);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    localStorage.removeItem(LS_KEY);
  });

  it("renders nothing when user is not anonymous", () => {
    mockAuth(false);
    render(<SignInToast />);
    expect(screen.queryByText(/Lưu tiến độ/i)).not.toBeInTheDocument();
  });

  it("shows toast after 10 minutes when anonymous and no prior dismissal", () => {
    mockAuth(true);
    render(<SignInToast />);
    expect(screen.queryByText(/Lưu tiến độ/i)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(screen.getByText(/Lưu tiến độ/i)).toBeInTheDocument();
  });

  it("does not show toast if last shown within 24 hours", () => {
    localStorage.setItem(LS_KEY, String(Date.now() - 60 * 1000)); // 1 min ago
    mockAuth(true);
    render(<SignInToast />);

    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(screen.queryByText(/Lưu tiến độ/i)).not.toBeInTheDocument();
  });

  it("auto-dismisses after 8 seconds", () => {
    mockAuth(true);
    render(<SignInToast />);

    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });
    expect(screen.getByText(/Lưu tiến độ/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(8 * 1000);
    });
    expect(screen.queryByText(/Lưu tiến độ/i)).not.toBeInTheDocument();
  });

  it("writes timestamp to localStorage on show", () => {
    mockAuth(true);
    render(<SignInToast />);

    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(localStorage.getItem(LS_KEY)).not.toBeNull();
  });
});
