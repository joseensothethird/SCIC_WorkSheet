"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "./lib/SupabaseClient";
import { logoutUser } from "./lib/auth";
import styles from "./CSS/SecretPage.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.replace("/pages/auth");
      } else {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  async function checkAuth() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.replace("/pages/auth");
        return;
      }

      setIsAuthenticated(true);
      setUserEmail(session.user.email || "");
    } catch (err) {
      console.error("Auth check failed:", err);
      router.replace("/pages/auth");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    setIsLoading(true);
    const { ok } = await logoutUser();
    if (ok) {
      router.replace("/pages/auth");
    } else {
      alert("Logout failed. Please try again.");
      setIsLoading(false);
    }
  }

  const handleDeleteAccount = async () => {
  if (!user) return;
  if (!confirm("Are you sure you want to delete your account?")) return;

  const res = await deleteUserAccount(user.id);

  if (res.ok) {
    alert("Account deleted successfully.");
    await logoutUser(); // log them out after deletion
    router.replace("/"); 
  } else {
    alert("Failed to delete account: " + res.error?.message);
  }
};

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <p style={{ textAlign: "center", color: "#666" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content until authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
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

        {/* Navigation Buttons */}
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

        {/* Logout & Delete */}
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