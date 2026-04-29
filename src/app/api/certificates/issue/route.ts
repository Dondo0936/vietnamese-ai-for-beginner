/**
 * POST /api/certificates/issue
 *
 * Mints a path-completion certificate. Idempotent: re-claiming the same path
 * returns the existing cert.
 *
 * Auth flow:
 *   1. Reads user from cookie session via @supabase/ssr.
 *   2. Refuses anonymous users — claim is the moment you upgrade your
 *      account, not before. Caller must signUpGoogle() first (linkIdentity
 *      preserves user_id, so all prior progress is retained).
 *
 * Validation:
 *   3. pathId must be one of the four adult paths.
 *   4. displayName must be ≥4 token-overlap with the OAuth full_name.
 *   5. user_progress.read_topics must cover every slug in the path.
 *
 * Issuance:
 *   6. Build canonical payload, sign with Ed25519, insert via service-role
 *      client (RLS bypass — INSERT has no policy).
 *   7. Return certId + share URL.
 */
import { NextResponse } from "next/server";
import { isAdultPathId, getPathStages, getPathNameVi } from "@/lib/paths";
import {
  buildPayload,
  checkNameSimilarity,
  signPayload,
  type CertPayload,
} from "@/lib/certificates";
import {
  createServerClientWithCookies,
  createServiceClient,
} from "@/lib/supabase-server";

const PATH_HOURS_FALLBACK_PER_LESSON = 12 * 60; // seconds

export async function POST(req: Request) {
  let body: { pathId?: string; displayName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { pathId, displayName } = body;
  if (!pathId || !isAdultPathId(pathId)) {
    return NextResponse.json({ error: "invalid_path_id" }, { status: 400 });
  }
  if (!displayName || typeof displayName !== "string") {
    return NextResponse.json({ error: "missing_display_name" }, { status: 400 });
  }
  const trimmedName = displayName.trim();
  if (trimmedName.length < 2 || trimmedName.length > 80) {
    return NextResponse.json({ error: "name_length" }, { status: 400 });
  }

  const userClient = await createServerClientWithCookies();
  if (!userClient) {
    return NextResponse.json({ error: "config" }, { status: 500 });
  }

  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }
  if (user.is_anonymous) {
    return NextResponse.json({ error: "upgrade_required" }, { status: 403 });
  }

  const authName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    "";

  if (!authName) {
    return NextResponse.json({ error: "no_auth_name" }, { status: 400 });
  }

  const similarity = checkNameSimilarity(authName, trimmedName);
  if (!similarity.ok) {
    return NextResponse.json(
      {
        error: "name_mismatch",
        detail: {
          authTokens: similarity.authTokens,
          displayTokens: similarity.displayTokens,
          matched: similarity.matched,
          needed: similarity.needed,
        },
      },
      { status: 422 },
    );
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: "config" }, { status: 500 });
  }

  // Idempotency: if user already has a cert for this path, return it.
  const existing = await service
    .from("certificates")
    .select("id")
    .eq("user_id", user.id)
    .eq("path_id", pathId)
    .maybeSingle();
  if (existing.data) {
    return NextResponse.json({
      certId: existing.data.id,
      url: certUrl(existing.data.id),
      reused: true,
    });
  }

  // Validate path completion against user_progress.
  const progressRow = await service
    .from("user_progress")
    .select("read_topics")
    .eq("user_id", user.id)
    .maybeSingle();
  const readTopics = new Set<string>(progressRow.data?.read_topics ?? []);

  const stages = getPathStages(pathId);
  const allSlugs = stages.flatMap((s) => s.slugs);
  const missing = allSlugs.filter((slug) => !readTopics.has(slug));
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "incomplete", detail: { missing, total: allSlugs.length } },
      { status: 422 },
    );
  }

  const privateKey = process.env.UDEMI_CERT_PRIVATE_KEY;
  if (!privateKey) {
    return NextResponse.json({ error: "no_signing_key" }, { status: 500 });
  }

  const certId = crypto.randomUUID();
  const completedAt = new Date(); // last-read isn't easy to compute; use now
  const lessonCount = allSlugs.length;
  const hoursSeconds = lessonCount * PATH_HOURS_FALLBACK_PER_LESSON;

  const payload: CertPayload = buildPayload({
    certId,
    userId: user.id,
    pathId,
    pathName: getPathNameVi(pathId),
    fullName: trimmedName,
    lessonCount,
    hoursSeconds,
    quizAvg: 100,
    completedAt,
  });

  let signature: string;
  try {
    signature = await signPayload(payload, privateKey);
  } catch {
    return NextResponse.json({ error: "sign_failed" }, { status: 500 });
  }

  const { error: insertErr } = await service.from("certificates").insert({
    id: certId,
    user_id: user.id,
    path_id: pathId,
    path_name: payload.pathName,
    lesson_count: lessonCount,
    hours_seconds: hoursSeconds,
    quiz_avg: 100,
    full_name: trimmedName,
    auth_name: authName,
    auth_email: user.email ?? null,
    completed_at: completedAt.toISOString(),
    payload,
    signature,
    signed_at: payload.signedAt,
    key_id: payload.keyId,
    public: true,
  });

  if (insertErr) {
    return NextResponse.json(
      { error: "insert_failed", detail: insertErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    certId,
    url: certUrl(certId),
    reused: false,
  });
}

function certUrl(certId: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://udemi.tech";
  return `${base}/cert/${certId}`;
}
