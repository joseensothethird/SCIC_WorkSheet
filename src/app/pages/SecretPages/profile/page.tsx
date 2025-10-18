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
      const s = await getSession(); // Use the correct async getSession
      if (!s) {
        router.push("/");
        return;
      }
      setSession(s.user);
      await fetchMessage(s.user.id);
    }
    init();
  }, [router]);

  async function fetchMessage(userId: string) {
    const { data, error } = await supabase
      .from("secrets")
      .select("message")
      .eq("user_id", userId)
      .single();

    if (!error && data) setMessage(data.message);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.icon}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 style={{ color: '#000000' }}>Loading your secret...</h2>
          <p style={{ color: '#000000' }}>Please wait while we fetch your message</p>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className={styles.title} style={{ color: '#000000' }}>My Secret Message</h1>
          <p className={styles.welcomeText} style={{ color: '#000000' }}>Welcome back, {session?.email} 👋</p>
        </div>

        {/* Display Secret Message */}
        <div className={styles.messageSection}>
          <div className={styles.messageCard}>
            <h2 className={styles.messageTitle}>
              <svg className={styles.messageIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Your Secret Message
            </h2>
            {message ? (
              <p className={styles.messageContent}>
                {message}
              </p>
            ) : (
              <p className={styles.emptyMessage}>
                No secret message saved yet
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button
            onClick={() => router.push("/")}
            className={styles.backButton}
          >
            Back to Dashboard
          </button>

          <button
            onClick={async () => {
              await logoutUser();
              router.push("/");
            }}
            className={styles.logoutButton}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>

          <button
            onClick={async () => {
              if (!session) return;
              const confirmDelete = confirm("Are you sure you want to delete your account? This action cannot be undone.");
              if (confirmDelete) {
                await deleteUserAccount(session.id);
                router.push("/");
              }
            }}
            className={styles.deleteButton}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
