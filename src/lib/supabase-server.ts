/**
 * Server-side Supabase clients for Route Handlers and Server Components.
 *
 * Two flavours:
 *   - createServerClientWithCookies()  reads the user's session from request
 *     cookies; respects RLS as the calling user. Use for "is this user
 *     authenticated?" checks.
 *   - createServiceClient()            uses the SUPABASE_SERVICE_ROLE_KEY
 *     and bypasses RLS. Reserved for trusted server flows (cert issuance).
 *     Never expose this to the browser.
 */
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createServerClientWithCookies() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const store = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(toSet) {
        try {
          for (const c of toSet) store.set(c.name, c.value, c.options);
        } catch {
          // Set from a Server Component without proxy refresh — safe to ignore.
        }
      },
    },
  });
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
