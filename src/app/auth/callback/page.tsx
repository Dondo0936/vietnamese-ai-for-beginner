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
    const supabase = createClient();
    if (!supabase) {
      setStatus("error");
      setErrorMsg("Supabase chưa được cấu hình.");
      return;
    }

    const code = searchParams.get("code");

    (async () => {
      // Supabase's browser client auto-exchanges ?code= on page load via
      // detectSessionInUrl: true. So first check if the session is already
      // set. Only fall back to manual exchange if it isn't.
      let { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session && code) {
        const { data: exchData, error: exchErr } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchErr || !exchData.session) {
          setStatus("error");
          setErrorMsg(mapAuthError(exchErr));
          return;
        }
        sessionData = { session: exchData.session };
      }

      if (!sessionData.session) {
        setStatus("error");
        setErrorMsg("Liên kết xác nhận không hợp lệ.");
        return;
      }

      const session = sessionData.session;
      const email = session.user.email ?? "";
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
      const hasEmailIdentity = session.user.identities?.some(
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
            <AlertCircle
              size={32}
              className="text-red-600 dark:text-red-400 mx-auto"
            />
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
              <p className="text-xs text-red-600 dark:text-red-400">
                {errorMsg}
              </p>
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
