"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, logoutUser, deleteUserAccount } from "./../../../lib/auth";
import { supabase } from "./../../../lib/SupabaseClient";
import styles from "../../../CSS/SecretPage.module.css";

interface User {
  id: string;
  email: string;
}

export default function SecretPageMessage() {
  const router = useRouter();
  const [session, setSession] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    async function init() {
      const s = await getSession(); // ✅ Use the correct async getSession
      if (!s) {
        router.push("/");
        return;
      }

      const user: User = {
        id: s.user.id,
        email: s.user.email || "",
      };

      setSession(user);
      await fetchMessage(user.id);
      setLoading(false);
    }
    init();
  }, [router]);

  async function fetchMessage(userId: string) {
    try {
      const { data, error } = await supabase
        .from("secrets")
        .select("message")
        .eq("user_id", userId)
        .single();

      if (!error && data) {
        setMessage(data.message);
        setCharCount(data.message.length);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    setCharCount(value.length);
    setStatusMessage("");
  };

  async function saveMessage() {
    if (!message.trim()) {
      setStatusMessage("⚠️ Secret message cannot be empty.");
      return;
    }
    if (!session) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("secrets")
        .upsert(
          [
            {
              user_id: session.id,
              message: message.trim(),
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("Save error:", error);
        setStatusMessage(`❌ Failed to save message: ${error.message}`);
      } else {
        setStatusMessage("✅ Secret message saved successfully!");
        setTimeout(() => setStatusMessage(""), 3000);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setStatusMessage("❌ Failed to save message due to unexpected error.");
    } finally {
      setSaving(false);
    }
  }

  const handleDeleteAccount = async () => {
    if (!session) return;

    const confirmDelete = confirm(
      "⚠️ Are you sure you want to delete your account?\n\nThis will permanently delete:\n• Your account\n• Your secret message\n• All your friend connections\n\nThis action CANNOT be undone!"
    );

    if (!confirmDelete) return;

    const doubleConfirm = prompt("Type YES to delete your account permanently.");
    if (doubleConfirm !== "YES") return;

    try {
      await deleteUserAccount(session.id);
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
          <h2 style={{ color: "#000" }}>Loading Your Secret</h2>
          <p style={{ color: "#000" }}>Retrieving your encrypted message...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className={styles.title} style={{ color: "#000" }}>
            Secret Message
          </h1>
          <p className={styles.welcomeText} style={{ color: "#000" }}>
            Welcome back, {session.email} 👋
          </p>
        </div>

        {/* Message Editor */}
        <div className={styles.section}>
          <div className={styles.editorSection}>
            <label className={styles.label}>Your Secret Message</label>
            <textarea
              className={styles.modernTextarea}
              rows={8}
              placeholder="Write your secret message here..."
              value={message}
              onChange={handleMessageChange}
              maxLength={1000}
            />
            <div
              style={{
                marginTop: "0.75rem",
                fontSize: "0.875rem",
                color: charCount > 900 ? "#ef4444" : "#6b7280",
              }}
            >
              {charCount} / 1000 characters
            </div>
            {statusMessage && <div className={styles.statusMessage}>{statusMessage}</div>}
            <button
              onClick={saveMessage}
              disabled={saving || !message.trim()}
              className={styles.saveButton}
            >
              {saving ? "Saving..." : "Save Secret"}
            </button>
          </div>
        </div>

        {/* Actions */}
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
