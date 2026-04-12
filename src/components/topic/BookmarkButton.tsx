"use client";

import { useCallback, useState } from "react";
import { Bookmark } from "lucide-react";
import { useProgress } from "@/lib/progress-context";

interface BookmarkButtonProps {
  slug: string;
}

export default function BookmarkButton({ slug }: BookmarkButtonProps) {
  const { bookmarks, toggleBookmark } = useProgress();
  const bookmarked = bookmarks.includes(slug);
  const [pending, setPending] = useState(false);

  const handleToggle = useCallback(async () => {
    if (pending) return;
    setPending(true);
    try {
      await toggleBookmark(slug);
    } finally {
      setPending(false);
    }
  }, [slug, pending, toggleBookmark]);

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      aria-label={bookmarked ? "Bỏ lưu chủ đề" : "Lưu chủ đề"}
      className="rounded-lg p-2 transition-colors hover:bg-accent-light/60"
    >
      <Bookmark
        size={22}
        className={
          bookmarked
            ? "fill-accent text-accent"
            : "text-muted hover:text-accent"
        }
      />
    </button>
  );
}
