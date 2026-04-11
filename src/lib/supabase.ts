import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
    throw new Error(
      "Cấu hình kết nối chưa được thiết lập. Vui lòng kiểm tra file .env.local"
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
