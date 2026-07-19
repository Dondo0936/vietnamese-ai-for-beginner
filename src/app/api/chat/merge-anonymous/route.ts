/**
 * POST /api/chat/merge-anonymous
 *
 * Reassigns an anonymous visitor's chat history to the account they just
 * signed into, so mid-conversation sign-in (to an *existing* account)
 * doesn't lose it. (Sign-up doesn't need this — `updateUser`/`linkIdentity`
 * upgrade the same anonymous user id in place.)
 *
 * The caller supplies the old (anonymous) session's access token. We do NOT
 * trust a bare claimed user id — that would let anyone merge someone else's
 * history just by guessing their UUID. Instead we independently verify the
 * token against Supabase Auth via a fresh, unauthenticated client call
 * (`getUser(oldToken)`), confirm it really was anonymous, and confirm it
 * isn't the same user as the caller's new session before touching any rows.
 */
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  createServerClientWithCookies,
  createServiceClient,
} from "@/lib/supabase-server";

export async function POST(req: Request) {
  let body: { oldAccessToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const oldAccessToken = body.oldAccessToken;
  if (!oldAccessToken || typeof oldAccessToken !== "string") {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  const userClient = await createServerClientWithCookies();
  if (!userClient) {
    return NextResponse.json({ error: "config" }, { status: 500 });
  }

  const {
    data: { user: newUser },
  } = await userClient.auth.getUser();
  if (!newUser) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "config" }, { status: 500 });
  }
  const tokenCheckClient = createSupabaseClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user: oldUser },
  } = await tokenCheckClient.auth.getUser(oldAccessToken);

  if (!oldUser || !oldUser.is_anonymous || oldUser.id === newUser.id) {
    return NextResponse.json({ error: "invalid_merge" }, { status: 403 });
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json({ error: "config" }, { status: 500 });
  }

  const { error: updateError } = await service
    .from("chat_messages")
    .update({ user_id: newUser.id })
    .eq("user_id", oldUser.id);

  if (updateError) {
    return NextResponse.json({ error: "merge_failed" }, { status: 500 });
  }

  return NextResponse.json({ merged: true });
}
