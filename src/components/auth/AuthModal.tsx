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
    const result =
      tab === "signup" ? await signUpGoogle() : await signInGoogle();
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
                  {submitting && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
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
