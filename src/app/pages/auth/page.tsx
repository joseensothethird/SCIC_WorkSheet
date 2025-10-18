"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "../../lib/auth";
import { supabase } from "../../lib/SupabaseClient";
import styles from "./../../CSS/auth.module.css";

export default function AuthForms() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseInfo, setSupabaseInfo] = useState<string>("");

  // Optional: check if Supabase client is connected
  useEffect(() => {
    async function checkSupabase() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          setSupabaseInfo("Connected to Supabase. Session active.");
        } else {
          setSupabaseInfo(
            "Connected to Supabase. No active session. Email confirmation may be required."
          );
        }
      } catch (err) {
        setSupabaseInfo("Unable to connect to Supabase.");
        console.error(err);
      }
    }
    checkSupabase();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    if (isLogin) {
      const res = await loginUser(email, password);
      if (res.ok) {
        // Redirect to main page after login
        router.replace("/");
      } else {
        setError(res.error?.message || "Invalid email or password.");
      }
    } else {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setIsLoading(false);
        return;
      }
      const res = await registerUser(email, password);
      if (res.ok) {
        // Redirect to main page after registration
        router.replace("/");
      } else {
        setError(res.error?.message || "Registration failed.");
      }
    }
  } catch {
    setError("An unexpected error occurred. Try again.");
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        {/* Header */}
        <div className={styles.authHeader}>
          <div className={styles.authIcon}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className={styles.authTitle}>{isLogin ? "Welcome Back" : "Create Account"}</h1>
          <p className={styles.authSubtitle}>
            {isLogin
              ? "Sign in to your account to continue"
              : "Fill in the details to create a new account"}
          </p>
        </div>

        {/* Form */}
        <form className={styles.authForm} onSubmit={handleSubmit}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.inputLabel}>Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              className={styles.authInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.inputLabel}>Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              className={styles.authInput}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {!isLogin && (
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.inputLabel}>Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                className={styles.authInput}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          )}

          <button type="submit" className={styles.authButton} disabled={isLoading}>
            {isLoading ? "Processing..." : isLogin ? "Sign In" : "Register"}
          </button>
        </form>

        {/* Supabase Info / Warning */}
        {supabaseInfo && <p className={styles.supabaseInfo}>{supabaseInfo}</p>}

        {/* Toggle Form */}
        <div className={styles.divider}>
          <span>{isLogin ? "New here?" : "Already have an account?"}</span>
        </div>
        <div className={styles.registerPrompt}>
          <span
            className={styles.registerLink}
            onClick={() => setIsLogin(!isLogin)}
            style={{ cursor: "pointer" }}
          >
            {isLogin ? "Create an account" : "Sign in here"}
          </span>
        </div>
      </div>
    </div>
  );
}
