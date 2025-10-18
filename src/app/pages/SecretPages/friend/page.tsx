"use client";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, logoutUser } from "../../../lib/auth";
import { supabase } from "../../../lib/SupabaseClient";
import styles from "../../../CSS/SecretPage.module.css";

interface User {
  id: string;
  email: string;
}

interface Friend {
  id: string;
  requester: string;
  requestee: string;
  status: "pending" | "accepted";
  requester_user?: User;
  requestee_user?: User;
}

interface FriendRequest {
  id: string;
  requester: string;
  requestee: string;
  status: "pending";
  created_at?: string;
  requester_email: string;
}

interface Secret {
  user_id: string;
  message: string;
  created_at: string;
}

/** Safely get Supabase client */
function getSupabase() {
  if (!supabase) throw new Error("Supabase client not initialized");
  return supabase;
}

export default function SecretPage3() {
  const router = useRouter();
  const [session, setSession] = useState<User | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allSecrets, setAllSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bulletin" | "requests" | "discover">("bulletin");
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  useEffect(() => {
    async function init() {
      const s = await getSession();
      if (!s) return router.push("/");

      const user: User = { id: s.user.id, email: s.user.email || "" };
      setSession(user);

      await Promise.all([
        fetchFriends(user.id),
        fetchFriendRequests(user.id),
        fetchSentRequests(user.id),
        fetchAllUsers(user.id),
        fetchAllSecrets(),
      ]);

      setLoading(false);
    }
    init();
  }, [router]);

  /** Fetch accepted friends */
  async function fetchFriends(userId: string) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("friends")
        .select(`
          id,
          requester,
          requestee,
          status,
          requester_user:requester(id,email),
          requestee_user:requestee(id,email)
        `)
        .or(`requester.eq.${userId},requestee.eq.${userId}`)
        .eq("status", "accepted");

      if (error) throw error;

      if (data) {
        const transformedFriends: Friend[] = data.map((item: any) => ({
          id: item.id,
          requester: item.requester,
          requestee: item.requestee,
          status: item.status,
          requester_user: Array.isArray(item.requester_user) ? item.requester_user[0] : item.requester_user,
          requestee_user: Array.isArray(item.requestee_user) ? item.requestee_user[0] : item.requestee_user,
        }));
        setFriends(transformedFriends);
      }
    } catch (err) {
      console.error("fetchFriends error:", err);
    }
  }

  /** Fetch incoming friend requests */
  async function fetchFriendRequests(userId: string) {
    try {
      const sb = getSupabase();
      const { data: requestsData, error: requestsError } = await sb
        .from("friends")
        .select("id, requester, requestee, status, created_at")
        .eq("requestee", userId)
        .eq("status", "pending");

      if (requestsError) throw requestsError;
      if (!requestsData || requestsData.length === 0) return setFriendRequests([]);

      const requesterIds = requestsData.map(req => req.requester);
      const { data: usersData } = await sb.from("users").select("id,email").in("id", requesterIds);

      const enrichedRequests = requestsData.map(req => ({
        ...req,
        requester_email: usersData?.find(u => u.id === req.requester)?.email || "Unknown",
      })) as FriendRequest[];

      setFriendRequests(enrichedRequests);
    } catch (err) {
      console.error("fetchFriendRequests error:", err);
    }
  }

  /** Fetch sent friend requests */
  async function fetchSentRequests(userId: string) {
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from("friends")
        .select("id, requester, requestee, status")
        .eq("requester", userId)
        .eq("status", "pending");

      if (error) throw error;
      setSentRequests(data as FriendRequest[]);
    } catch (err) {
      console.error("fetchSentRequests error:", err);
    }
  }

  /** Fetch all users for discovery */
  async function fetchAllUsers(userId: string) {
    try {
      const sb = getSupabase();
      const { data } = await sb.from("users").select("id,email").neq("id", userId);
      if (data) setAllUsers(data as User[]);
    } catch (err) {
      console.error("fetchAllUsers error:", err);
    }
  }

  /** Fetch all secrets */
  async function fetchAllSecrets() {
    try {
      const sb = getSupabase();
      const { data } = await sb
        .from("secrets")
        .select("user_id,message,created_at")
        .order("created_at", { ascending: false });
      if (data) setAllSecrets(data as Secret[]);
    } catch (err) {
      console.error("fetchAllSecrets error:", err);
    }
  }

  /** Send friend request */
  async function sendFriendRequest(userId: string) {
    if (!session) return;
    setAddingFriendId(userId);

    try {
      const sb = getSupabase();
      await sb.from("friends").insert([{ requester: session.id, requestee: userId }]);
      await Promise.all([
        fetchFriends(session.id),
        fetchFriendRequests(session.id),
        fetchSentRequests(session.id),
      ]);
      setSuccessMessage("Friend request sent successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("sendFriendRequest error:", err);
    } finally {
      setAddingFriendId(null);
    }
  }

  /** Accept friend request */
  async function acceptFriendRequest(requestId: string) {
    if (!session) return;
    try {
      const sb = getSupabase();
      const { error } = await sb.from("friends").update({ status: "accepted" }).eq("id", requestId);
      if (error) throw error;

      await Promise.all([
        fetchFriends(session.id),
        fetchFriendRequests(session.id),
        fetchSentRequests(session.id),
      ]);

      setSuccessMessage("Friend request accepted!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("acceptFriendRequest error:", err);
    }
  }

  /** Utilities */
  function getRandomName(userId: string) {
    const adjectives = ["Mysterious", "Secret", "Anonymous", "Hidden", "Silent", "Quiet", "Unknown"];
    const animals = ["Panda", "Fox", "Owl", "Raven", "Wolf", "Tiger", "Dolphin"];
    const hash = userId.split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    return `${adjectives[Math.abs(hash) % adjectives.length]} ${animals[Math.abs(hash * 2) % animals.length]}`;
  }

  function formatTimestamp(timestamp: string) {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  function isFriend(userId: string) {
    return friends.some(f =>
      (f.requester === userId && f.requestee === session?.id) ||
      (f.requestee === userId && f.requester === session?.id)
    );
  }

  if (loading) return (
    <div className={styles.container}>
      <div className={styles.loading}>
        <h2>Loading Community...</h2>
        <p>Fetching messages and user data</p>
      </div>
    </div>
  );

  if (!session) return null;
  
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.welcomeSection}>
          <div className={styles.icon}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 className={styles.title} style={{ color: '#000000' }}>Secret Community</h1>
          <p className={styles.welcomeText} style={{ color: '#000000' }}>Welcome, {session.email} 👋</p>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className={styles.successMessage}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tabButton} ${activeTab === "bulletin" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("bulletin")}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v12" />
            </svg>
            Community Posts ({allSecrets.length})
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "requests" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Requests ({friendRequests.length})
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === "discover" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("discover")}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Discover ({allUsers.length})
          </button>
        </div>

        {/* Bulletin Board - Post Style */}
        {activeTab === "bulletin" && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle} style={{ color: '#000000' }}>Community Bulletin Board</h3>
            {allSecrets.length === 0 ? (
              <div className={styles.emptyState} style={{ color: '#000000' }}>
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                No messages yet. Be the first to share something!
              </div>
            ) : (
              <div className={styles.postsContainer}>
                {allSecrets.map((msg, idx) => {
                  const friendLabel = isFriend(msg.user_id) ? " (Friend)" : "";
                  const authorEmail =
                    msg.user_id === session.id
                      ? session.email
                      : allUsers.find(u => u.id === msg.user_id)?.email || getRandomName(msg.user_id);

                  return (
                    <div key={msg.user_id + idx} className={styles.postCard}>
                      <div className={styles.postHeader}>
                        <div className={styles.postAuthor}>
                          <div className={styles.authorAvatar}>
                            {getRandomName(msg.user_id).charAt(0)}
                          </div>
                          <div className={styles.authorInfo}>
                            <span className={styles.authorName}>
                              {authorEmail}{friendLabel}
                            </span>
                            {msg.created_at && (
                              <span className={styles.postTime}>
                                {formatTimestamp(msg.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={styles.postContent}>
                        <p>{msg.message}</p>
                      </div>
                      <div className={styles.postActions}>
                        <button className={styles.postAction}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Like
                        </button>
                        <button className={styles.postAction}>
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          Comment
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Friend Requests */}
        {activeTab === "requests" && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle} style={{ color: '#000000' }}>Friend Requests ({friendRequests.length})</h3>
            {friendRequests.length === 0 ? (
              <div className={styles.emptyState} style={{ color: '#000000' }}>
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                No pending friend requests
              </div>
            ) : (
              <div className={styles.requestsList}>
                {friendRequests.map((req) => (
                  <div key={req.id} className={styles.requestCard}>
                    <div className={styles.requestInfo}>
                      <div className={styles.requestAvatar}>
                        {req.requester_email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.requestName}>{req.requester_email}</div>
                        <div className={styles.requestText}>Wants to be your friend</div>
                      </div>
                    </div>
                    <button
                      onClick={() => acceptFriendRequest(req.id)}
                      className={styles.acceptButton}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Accept
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Discover Users */}
        {activeTab === "discover" && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle} style={{ color: '#000000' }}>Discover Users</h3>
            {allUsers.filter(
              (user) => !friends.some(
                (f) => f.requester === user.id || f.requestee === user.id
              )
            ).length === 0 ? (
              <div className={styles.emptyState} style={{ color: '#000000' }}>
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                No users available
              </div>
            ) : (
              <div className={styles.usersGrid}>
                {allUsers
                  .filter(
                    (user) => !friends.some(
                      (f) => f.requester === user.id || f.requestee === user.id
                    )
                  )
                  .map((user) => {
                    const requestSent = sentRequests.some(
                      (req) => req.requestee === user.id
                    );

                    return (
                      <div key={user.id} className={styles.userCard}>
                        <div className={styles.userInfo}>
                          <div className={styles.userAvatar}>
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                          <span className={styles.userEmail}>{user.email}</span>
                        </div>
                        {!requestSent && (
                          <button
                            onClick={() => sendFriendRequest(user.id)}
                            className={styles.addButton}
                            disabled={addingFriendId === user.id}
                          >
                            {addingFriendId === user.id ? "Adding..." : "Add Friend"}
                          </button>
                        )}
                        {requestSent && (
                          <span className={styles.requestSent}>Request Sent</span>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

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
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}