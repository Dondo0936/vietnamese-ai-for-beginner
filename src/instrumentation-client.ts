/**
 * BotID client initialization.
 *
 * This runs once on the client before any user code. It tells Vercel BotID
 * to attach a challenge response header to every `fetch(...)` that targets
 * one of the protected paths below. The server then calls `checkBotId()`
 * inside the route handler and rejects bots.
 *
 * HIGH-1 mitigation (continued): the anonymous-signin chokepoint lives in
 * `src/lib/database.ts` → `ensureAnonSession()`, which POSTs to
 * `/api/ensure-session` before calling `supabase.auth.signInAnonymously()`.
 * That route handler is the single endpoint BotID protects; Supabase's own
 * auth URL is cross-origin and can't be covered by BotID.
 *
 * Local dev: BotID's server-side `checkBotId()` always returns
 * `{ isBot: false }` when VERCEL_ENV is unset, so this init is a no-op for
 * development workflows.
 */
import { initBotId } from "botid/client/core";

initBotId({
  protect: [
    {
      path: "/api/ensure-session",
      method: "POST",
    },
  ],
});
