import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { User } from "@supabase/supabase-js";
import { LandingNav } from "./LandingNav";
import * as AuthCtx from "@/lib/auth-context";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

function mockAuth(overrides: Partial<ReturnType<typeof AuthCtx.useAuth>> = {}) {
  const value = {
    user: null,
    isAnonymous: false,
    isAuthenticated: false,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signUpGoogle: vi.fn(),
    signInGoogle: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
  vi.mocked(AuthCtx.useAuth).mockReturnValue(value);
  return value;
}

const MINIMAL_USER = {
  email: "x@y.z",
  user_metadata: {},
} as unknown as User;

describe("LandingNav", () => {
  it("unauthenticated: shows Đăng nhập, no account button", () => {
    mockAuth({ isAuthenticated: false, user: null, loading: false });
    render(<LandingNav />);

    expect(screen.getByText("Đăng nhập")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tài khoản" })
    ).not.toBeInTheDocument();
  });

  it("authenticated: shows account button, no Đăng nhập text", () => {
    mockAuth({
      isAuthenticated: true,
      user: MINIMAL_USER,
      loading: false,
    });
    render(<LandingNav />);

    expect(
      screen.getByRole("button", { name: "Tài khoản" })
    ).toBeInTheDocument();
    // Drawer isn't open, so it isn't rendered at all — this also proves
    // the desktop actions themselves carry no "Đăng nhập" text.
    expect(screen.queryByText("Đăng nhập")).not.toBeInTheDocument();
  });

  it("authenticated + drawer opened: shows Đăng xuất, calls signOut on click", () => {
    const auth = mockAuth({
      isAuthenticated: true,
      user: MINIMAL_USER,
      loading: false,
    });
    render(<LandingNav />);

    fireEvent.click(screen.getByRole("button", { name: "Mở menu" }));

    const logoutBtn = screen.getByText("Đăng xuất");
    expect(logoutBtn).toBeInTheDocument();

    fireEvent.click(logoutBtn);
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("loading: renders neither Đăng nhập nor Tài khoản button", () => {
    mockAuth({ loading: true });
    render(<LandingNav />);

    expect(screen.queryByText("Đăng nhập")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tài khoản" })
    ).not.toBeInTheDocument();
  });
});
