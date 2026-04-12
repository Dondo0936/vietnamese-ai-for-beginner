# Auth Sign-up / Sign-in Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional sign-up / sign-in (email+password + Google OAuth) so users can persist learning progress across devices, keeping the existing anonymous-auth UX intact for unregistered users.

**Architecture:** Client-side only. Leverages Supabase's anonymous-to-permanent user upgrade flow so the user_id UUID is preserved, eliminating data migration. A React context (`AuthProvider`) wraps Supabase auth and fires on `onAuthStateChange`. The existing `ProgressProvider` re-fetches on user-id change. Email signup follows Supabase's two-step flow (`updateUser({ email })` → verify → `updateUser({ password })`), with the password temporarily stored in sessionStorage.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, `@supabase/ssr`, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-04-12-auth-signup-signin-design.md`

**Pre-work (manual, by user):** Supabase dashboard configuration — see Task 10 checklist. These are one-time settings that enable the code to work.

---

## File Structure

| Path | Status | Responsibility |
|---|---|---|
| `src/lib/auth-errors.ts` | NEW | Maps Supabase error codes to Vietnamese user-facing messages |
| `src/lib/auth-errors.test.ts` | NEW | Unit tests for error mapping |
| `src/lib/auth-context.tsx` | NEW | `AuthProvider` + `useAuth()` hook — wraps Supabase auth state |
| `src/components/auth/AuthModal.tsx` | NEW | Sign-in / Sign-up modal, portal-rendered |
| `src/components/auth/AuthButton.tsx` | NEW | Navbar slot: "Đăng nhập" button (anon) or avatar dropdown (authenticated) |
| `src/components/auth/SignInToast.tsx` | NEW | 10-min delayed nudge toast, bottom-right |
| `src/components/auth/SignInToast.test.tsx` | NEW | Unit tests for toast timer + throttle logic |
| `src/app/auth/callback/page.tsx` | NEW | Email confirmation callback — exchanges code, sets password |
| `src/components/layout/AppShell.tsx` | MODIFY | Wrap with `AuthProvider`, mount `SignInToast` |
| `src/components/layout/Navbar.tsx` | MODIFY | Add `AuthButton` slot |
| `src/lib/progress-context.tsx` | MODIFY | Subscribe to auth changes, reload on user-id change |
| `CONTRIBUTING.md` | MODIFY | Document Supabase dashboard setup |

---

## Task 1: Error message mapping + tests

**Files:**
- Create: `src/lib/auth-errors.ts`
- Create: `src/lib/auth-errors.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/auth-errors.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { mapAuthError } from "./auth-errors";

describe("mapAuthError", () => {
  it("maps 'User already registered' to Vietnamese prompt to sign in", () => {
    expect(mapAuthError({ message: "User already registered" })).toBe(
      "Email đã được đăng ký. Thử đăng nhập?"
    );
  });

  it("maps 'Invalid login credentials' to Vietnamese error", () => {
    expect(mapAuthError({ message: "Invalid login credentials" })).toBe(
      "Sai email hoặc mật khẩu."
    );
  });

  it("maps 'Password should be at least 6 characters' to Vietnamese", () => {
    expect(
      mapAuthError({ message: "Password should be at least 6 characters" })
    ).toBe("Mật khẩu tối thiểu 6 ký tự.");
  });

  it("maps rate limit errors to wait-60s message", () => {
    expect(
      mapAuthError({ message: "Email rate limit exceeded" })
    ).toBe("Quá nhiều yêu cầu. Vui lòng đợi 60 giây.");
  });

  it("returns generic message for unknown errors", () => {
    expect(mapAuthError({ message: "Some unknown error" })).toBe(
      "Đã có lỗi. Vui lòng thử lại."
    );
  });

  it("handles null/undefined gracefully", () => {
    expect(mapAuthError(null)).toBe("Đã có lỗi. Vui lòng thử lại.");
    expect(mapAuthError({ message: "" })).toBe("Đã có lỗi. Vui lòng thử lại.");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/auth-errors.test.ts`
Expected: FAIL with "Cannot find module './auth-errors'" or similar.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/auth-errors.ts`:

```typescript
interface SupabaseLikeError {
  message?: string;
}

export function mapAuthError(error: SupabaseLikeError | null | undefined): string {
  if (!error || !error.message) return "Đã có lỗi. Vui lòng thử lại.";

  const msg = error.message.toLowerCase();

  if (msg.includes("already registered")) return "Email đã được đăng ký. Thử đăng nhập?";
  if (msg.includes("invalid login credentials")) return "Sai email hoặc mật khẩu.";
  if (msg.includes("password should be at least")) return "Mật khẩu tối thiểu 6 ký tự.";
  if (msg.includes("invalid email") || msg.includes("unable to validate email")) return "Email không hợp lệ.";
  if (msg.includes("rate limit")) return "Quá nhiều yêu cầu. Vui lòng đợi 60 giây.";
  if (msg.includes("network") || msg.includes("fetch")) return "Không có kết nối mạng.";
  if (msg.includes("otp") && msg.includes("expired")) return "Liên kết đã hết hạn. Vui lòng đăng ký lại.";

  return "Đã có lỗi. Vui lòng thử lại.";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/auth-errors.test.ts`
Expected: PASS (6/6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth-errors.ts src/lib/auth-errors.test.ts
git commit -m "feat(auth): add error message mapper with tests"
```

---

## Task 2: AuthProvider + useAuth() hook

**Files:**
- Create: `src/lib/auth-context.tsx`

- [ ] **Step 1: Create the context file**

```tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase";
import { mapAuthError } from "./auth-errors";

interface AuthContextValue {
  user: User | null;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUpGoogle: () => Promise<{ error?: string }>;
  signInGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const DEFAULT: AuthContextValue = {
  user: null,
  isAnonymous: false,
  isAuthenticated: false,
  loading: true,
  signUp: async () => ({ error: "Auth not initialized" }),
  signIn: async () => ({ error: "Auth not initialized" }),
  signUpGoogle: async () => ({ error: "Auth not initialized" }),
  signInGoogle: async () => ({ error: "Auth not initialized" }),
  signOut: async () => {},
};

const AuthContext = createContext<AuthContextValue>(DEFAULT);

const PENDING_PASSWORD_PREFIX = "pending-password-";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Initial fetch
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    if (!supabase) return { error: "Supabase chưa được cấu hình." };

    // Stash password in sessionStorage — the callback page will use it after email verification
    try {
      sessionStorage.setItem(PENDING_PASSWORD_PREFIX + email.toLowerCase(), password);
    } catch {
      // sessionStorage unavailable — continue; user will see password form on callback page
    }

    const { error } = await supabase.auth.updateUser({ email });
    if (error) {
      // Clean up stashed password if signup failed
      try {
        sessionStorage.removeItem(PENDING_PASSWORD_PREFIX + email.toLowerCase());
      } catch {}
      return { error: mapAuthError(error) };
    }
    return {};
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    if (!supabase) return { error: "Supabase chưa được cấu hình." };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: mapAuthError(error) };
    return {};
  }, []);

  const signUpGoogle = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return { error: "Supabase chưa được cấu hình." };

    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
    if (error) return { error: mapAuthError(error) };
    return {};
  }, []);

  const signInGoogle = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return { error: "Supabase chưa được cấu hình." };

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
    if (error) return { error: mapAuthError(error) };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const isAnonymous = user?.is_anonymous === true;
  const isAuthenticated = user !== null && !isAnonymous;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAnonymous,
        isAuthenticated,
        loading,
        signUp,
        signIn,
        signUpGoogle,
        signInGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/auth-context.tsx
git commit -m "feat(auth): add AuthProvider and useAuth hook"
```

---

## Task 3: Update ProgressProvider to reload on auth change

**Files:**
- Modify: `src/lib/progress-context.tsx:29-37`

- [ ] **Step 1: Replace the useEffect block**

Replace lines 29-37 in `src/lib/progress-context.tsx` (the current one-time `useEffect` that only loads on mount) with:

```tsx
  useEffect(() => {
    const supabase = createClient();

    async function load() {
      setLoading(true);
      const progress = await getUserProgress();
      setReadTopics(progress.readTopics);
      setBookmarks(progress.bookmarks);
      setLoading(false);
    }

    load();

    if (!supabase) return;

    // Reload whenever the active user changes (sign-in, sign-out, or anon → permanent)
    let lastUserId: string | null = null;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null;
      if (nextUserId !== lastUserId) {
        lastUserId = nextUserId;
        load();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);
```

Also add this import near the top of the file (with the other imports):

```tsx
import { createClient } from "./supabase";
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/progress-context.tsx
git commit -m "feat(progress): reload progress on auth state change"
```

---

## Task 4: AuthModal component

**Files:**
- Create: `src/components/auth/AuthModal.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type Tab = "signin" | "signup";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: Tab;
}

export default function AuthModal({
  open,
  onClose,
  defaultTab = "signin",
}: AuthModalProps) {
  const { signIn, signUp, signUpGoogle, signInGoogle } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      setError(null);
      setSignupSuccess(false);
    }
  }, [open, defaultTab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!email.includes("@")) {
        setError("Email không hợp lệ.");
        return;
      }
      if (password.length < 6) {
        setError("Mật khẩu tối thiểu 6 ký tự.");
        return;
      }

      setSubmitting(true);
      const result =
        tab === "signup"
          ? await signUp(email, password)
          : await signIn(email, password);
      setSubmitting(false);

      if (result.error) {
        // If signup error says email already registered, auto-switch to sign-in tab
        if (tab === "signup" && result.error.includes("đã được đăng ký")) {
          setTab("signin");
          setError(result.error);
          return;
        }
        setError(result.error);
        return;
      }

      if (tab === "signup") {
        setSignupSuccess(true);
      } else {
        onClose();
      }
    },
    [email, password, tab, signUp, signIn, onClose]
  );

  const handleGoogle = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    const result = tab === "signup" ? await signUpGoogle() : await signInGoogle();
    setSubmitting(false);
    if (result.error) setError(result.error);
    // On success, the browser navigates to Google — nothing more to do here
  }, [tab, signUpGoogle, signInGoogle]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] cmd-backdrop flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with tabs */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex gap-2" id="auth-modal-title">
            <button
              type="button"
              onClick={() => {
                setTab("signin");
                setError(null);
                setSignupSuccess(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === "signin"
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setError(null);
                setSignupSuccess(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === "signup"
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Đăng ký
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:text-foreground hover:bg-surface transition-colors"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {signupSuccess ? (
            <div className="text-center space-y-3 py-4">
              <Mail size={32} className="text-accent mx-auto" />
              <h3 className="text-base font-semibold text-foreground">
                Vui lòng kiểm tra email
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                Chúng tôi đã gửi liên kết xác nhận đến{" "}
                <strong className="text-foreground">{email}</strong>. Nhấn vào
                liên kết để hoàn tất đăng ký.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Đóng
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-hover transition-colors disabled:opacity-50"
              >
                <GoogleIcon />
                Tiếp tục với Google
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-tertiary">hoặc</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block">
                  <span className="block text-xs font-medium text-muted mb-1">
                    Email
                  </span>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary"
                    />
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm text-foreground outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-colors"
                      placeholder="you@example.com"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="block text-xs font-medium text-muted mb-1">
                    Mật khẩu
                  </span>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary"
                    />
                    <input
                      type="password"
                      autoComplete={
                        tab === "signup" ? "new-password" : "current-password"
                      }
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-sm text-foreground outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-colors"
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </div>
                </label>

                {error && (
                  <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {tab === "signup" ? "Đăng ký" : "Đăng nhập"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/AuthModal.tsx
git commit -m "feat(auth): add AuthModal with email/password + Google tabs"
```

---

## Task 5: AuthButton for navbar

**Files:**
- Create: `src/components/auth/AuthButton.tsx`
- Modify: `src/components/layout/Navbar.tsx:52` (add `<AuthButton />` before `<ThemeToggle />`)

- [ ] **Step 1: Write AuthButton**

Create `src/components/auth/AuthButton.tsx`:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "./AuthModal";

export default function AuthButton() {
  const { user, isAnonymous, isAuthenticated, signOut, loading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [dropdownOpen]);

  if (loading) {
    return <div className="w-[74px] h-9" aria-hidden />;
  }

  if (isAuthenticated && user) {
    const email = user.email ?? "";
    const avatarUrl = (user.user_metadata as { avatar_url?: string } | undefined)
      ?.avatar_url;
    const initial = email ? email[0].toUpperCase() : "?";

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          className="h-8 w-8 rounded-full overflow-hidden border border-border bg-surface flex items-center justify-center text-sm font-semibold text-accent hover:border-accent/40 transition-colors"
          aria-label="Tài khoản"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-10 min-w-[200px] rounded-xl border border-border bg-card shadow-xl overflow-hidden z-50">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs text-muted truncate">{email}</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                setDropdownOpen(false);
                await signOut();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface transition-colors"
            >
              <LogOut size={14} />
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    );
  }

  // Anonymous state: show "Đăng nhập" button
  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover hover:border-accent/30"
      >
        <LogIn size={14} />
        <span className="hidden sm:inline">Đăng nhập</span>
      </button>

      <AuthModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTab="signin"
      />
    </>
  );
}
```

Note: this component hides "Đăng nhập" text on mobile (small screens), showing only the icon — matches existing Navbar responsive pattern.

- [ ] **Step 2: Wire into Navbar**

Modify `src/components/layout/Navbar.tsx`:

Replace line 52 (`<ThemeToggle />`) with:

```tsx
          <AuthButton />
          <ThemeToggle />
```

And add this import after the existing imports (near the top):

```tsx
import AuthButton from "@/components/auth/AuthButton";
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/AuthButton.tsx src/components/layout/Navbar.tsx
git commit -m "feat(auth): add AuthButton to navbar"
```

---

## Task 6: Email confirmation callback page

**Files:**
- Create: `src/app/auth/callback/page.tsx`

- [ ] **Step 1: Write the callback page**

```tsx
"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { mapAuthError } from "@/lib/auth-errors";

type Status = "exchanging" | "needs-password" | "done" | "error";

const PENDING_PASSWORD_PREFIX = "pending-password-";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("exchanging");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const finish = useCallback(() => {
    setStatus("done");
    setTimeout(() => router.push("/"), 500);
  }, [router]);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      setErrorMsg("Liên kết xác nhận không hợp lệ.");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setStatus("error");
      setErrorMsg("Supabase chưa được cấu hình.");
      return;
    }

    (async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session) {
        setStatus("error");
        setErrorMsg(mapAuthError(error));
        return;
      }

      const email = data.session.user.email ?? "";
      const key = PENDING_PASSWORD_PREFIX + email.toLowerCase();
      let pending: string | null = null;
      try {
        pending = sessionStorage.getItem(key);
      } catch {}

      if (pending) {
        const { error: pwErr } = await supabase.auth.updateUser({
          password: pending,
        });
        try {
          sessionStorage.removeItem(key);
        } catch {}
        if (pwErr) {
          setStatus("error");
          setErrorMsg(mapAuthError(pwErr));
          return;
        }
        finish();
        return;
      }

      // Google OAuth users don't need a password; detect via identities
      const hasEmailIdentity = data.session.user.identities?.some(
        (i) => i.provider === "email"
      );
      if (!hasEmailIdentity) {
        finish();
        return;
      }

      // Different-browser scenario: prompt for password
      setStatus("needs-password");
    })();
  }, [searchParams, finish]);

  const handlePasswordSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrorMsg("");

      if (password.length < 6) {
        setErrorMsg("Mật khẩu tối thiểu 6 ký tự.");
        return;
      }
      if (password !== confirm) {
        setErrorMsg("Mật khẩu không khớp.");
        return;
      }

      const supabase = createClient();
      if (!supabase) return;

      setSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password });
      setSubmitting(false);

      if (error) {
        setErrorMsg(mapAuthError(error));
        return;
      }
      finish();
    },
    [password, confirm, finish]
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        {status === "exchanging" && (
          <div className="text-center space-y-3 py-6">
            <Loader2 size={32} className="text-accent mx-auto animate-spin" />
            <p className="text-sm text-muted">Đang xác nhận tài khoản...</p>
          </div>
        )}

        {status === "done" && (
          <div className="text-center space-y-3 py-6">
            <CheckCircle2 size={32} className="text-accent mx-auto" />
            <p className="text-sm text-foreground">Xác nhận thành công!</p>
            <p className="text-xs text-muted">Đang chuyển hướng...</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-3 py-6">
            <AlertCircle size={32} className="text-red-600 dark:text-red-400 mx-auto" />
            <h3 className="text-base font-semibold text-foreground">
              Không thể xác nhận
            </h3>
            <p className="text-sm text-muted leading-relaxed">{errorMsg}</p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Về trang chủ
            </button>
          </div>
        )}

        {status === "needs-password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="text-center space-y-2">
              <Lock size={28} className="text-accent mx-auto" />
              <h3 className="text-base font-semibold text-foreground">
                Đặt mật khẩu
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Email đã được xác nhận. Đặt mật khẩu để hoàn tất đăng ký.
              </p>
            </div>

            <label className="block">
              <span className="block text-xs font-medium text-muted mb-1">
                Mật khẩu
              </span>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                placeholder="Tối thiểu 6 ký tự"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-muted mb-1">
                Xác nhận mật khẩu
              </span>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
                placeholder="Nhập lại mật khẩu"
              />
            </label>

            {errorMsg && (
              <p className="text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Lưu mật khẩu
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 size={32} className="text-accent animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
```

Note: the `Suspense` wrapper is required by Next.js 16 when using `useSearchParams` inside a client page.

- [ ] **Step 2: Type-check + build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `rm -rf .next && npm run build`
Expected: build succeeds, `/auth/callback` appears in the route list.

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/callback/page.tsx
git commit -m "feat(auth): add email confirmation callback page with password fallback"
```

---

## Task 7: SignInToast component + tests

**Files:**
- Create: `src/components/auth/SignInToast.tsx`
- Create: `src/components/auth/SignInToast.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/auth/SignInToast.test.tsx`:

```tsx
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
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/auth/SignInToast.test.tsx`
Expected: FAIL with "Cannot find module './SignInToast'".

- [ ] **Step 3: Write the component**

Create `src/components/auth/SignInToast.tsx`:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Save } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "./AuthModal";

const LS_KEY = "auth-toast-last-shown-at";
const DELAY_MS = 10 * 60 * 1000; // 10 minutes
const DISMISS_MS = 8 * 1000; // 8 seconds auto-dismiss
const THROTTLE_MS = 24 * 60 * 60 * 1000; // 24 hours between re-shows

export default function SignInToast() {
  const { isAnonymous } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isAnonymous) return;

    let lastShown = 0;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) lastShown = parseInt(raw, 10) || 0;
    } catch {}

    const sinceLast = Date.now() - lastShown;
    if (lastShown > 0 && sinceLast < THROTTLE_MS) return;

    const showTimer = setTimeout(() => {
      setVisible(true);
      try {
        localStorage.setItem(LS_KEY, String(Date.now()));
      } catch {}
      dismissTimer.current = setTimeout(() => setVisible(false), DISMISS_MS);
    }, DELAY_MS);

    return () => {
      clearTimeout(showTimer);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [isAnonymous]);

  const dismiss = () => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setVisible(false);
  };

  const openSignup = () => {
    dismiss();
    setModalOpen(true);
  };

  if (!mounted || !visible) {
    return (
      <AuthModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTab="signup"
      />
    );
  }

  return (
    <>
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[150] w-80 max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-card p-4 shadow-2xl animate-in slide-in-from-bottom-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <Save size={16} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Lưu tiến độ học?
              </p>
              <p className="text-xs text-muted leading-relaxed mt-1">
                Đăng ký miễn phí để đồng bộ bookmarks và chủ đề đã đọc.
              </p>
              <button
                type="button"
                onClick={openSignup}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
              >
                Đăng ký
              </button>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg p-1 text-muted hover:text-foreground hover:bg-surface transition-colors"
              aria-label="Đóng"
            >
              <X size={14} />
            </button>
          </div>
        </div>,
        document.body
      )}

      <AuthModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTab="signup"
      />
    </>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/auth/SignInToast.test.tsx`
Expected: PASS (5/5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/SignInToast.tsx src/components/auth/SignInToast.test.tsx
git commit -m "feat(auth): add 10-min sign-up nudge toast with tests"
```

---

## Task 8: Wire AuthProvider + SignInToast into AppShell

**Files:**
- Modify: `src/components/layout/AppShell.tsx`

- [ ] **Step 1: Update AppShell**

Replace the entire `src/components/layout/AppShell.tsx` contents with:

```tsx
"use client";

import Navbar from "./Navbar";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import CommandPalette from "@/components/ui/CommandPalette";
import SignInToast from "@/components/auth/SignInToast";
import { AuthProvider } from "@/lib/auth-context";
import { ProgressProvider } from "@/lib/progress-context";
import { topicList } from "@/topics/registry";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <AuthProvider>
      <ProgressProvider>
        <CommandPalette topics={topicList} />
        <Navbar />
        <main id="main-content" className="flex-1 has-bottom-nav">
          {children}
        </main>
        <Footer />
        <BottomNav />
        <SignInToast />
      </ProgressProvider>
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Type-check + build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `rm -rf .next && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AppShell.tsx
git commit -m "feat(auth): wire AuthProvider and SignInToast into AppShell"
```

---

## Task 9: Document Supabase dashboard setup in CONTRIBUTING.md

**Files:**
- Modify: `CONTRIBUTING.md` (append new section)

- [ ] **Step 1: Append the configuration section**

Run:
```bash
cat >> CONTRIBUTING.md <<'EOF'

## Supabase Dashboard Setup (for auth features)

The sign-up / sign-in feature requires one-time manual configuration in the Supabase dashboard. If you're setting up a fresh Supabase project for local development, complete these steps:

### 1. Enable email confirmation
- Navigate to **Authentication → Providers → Email**
- Set **Confirm email**: ON
- Set **Secure email change**: ON

### 2. Enable manual identity linking
- Navigate to **Authentication → General**
- Set **Allow manual linking**: ON

Without this, `supabase.auth.linkIdentity()` (used for anon → Google upgrade) returns an error.

### 3. Configure Google provider
- Navigate to **Authentication → Providers → Google**
- Toggle **Enabled**: ON
- In Google Cloud Console, create an OAuth 2.0 Client ID (Web application):
  - **Authorized JavaScript origins**: `https://ai-edu-app.vercel.app` (and `http://localhost:3000` for dev)
  - **Authorized redirect URIs**: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
- Copy the Google Client ID + Secret back into the Supabase dashboard

### 4. Set redirect URLs
- Navigate to **Authentication → URL Configuration**
- Set **Site URL**: `https://ai-edu-app.vercel.app` (use `http://localhost:3000` for dev)
- Add to **Redirect URLs** allow-list:
  - `https://ai-edu-app.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

### 5. Customize the confirmation email (optional)
- Navigate to **Authentication → Email Templates → Confirm signup**
- Change subject to: `Xác nhận đăng ký tài khoản AI Cho Mọi Người`
- Keep the `{{ .ConfirmationURL }}` token in the body — Supabase substitutes the actual confirmation link there

EOF
```

- [ ] **Step 2: Verify**

Run: `tail -40 CONTRIBUTING.md`
Expected: the new section is present.

- [ ] **Step 3: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add Supabase dashboard setup for auth feature"
```

---

## Task 10: Final build + manual verification

**Files:** (no code changes, verification only)

- [ ] **Step 1: Full type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `npx vitest run`
Expected: all tests pass. `auth-errors.test.ts` (6 tests) and `SignInToast.test.tsx` (5 tests).

- [ ] **Step 3: Production build**

Run: `rm -rf .next && npm run build`
Expected: build succeeds, `/auth/callback` appears in route list alongside existing routes.

- [ ] **Step 4: Dev server smoke check**

Run: `npm run dev`
Open `http://localhost:3000` — verify:

Visual checks (click through manually):
- Navbar shows "Đăng nhập" button next to theme toggle (on desktop; icon-only on mobile)
- Click "Đăng nhập" → AuthModal opens with "Đăng nhập" tab active → backdrop covers viewport (no bleed-through)
- Switch to "Đăng ký" tab → form changes submit label to "Đăng ký"
- Both tabs show Google button above "hoặc" divider

Functional checks (requires Supabase configured per Task 9):
- Sign up with fake email → receive confirmation email
- Click email link → `/auth/callback` shows "Đang xác nhận..." → "Xác nhận thành công" → redirect to home
- Navbar now shows avatar (email initial); click → dropdown shows email + "Đăng xuất"
- Click "Đăng xuất" → back to anonymous state; new UUID is created on next progress write
- Sign in on different browser: enter credentials → progress from prior account loads

10-min toast (patience required):
- Open fresh incognito → clear localStorage if needed → wait 10 min → toast appears bottom-right → auto-dismisses after 8s
- Reload within 24h → toast does NOT re-appear

- [ ] **Step 5: Push to production**

```bash
git push origin main
vercel --prod --yes
```

Visit `https://ai-edu-app.vercel.app` and run the same visual + functional checks against production.

- [ ] **Step 6: Final verification commit**

No code changes expected. If anything broke during manual testing, circle back to the relevant task.

---

## Execution Notes

- **Order matters**: Tasks 1-3 are foundation. Task 4 depends on Task 2's `useAuth()` hook. Task 5 depends on Task 4. Tasks 6-7 can be done independently after Task 2. Task 8 depends on everything.
- **Supabase dashboard setup (Task 9)** can be done in parallel with code. But sign-up flow **cannot be manually tested** until dashboard is configured.
- **Commits are frequent** — one per task — so a subagent-driven execution can review diffs between tasks cleanly.
- **No destructive migrations.** The spec explicitly preserves user UUIDs, so there's no database work beyond what Supabase handles automatically.
