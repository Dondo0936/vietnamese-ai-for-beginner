"use client";

import { createClient } from "./supabase";
import type { UserProgress } from "./types";

const DEFAULT_PROGRESS: UserProgress = {
  readTopics: [],
  bookmarks: [],
  lastVisited: null,
};

// Session-level caches to avoid redundant Supabase calls
const readTopicCache = new Set<string>();
let lastBookmarkToggle = 0;
const BOOKMARK_THROTTLE_MS = 300;

// Local-only fallback when Supabase is not configured
let localProgress: UserProgress = { ...DEFAULT_PROGRESS };

function isOffline() {
  return createClient() === null;
}

let authFailed = false;

export async function ensureAnonymousAuth() {
  const supabase = createClient();
  if (!supabase) return null;
  if (authFailed) return null;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.warn("Anonymous auth failed:", error.message);
        authFailed = true;
        return null;
      }
    }

    return supabase;
  } catch {
    authFailed = true;
    return null;
  }
}

export async function getUserProgress(): Promise<UserProgress> {
  if (isOffline()) return localProgress;

  try {
    const supabase = await ensureAnonymousAuth();
    if (!supabase) return localProgress;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return DEFAULT_PROGRESS;

    const { data } = await supabase
      .from("user_progress")
      .select("read_topics, bookmarks, last_visited")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) return DEFAULT_PROGRESS;

    return {
      readTopics: data.read_topics || [],
      bookmarks: data.bookmarks || [],
      lastVisited: data.last_visited,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export async function markTopicRead(slug: string) {
  if (readTopicCache.has(slug)) return;
  readTopicCache.add(slug);

  if (isOffline()) {
    if (!localProgress.readTopics.includes(slug)) {
      localProgress = {
        ...localProgress,
        readTopics: [...localProgress.readTopics, slug],
        lastVisited: slug,
      };
    }
    return;
  }

  try {
    const supabase = await ensureAnonymousAuth();
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const progress = await getUserProgress();
    if (progress.readTopics.includes(slug)) return;

    const updatedReadTopics = [...progress.readTopics, slug];

    await supabase.from("user_progress").upsert(
      {
        user_id: user.id,
        read_topics: updatedReadTopics,
        last_visited: slug,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch {
    // Fail silently
  }
}

export async function toggleBookmark(slug: string): Promise<boolean> {
  const now = Date.now();
  if (now - lastBookmarkToggle < BOOKMARK_THROTTLE_MS) return false;
  lastBookmarkToggle = now;

  if (isOffline()) {
    const isBookmarked = localProgress.bookmarks.includes(slug);
    localProgress = {
      ...localProgress,
      bookmarks: isBookmarked
        ? localProgress.bookmarks.filter((s) => s !== slug)
        : [...localProgress.bookmarks, slug],
    };
    return !isBookmarked;
  }

  try {
    const supabase = await ensureAnonymousAuth();
    if (!supabase) return false;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const progress = await getUserProgress();
    const isBookmarked = progress.bookmarks.includes(slug);
    const updatedBookmarks = isBookmarked
      ? progress.bookmarks.filter((s) => s !== slug)
      : [...progress.bookmarks, slug];

    await supabase.from("user_progress").upsert(
      {
        user_id: user.id,
        bookmarks: updatedBookmarks,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    return !isBookmarked;
  } catch {
    return false;
  }
}
