"use client";

import { useState, useCallback, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { toggleBookmark, getUserProgress } from "@/lib/database";

interface BookmarkButtonProps {
  slug: string;
  initialBookmarked?: boolean;
}

export default function BookmarkButton({
  slug,
  initialBookmarked = false,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [pending, setPending] = useState(false);

  // Fetch actual bookmark state on mount
  useEffect(() => {
    getUserProgress().then((progress) => {
      setBookmarked(progress.bookmarks.includes(slug));
    });
  }, [slug]);

  const handleToggle = useCallback(async () => {
    if (pending) return;
    setPending(true);
    setBookmarked((prev) => !prev);

    try {
      const result = await toggleBookmark(slug);
      setBookmarked(result);
    } catch {
      setBookmarked((prev) => !prev);
    } finally {
      setPending(false);
    }
  }, [slug, pending]);

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
