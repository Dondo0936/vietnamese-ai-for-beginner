"use client";

import { useState } from "react";
import { Bot, X } from "lucide-react";
import ChatPanel from "./ChatPanel";

/**
 * Global floating entry point, visible on every route. Positioned to clear
 * BottomNav (h-16, mobile-only) with room to spare. Panel mounts lazily
 * after first click.
 */
export default function ChatLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={open ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
        aria-label={open ? "Đóng trợ lý AI" : "Mở trợ lý AI"}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-[var(--r-pill)] bg-accent text-white shadow-lg transition-all hover:bg-[var(--accent-dark)] active:scale-95 md:bottom-6 md:right-6"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>

      <ChatPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
