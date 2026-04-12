import type { TopicMeta } from "@/lib/types";

/**
 * Kids-path types — mirrors and extends the adult TopicMeta with
 * kid-specific fields. See spec §4, §7, §8.
 */

export type KidTier = "nhi" | "teen";

/**
 * Extends TopicMeta with a required tier and optional kid-flavored fields.
 * Falls back to TopicMeta shape so existing helpers (search, difficulty
 * labels, etc.) continue to work over kid topics.
 */
export interface KidsTopicMeta extends TopicMeta {
  tier: KidTier;
  /** Target lesson duration in minutes — Nhí ~6, Teen ~12 (spec §5) */
  durationMinutes: number;
  /** Mascot mood used in the lesson's intro — stub emoji in v1 */
  mascotMood?: "happy" | "curious" | "oops" | "celebrate";
}

/**
 * A kid profile owned by a parent (auth.users row). Matches the
 * kid_profiles table in supabase/kids-schema.sql.
 */
export interface KidProfile {
  id: string;
  parentUserId: string;
  displayName: string;
  birthYear: number;
  tier: KidTier;
  consentGivenAt: string | null;
  consentVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * An artifact a kid produced during a lesson — the trust asset on the
 * parent dashboard. Matches kid_artifacts rows.
 */
export interface KidArtifact {
  id: string;
  kidProfileId: string;
  topicSlug: string;
  kind: "classifier" | "story" | "sketch" | "quiz-completion" | "drawing" | "other";
  payload: Record<string, unknown> | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

/**
 * A scheduled or completed 3-day spaced-retrieval check. Matches
 * retention_checks rows.
 */
export interface RetentionCheck {
  id: string;
  kidProfileId: string;
  topicSlug: string;
  conceptKey: string;
  scheduledFor: string;
  askedAt: string | null;
  remembered: boolean | null;
  questionPayload: Record<string, unknown> | null;
}
