import { supabase } from "./../lib/SupabaseClient";
import type { User as SupabaseUser, Session as SupabaseSession } from "@supabase/supabase-js";

export type User = SupabaseUser;
export type Session = SupabaseSession | null;

/** Register user with email & password */
export async function registerUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    console.error("registerUser:", error);
    return { ok: false, error };
  }
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

/** Get current session (async only) */
export async function getSession(): Promise<Session> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("getSession:", error);
    return null;
  }
  return data.session;
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
