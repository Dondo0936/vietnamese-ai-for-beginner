"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import FeedbackModal from "./FeedbackModal";

/**
 * Small pill-style entry point lives in the navbar. The modal mounts lazily
 * only after the first click so it doesn't ship its own bundle cost on
 * every page load.
 */
export default function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Gửi góp ý"
        className="inline-flex items-center gap-1.5 rounded-[var(--r-pill)] border border-border bg-surface px-3 py-1.5 text-[12px] font-medium text-muted transition-colors hover:border-accent/40 hover:bg-[var(--accent-light)] hover:text-accent"
      >
        <MessageCircle size={14} />
        <span className="hidden sm:inline">Góp ý</span>
      </button>

      {open && <FeedbackModal open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
