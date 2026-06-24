/**
 * Daily keep-warm ping for the Supabase project.
 *
 * Supabase free-tier projects auto-pause after ~7 days without activity.
 * Pausing tears down the API hostname, which then breaks the global auth
 * client (auth-context.tsx) on every page with ERR_NAME_NOT_RESOLVED. This
 * route runs one trivial query so the database registers daily activity and
 * never pauses. Wired to Vercel Cron in vercel.json (daily, 08:00 UTC).
 *
 * Secured with CRON_SECRET when set: Vercel attaches
 * `Authorization: Bearer $CRON_SECRET` to cron invocations. If the secret is
 * not configured, the route stays open (the query is a harmless head count),
 * so keep-warm works the moment this deploys; add CRON_SECRET to lock it.
 *
 * Runtime: default Node.js. Do NOT mark `edge` — the service client needs Node.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    cronSecret &&
    request.headers.get("authorization") !== `Bearer ${cronSecret}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, reason: "supabase env not set" },
      { status: 200 },
    );
  }

  const { count, error } = await supabase
    .from("user_progress")
    .select("*", { head: true, count: "exact" });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, pinged: true, rows: count ?? 0 });
}
