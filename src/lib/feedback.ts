"use client";

import { createClient } from "./supabase";
import { ensureAnonSession } from "./database";

/**
 * Feedback submission — writes to `public.feedback` after uploading any
 * attached screenshots to the private `feedback-images` storage bucket.
 *
 * Rate limit (3 minutes/user) is enforced server-side by a BEFORE INSERT
 * trigger on the table. We also surface a client-side hint so the UI can
 * start disabling the submit button immediately without a round-trip.
 */

export const RATE_LIMIT_SECONDS = 180;
export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const TITLE_MIN = 3;
export const TITLE_MAX = 120;
export const DESC_MIN = 10;
export const DESC_MAX = 4000;

const LAST_SUBMIT_KEY = "feedback:last-submit-at";

interface SubmitInput {
  title: string;
  description: string;
  files: File[];
  pageUrl: string;
  userAgent: string;
}

export type SubmitResult =
  | { ok: true; id: string }
  | { ok: false; kind: "rate_limited"; secondsRemaining: number }
  | { ok: false; kind: "offline" }
  | { ok: false; kind: "auth_failed" }
  | { ok: false; kind: "upload_failed"; message: string }
  | { ok: false; kind: "insert_failed"; message: string }
  | { ok: false; kind: "validation"; message: string };

/** Check localStorage for the last-submit timestamp; 0 = never submitted. */
export function clientLastSubmitAt(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(LAST_SUBMIT_KEY);
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function clientSecondsUntilNext(): number {
  const last = clientLastSubmitAt();
  if (!last) return 0;
  const elapsed = (Date.now() - last) / 1000;
  return Math.max(0, Math.ceil(RATE_LIMIT_SECONDS - elapsed));
}

function validate(input: SubmitInput): SubmitResult | null {
  const t = input.title.trim();
  const d = input.description.trim();
  if (t.length < TITLE_MIN || t.length > TITLE_MAX) {
    return {
      ok: false,
      kind: "validation",
      message: `Tiêu đề phải từ ${TITLE_MIN} đến ${TITLE_MAX} ký tự.`,
    };
  }
  if (d.length < DESC_MIN || d.length > DESC_MAX) {
    return {
      ok: false,
      kind: "validation",
      message: `Mô tả phải từ ${DESC_MIN} đến ${DESC_MAX} ký tự.`,
    };
  }
  if (input.files.length > MAX_IMAGES) {
    return {
      ok: false,
      kind: "validation",
      message: `Tối đa ${MAX_IMAGES} ảnh.`,
    };
  }
  for (const f of input.files) {
    if (!ALLOWED_MIME.includes(f.type)) {
      return {
        ok: false,
        kind: "validation",
        message: `File "${f.name}" không phải ảnh hợp lệ (chỉ nhận JPEG, PNG, WebP, GIF).`,
      };
    }
    if (f.size > MAX_IMAGE_BYTES) {
      return {
        ok: false,
        kind: "validation",
        message: `File "${f.name}" vượt quá 5 MB.`,
      };
    }
  }
  return null;
}

/** Extract remaining seconds from a Postgres rate-limit exception message. */
function parseRateLimitSeconds(raw: string): number {
  // Trigger raises: `feedback_rate_limited: please wait 127 seconds`
  const m = /please wait (\d+) seconds/.exec(raw);
  if (m) return Math.max(1, Number(m[1]));
  return RATE_LIMIT_SECONDS;
}

function extSuffix(file: File): string {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "bin";
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function submitFeedback(
  input: SubmitInput
): Promise<SubmitResult> {
  const invalid = validate(input);
  if (invalid) return invalid;

  // Fast client-side rate-limit check. Server trigger is the source of
  // truth; this just avoids a wasted upload round-trip.
  const remainingClient = clientSecondsUntilNext();
  if (remainingClient > 0) {
    return {
      ok: false,
      kind: "rate_limited",
      secondsRemaining: remainingClient,
    };
  }

  const supabase = createClient();
  if (!supabase) return { ok: false, kind: "offline" };

  const client = await ensureAnonSession();
  if (!client) return { ok: false, kind: "auth_failed" };

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { ok: false, kind: "auth_failed" };

  // Upload each image into the user's folder inside the private bucket.
  const uploadedPaths: string[] = [];
  const stamp = Date.now();
  for (let i = 0; i < input.files.length; i++) {
    const file = input.files[i];
    const path = `${user.id}/${stamp}-${i}-${randomSuffix()}.${extSuffix(file)}`;
    const { error } = await client.storage
      .from("feedback-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
    if (error) {
      return { ok: false, kind: "upload_failed", message: error.message };
    }
    uploadedPaths.push(path);
  }

  const { data, error } = await client
    .from("feedback")
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      description: input.description.trim(),
      image_paths: uploadedPaths,
      user_agent: input.userAgent.slice(0, 500),
      page_url: input.pageUrl.slice(0, 500),
    })
    .select("id")
    .single();

  if (error) {
    if (/feedback_rate_limited/.test(error.message)) {
      return {
        ok: false,
        kind: "rate_limited",
        secondsRemaining: parseRateLimitSeconds(error.message),
      };
    }
    return { ok: false, kind: "insert_failed", message: error.message };
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now()));
  }

  return { ok: true, id: data.id as string };
}
