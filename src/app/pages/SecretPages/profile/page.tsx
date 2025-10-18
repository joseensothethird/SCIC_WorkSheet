"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, logoutUser, deleteUserAccount, User } from "./../../../lib/auth";
import { supabase } from "./../../../lib/SupabaseClient";
import styles from "../../../CSS/SecretPage.module.css";

export default function SecretPageProfile() {
  const router = useRouter();
  const [session, setSession] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const s = await getSession();
        if (!s) {
          router.push("/");
          return;
        }
        setSession(s.user);
        await fetchMessage(s.user.id);
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  /** Fetch secret message */
  async function fetchMessage(userId: string) {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from("secrets")
        .select("message")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // ignore "row not found"
      if (data?.message) setMessage(data.message);
    } catch (err) {
      console.error("Fetch message error:", err);
    }
  }

  /** Delete user account with double confirmation */
  const handleDeleteAccount = async () => {
    if (!session) return;

    const confirmDelete = confirm(
      "⚠️ Are you sure you want to delete your account?\nThis will permanently delete your account and all your data!"
    );
    if (!confirmDelete) return;

    const doubleConfirm = prompt("Type YES to delete your account permanently.");
    if (doubleConfirm !== "YES") return;

    try {
      const result = await deleteUserAccount(session.id);
      
      if (!result.ok) {
        let errorMessage = "Unknown error";
        
        // Handle different error types
        if (result.error) {
          if (typeof result.error === "string") {
            errorMessage = result.error;
          } else if (result.error && "message" in result.error) {
            errorMessage = (result.error as any).message;
          }
        }
        
        throw new Error(errorMessage);
      }

      router.push("/");
    } catch (err) {
      console.error("Delete account error:", err);
      alert("❌ Failed to delete your account. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.icon}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 style={{ color: "#000" }}>Loading your secret...</h2>
          <p style={{ color: "#000" }}>Please wait while we fetch your message</p>
        </div>
      </div>
    );
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className={styles.title}>My Secret Message</h1>
          <p className={styles.welcomeText}>Welcome back, {session?.email} 👋</p>
        </div>

        {/* Display Secret Message */}
        <div className={styles.messageSection}>
          <div className={styles.messageCard}>
            <h2 className={styles.messageTitle}>
              <svg
                className={styles.messageIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Your Secret Message
            </h2>
            {message ? (
              <p className={styles.messageContent}>{message}</p>
            ) : (
              <p className={styles.emptyMessage}>No secret message saved yet</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button onClick={() => router.push("/")} className={styles.backButton}>
            Back to Dashboard
          </button>

          <button
            onClick={async () => {
              await logoutUser();
              router.push("/");
            }}
            className={styles.logoutButton}
          >
            Sign Out
          </button>

          <button onClick={handleDeleteAccount} className={styles.deleteButton}>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}