"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser, registerUser, getSessionAsync } from "../lib/auth";
import { supabase } from "../lib/supabaseClient";
import styles from "./../page.module.css";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("Checking Supabase connection...");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if user is already logged in
  useEffect(() => {
    async function checkExistingSession() {
      const session = await getSessionAsync();
      if (session?.user) {
        // User is already logged in, redirect to dashboard
        router.replace("/secret-page-1");
      }
    }
    checkExistingSession();
  }, [router]);

  // Check Supabase connection
  useEffect(() => {
    async function checkConnection() {
      try {
        const { data, error } = await supabase.from("users").select("*").limit(1);
        if (error) throw error;
        setConnectionStatus("✅ Supabase connected successfully");
      } catch (err) {
        setConnectionStatus("⚠️ Supabase connection failed — check your .env.local or table setup");
      }
    }
    checkConnection();
  }, []);

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    
    if (isLogin) {
      const res = await loginUser(email, password);
      setBusy(false);
      if (!res.ok) {
        alert(res.error?.message || "Login failed");
        return;
      }
      
      // Get redirect path from URL params or default to dashboard
      const redirectTo = searchParams?.get('redirect') || '/secret-page-1';
      router.replace(redirectTo);
    } else {
      const res = await registerUser(email, password);
      setBusy(false);
      if (!res.ok) {
        alert(res.error?.message || "Registration failed");
        return;
      }
      alert("Registration successful! Please sign in.");
      setIsLogin(true);
      setEmail("");
      setPassword("");
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <div className={styles.formCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className={styles.subtitle}>
              {isLogin ? "Sign in to your account" : "Register to get started"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <input
              type="email"
              placeholder="Email address"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="submit"
              className={styles.submitButton}
              disabled={busy}
            >
              {busy ? "Please wait..." : isLogin ? "Sign in" : "Register"}
            </button>
          </form>

          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setEmail("");
              setPassword("");
            }}
            className={styles.toggleButton}
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>

          <p
            style={{
              marginTop: "20px",
              fontSize: "13px",
              color: connectionStatus.includes("✅") ? "green" : "red",
              textAlign: "center",
            }}
          >
            {connectionStatus}
          </p>
        </div>
      </div>
    </div>
  );
}