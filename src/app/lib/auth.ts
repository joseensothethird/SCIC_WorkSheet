// src/app/lib/auth.ts
import { supabase } from "./../lib/SupabaseClient";
import type { User as SupabaseUser, Session as SupabaseSession } from "@supabase/supabase-js";

export type User = SupabaseUser;
export type Session = SupabaseSession | null;

/** Helper to safely get supabase client (avoids SSR issues) */
function getSupabase() {
  if (!supabase) {
    console.warn("Supabase client not initialized. Are you running on the server?");
    return null;
  }
  return supabase;
}

/** Register user with email & password */
export async function registerUser(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase client not available" };

  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) {
    console.error("registerUser:", error);
    return { ok: false, error };
  }
  return { ok: true, data };
}

/** Login user */
export async function loginUser(email: string, password: string) {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase client not available" };

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("loginUser:", error);
    return { ok: false, error };
  }
  return { ok: true, data };
}

/** Logout */
export async function logoutUser() {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase client not available" };

  const { error } = await sb.auth.signOut();
  if (error) console.error("logoutUser:", error);
  return { ok: !error, error };
}

/** Get current session (async) */
export async function getSession(): Promise<Session> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data, error } = await sb.auth.getSession();
    if (error) {
      console.error("getSession:", error);
      return null;
    }
    return data.session;
  } catch (err) {
    console.error("getSession error:", err);
    return null;
  }
}

/** Delete current user row from 'users' table */
export async function deleteUserAccount(userId: string) {
  if (!userId) return { ok: false, error: "No user ID provided" };

  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase client not available" };

  try {
    const { error } = await sb.from("users").delete().eq("id", userId);
    if (error) {
      console.error("deleteUserAccount:", error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (err) {
    console.error("deleteUserAccount error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
