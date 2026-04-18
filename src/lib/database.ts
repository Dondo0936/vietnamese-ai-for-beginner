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
let ensureInFlight: Promise<ReturnType<typeof createClient> | null> | null = null;

/**
 * Lazily sign in an anonymous Supabase session.
 *
 * HIGH-1 mitigation, layer 1: we do NOT call `signInAnonymously()` on every
 * page load anymore. This helper is only invoked from a confirmed user
 * gesture (mark-as-read, bookmark toggle, quiz submit), never from a bare
 * mount effect. A bot scraping public topic pages will therefore never mint
 * an anonymous user in `auth.users`.
 *
 * HIGH-1 mitigation, layer 2 (Vercel BotID): before minting the anon user,
 * we POST to `/api/ensure-session`. The browser's BotID client
 * (`instrumentation-client.ts`) attaches the challenge response to that
 * fetch; the route handler runs `checkBotId()` and rejects bots with 429.
 * On rejection we abort the signin and the caller silently no-ops — the UI
 * falls back to local-only state.
 *
 * Off-Vercel (local dev, self-hosted) `checkBotId()` always returns
 * `{ isBot: false }` so this flow still works without any special-casing
 * here. No `NODE_ENV` check is needed.
 */
export async function ensureAnonSession() {
  const supabase = createClient();
  if (!supabase) return null;
  if (authFailed) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return supabase;

  if (ensureInFlight) return ensureInFlight;

  ensureInFlight = (async () => {
    try {
      // BotID chokepoint — client instrumentation attaches the challenge
      // header automatically for protected paths declared in
      // `src/instrumentation-client.ts`. If the request doesn't look
      // human, `/api/ensure-session` returns 429 and we refuse to mint.
      const guard = await fetch("/api/ensure-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!guard.ok) {
        // 429 = bot_detected, other non-2xx = infra error. Either way,
        // do not mint an anon user; the write silently no-ops.
        authFailed = true;
        return null;
      }

      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.warn("Anonymous auth failed:", error.message);
        authFailed = true;
        return null;
      }
      return supabase;
    } catch {
      authFailed = true;
      return null;
    } finally {
      ensureInFlight = null;
    }
  })();

  return ensureInFlight;
}

/**
 * Read the current user's progress. Does NOT create an anonymous session —
 * if there is no session yet, we return the empty default so public pages
 * can render without minting an anon user.
 */
export async function getUserProgress(): Promise<UserProgress> {
  if (isOffline()) return localProgress;

  try {
    const supabase = createClient();
    if (!supabase) return localProgress;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return DEFAULT_PROGRESS;

    const { data } = await supabase
      .from("user_progress")
      .select("read_topics, bookmarks, last_visited")
      .eq("user_id", session.user.id)
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
    // Gesture-gated: this is called from scroll-70%-or-click in TopicLayout,
    // both of which require a real user to be present.
    const supabase = await ensureAnonSession();
    if (!supabase) return;

    // HIGH-2 mitigation: use the SECURITY DEFINER RPC which validates the
    // slug and atomically appends to read_topics / updates last_visited.
    // Never upsert the raw row from the client.
    await supabase.rpc("add_read_topic", { topic_slug: slug });
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
    // Gesture-gated: invoked from BookmarkButton onClick.
    const supabase = await ensureAnonSession();
    if (!supabase) return false;

    // HIGH-2 mitigation: SECURITY DEFINER RPC returns the new bookmark state
    // as a boolean. No client-controlled array is sent to the DB.
    const { data, error } = await supabase.rpc("toggle_bookmark", {
      topic_slug: slug,
    });
    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}

/**
 * @deprecated Use {@link ensureAnonSession} instead. Retained as a thin
 * alias so any stale imports keep compiling; it no longer auto-signs-in on
 * arbitrary mount — only use from a user gesture.
 */
export const ensureAnonymousAuth = ensureAnonSession;
