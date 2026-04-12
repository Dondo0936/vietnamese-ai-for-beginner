"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getUserProgress, toggleBookmark as dbToggleBookmark, markTopicRead } from "./database";
import { createClient } from "./supabase";

interface ProgressState {
  readTopics: string[];
  bookmarks: string[];
  loading: boolean;
  toggleBookmark: (slug: string) => Promise<void>;
  addReadTopic: (slug: string) => void;
}

const SSR_FALLBACK: ProgressState = {
  readTopics: [],
  bookmarks: [],
  loading: true,
  toggleBookmark: async () => {},
  addReadTopic: () => {},
};

const ProgressContext = createContext<ProgressState>(SSR_FALLBACK);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [readTopics, setReadTopics] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      setLoading(true);
      try {
        const progress = await getUserProgress();
        setReadTopics(progress.readTopics);
        setBookmarks(progress.bookmarks);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    load();

    if (!supabase) return;

    // Reload whenever the active user changes (sign-in, sign-out, or anon → permanent)
    let lastUserId: string | null = null;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null;
      if (nextUserId !== lastUserId) {
        lastUserId = nextUserId;
        load();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const toggleBookmark = useCallback(async (slug: string) => {
    const isBookmarked = bookmarks.includes(slug);
    setBookmarks((prev) =>
      isBookmarked ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
    const result = await dbToggleBookmark(slug);
    if (result !== !isBookmarked) {
      setBookmarks((prev) =>
        result ? [...prev, slug] : prev.filter((s) => s !== slug)
      );
    }
  }, [bookmarks]);

  const addReadTopic = useCallback((slug: string) => {
    setReadTopics((prev) => prev.includes(slug) ? prev : [...prev, slug]);
  }, []);

  return (
    <ProgressContext.Provider value={{ readTopics, bookmarks, loading, toggleBookmark, addReadTopic }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  return useContext(ProgressContext);
}
