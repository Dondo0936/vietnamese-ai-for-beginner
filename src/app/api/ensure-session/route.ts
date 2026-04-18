/**
 * BotID chokepoint for anonymous Supabase sign-in.
 *
 * The browser calls POST /api/ensure-session right before
 * `supabase.auth.signInAnonymously()`. BotID's `checkBotId()` validates the
 * challenge response that `instrumentation-client.ts` attached to the
 * request; if it fails, we return 429 and the client aborts the signin —
 * the UI falls back to local-only state, so nothing in `auth.users` is
 * minted for the bot.
 *
 * In local dev (VERCEL_ENV unset) `checkBotId()` always returns
 * `{ isBot: false }`, so this route is a green-light for humans and bots
 * alike off-platform. Deep analysis is toggled in the Vercel dashboard;
 * we rely on Basic here.
 *
 * Runtime: default Node.js (Fluid Compute). Do NOT mark `edge`.
 */
import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";

export async function POST() {
  const verification = await checkBotId();

  if (verification.isBot) {
    return NextResponse.json(
      { error: "bot_detected" },
      { status: 429 }
    );
  }

  return NextResponse.json({ ok: true });
}
