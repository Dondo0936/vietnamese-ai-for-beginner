"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import FeedbackModal from "./FeedbackModal";

/**
 * Navbar-level entry point. Icon-only to match the rest of the right-side
 * nav cluster (Search, Cẩm nang Claude, Tiến độ, Đã lưu, Theme); `title`
 * provides the hover tooltip. Modal mounts lazily after first click.
 */
export default function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Gửi góp ý"
        aria-label="Gửi góp ý"
        className="rounded-[var(--r-md)] p-2 text-tertiary transition-colors hover:text-foreground hover:bg-surface"
      >
        <MessageCircle size={18} />
      </button>

      {open && <FeedbackModal open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
