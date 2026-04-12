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
        <div className="fixed bottom-6 right-6 z-[150] w-80 max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-card p-4 shadow-2xl">
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
