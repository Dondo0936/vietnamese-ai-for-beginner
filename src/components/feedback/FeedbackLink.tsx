"use client";

import { useState } from "react";
import FeedbackModal from "./FeedbackModal";

/**
 * Footer-style link that opens the in-app feedback modal instead of jumping
 * out to GitHub issues. Used by Footer.tsx (Tailwind chrome) and
 * LandingFooter.tsx (landing.css `.ld-foot a`); the className is passed in
 * from the caller so each footer keeps its existing visual treatment.
 */
export default function FeedbackLink({
  className,
  children = "Báo lỗi",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {children}
      </button>
      {open && <FeedbackModal open={open} onClose={() => setOpen(false)} />}
    </>
  );
}
