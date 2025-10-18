"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionAsync, logoutUser, deleteUserAccount } from "./../../../lib/auth";
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
      const s = await getSessionAsync();
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
    } finally {
      setLoading(false);
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
              updated_at: new Date(),
            },
          ],
          {
            onConflict: ["user_id"],
          }
        );

      if (error) {
        console.error("Save error:", error);
        setStatusMessage(`❌ Failed to save message: ${error.message}`);
      } else {
        setStatusMessage("✅ Secret message saved successfully!");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setStatusMessage("❌ Failed to save message due to unexpected error.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <h2 className="heroTitle">Loading Your Secret</h2>
          <p className="heroSubtitle">Retrieving your encrypted message...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.heroSection}>
          <h1>Secret Message</h1>
          <p>Welcome back, {session?.email} 👋</p>
        </div>

        <div className={styles.editorSection}>
          <textarea
            className={styles.modernTextarea}
            rows={6}
            placeholder="Write your secret message here..."
            value={message}
            onChange={handleMessageChange}
            maxLength={1000}
          />
          <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
            {charCount} / 1000 characters
          </div>
          {statusMessage && (
            <div
              style={{
                color: statusMessage.startsWith("✅") ? "green" : "red",
                fontWeight: "bold",
                marginTop: "0.5rem",
              }}
            >
              {statusMessage}
            </div>
          )}

          <button
            onClick={saveMessage}
            disabled={saving || !message.trim()}
            className={`${styles.saveButton} ${saving ? styles.saving : ""}`}
          >
            {saving ? "Saving..." : "Save Secret"}
          </button>
        </div>

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
          <button
            onClick={async () => {
              const confirmDelete = confirm(
                "Are you sure you want to delete your account? This action cannot be undone."
              );
              if (confirmDelete) {
                await deleteUserAccount();
                router.push("/");
              }
            }}
            className={styles.deleteButton}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
