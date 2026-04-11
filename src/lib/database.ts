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

export async function ensureAnonymousAuth() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    await supabase.auth.signInAnonymously();
  }

  return supabase;
}

export async function getUserProgress(): Promise<UserProgress> {
  try {
    const supabase = await ensureAnonymousAuth();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return DEFAULT_PROGRESS;

    const { data } = await supabase
      .from("user_progress")
      .select("read_topics, bookmarks, last_visited")
      .eq("user_id", user.id)
      .single();

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
  // Skip if already marked this session (avoids redundant DB round-trips)
  if (readTopicCache.has(slug)) return;

  try {
    const supabase = await ensureAnonymousAuth();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const progress = await getUserProgress();
    if (progress.readTopics.includes(slug)) {
      readTopicCache.add(slug);
      return;
    }

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

    readTopicCache.add(slug);
  } catch {
    // Fail silently — user experience shouldn't break
  }
}

export async function toggleBookmark(slug: string): Promise<boolean> {
  // Throttle rapid calls
  const now = Date.now();
  if (now - lastBookmarkToggle < BOOKMARK_THROTTLE_MS) return false;
  lastBookmarkToggle = now;

  try {
    const supabase = await ensureAnonymousAuth();
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
