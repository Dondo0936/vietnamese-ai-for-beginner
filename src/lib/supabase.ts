import { createBrowserClient } from "@supabase/ssr";

let missingEnvWarned = false;

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!missingEnvWarned) {
      console.warn(
        "[AI Edu] Supabase env vars not set — running in offline mode. Progress/bookmarks won't persist."
      );
      missingEnvWarned = true;
    }
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
