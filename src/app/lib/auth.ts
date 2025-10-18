// src/lib/auth.ts
import { supabase } from "./../lib/SupabaseClient";

type Session = {
  access_token: string;
  token_type: string;
  expires_at?: number;
  user: any;
} | null;

/** Register user with email & password */
export async function registerUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    console.error("registerUser:", error);
    return { ok: false, error };
  }
  // data.user exists but email confirmation may be required depending on settings
  return { ok: true, data };
}

/** Login user */
export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("loginUser:", error);
    return { ok: false, error };
  }
  return { ok: true, data };
}

/** Logout */
export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error("logoutUser:", error);
  return { ok: !error, error };
}

/** Get current session (client-side) */
export function getSession(): Session {
  // supabase stores session in localStorage automatically
  // but you can also access current session:
  // @ts-ignore
  return supabase.auth.getSession ? null : null;
}

/** Better: async get session */
export async function getSessionAsync() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("getSessionAsync:", error);
    return null;
  }
  return data.session; // may be null
}

/** Delete current user row from 'users' table */
export async function deleteUserAccount(userId: string) {
  if (!userId) return { ok: false, error: "No user ID provided" };

  const { error } = await supabase.from("users").delete().eq("id", userId);

  if (error) {
    console.error("deleteUserAccount:", error);
    return { ok: false, error };
  }

  return { ok: true };
}
