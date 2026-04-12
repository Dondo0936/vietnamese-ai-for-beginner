"use client";

import { useState, useEffect, useRef } from "react";
import { LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "./AuthModal";

export default function AuthButton() {
  const { user, isAuthenticated, signOut, loading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
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
    const avatarUrl = (
      user.user_metadata as { avatar_url?: string } | undefined
    )?.avatar_url;
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
