// lib/supabase-client.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing!');
  console.log('URL:', supabaseUrl);
  console.log('Anon Key:', supabaseAnonKey ? '***' + supabaseAnonKey.slice(-4) : 'undefined');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://dummy-url.supabase.co', // fallback for build
  supabaseAnonKey || 'dummy-key', // fallback for build
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);