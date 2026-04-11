"use client";

import { createClient } from "./supabase";
import type { UserProgress } from "./types";

const DEFAULT_PROGRESS: UserProgress = {
  readTopics: [],
  bookmarks: [],
  lastVisited: null,
};

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
  try {
    const supabase = await ensureAnonymousAuth();
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
    // Fail silently — user experience shouldn't break
  }
}

export async function toggleBookmark(slug: string): Promise<boolean> {
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
