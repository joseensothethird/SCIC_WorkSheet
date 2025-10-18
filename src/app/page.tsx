"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "./lib/SupabaseClient";
import { logoutUser, deleteUserAccount } from "./lib/auth";
import styles from "./CSS/SecretPage.module.css";

// Safely get Supabase client (returns null on SSR)
function getSupabase() {
  if (!supabase) {
    console.warn("Supabase client not initialized (SSR build?)");
    return null;
  }
  return supabase;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;

    try {
      const { data: { session }, error } = await sb.auth.getSession();

      if (error || !session) {
        router.replace("/pages/auth");
        return;
      }

      setIsAuthenticated(true);
      setUserEmail(session.user.email || "");
      setUserId(session.user.id);
    } catch (err) {
      console.error("Auth check failed:", err);
      router.replace("/pages/auth");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();

    const sb = getSupabase();
    if (!sb) return;

    const { data: listener } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/pages/auth");
      } else {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
        setUserId(session.user.id);
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, [checkAuth, router]);

  const handleLogout = async () => {
    setIsLoading(true);
    const { ok, error } = await logoutUser();

    if (ok) {
      router.replace("/pages/auth");
    } else {
      const errorMessage = typeof error === "string" ? error : error?.message || "Logout failed";
      alert(errorMessage);
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    if (!confirm("Are you sure you want to delete your account?")) return;

    setIsLoading(true);
    const res = await deleteUserAccount(userId);

    if (res.ok) {
      alert("Account deleted successfully.");
      await logoutUser();
      router.replace("/"); 
    } else {
      const errorMessage = typeof res.error === "string" 
        ? res.error 
        : res.error?.message || "Unknown error";
      alert("Failed to delete account: " + errorMessage);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <p style={{ textAlign: "center", color: "#666" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Welcome Section */}
        <div className={styles.welcomeSection}>
          <div className={styles.icon}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className={styles.title}>Welcome to Your Dashboard</h1>
          <p className={styles.welcomeText}>Hello, {userEmail || "User"} 👋</p>
        </div>

        {/* Dashboard Buttons */}
        <div className={styles.buttonGrid}>
          <Link href="/pages/SecretPages/profile">
            <button className={`${styles.dashboardButton} ${styles.profile}`}>
              Profile Settings
            </button>
          </Link>
          <Link href="/pages/SecretPages/message">
            <button className={`${styles.dashboardButton} ${styles.secrets}`}>
              My Secret Message
            </button>
          </Link>
          <Link href="/pages/SecretPages/friend">
            <button className={`${styles.dashboardButton} ${styles.friends}`}>
              Friends & Requests
            </button>
          </Link>
        </div>

        {/* Actions */}
        <div className={styles.actionButtons}>
          <button 
            className={styles.logoutButton}
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? "Signing Out..." : "Sign Out"}
          </button>
          <button 
            className={styles.deleteButton}
            onClick={handleDeleteAccount}
            disabled={isLoading}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
