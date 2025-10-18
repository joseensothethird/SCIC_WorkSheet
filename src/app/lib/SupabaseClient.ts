import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

if (typeof window !== "undefined") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(
      "Supabase environment variables are missing:",
      {
        hasUrl: !!url,
        hasAnonKey: !!anonKey
      }
    );
    // You can also provide fallback values for development
    // throw new Error("Supabase environment variables are not set!");
  } else {
    supabase = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }
}

export { supabase };