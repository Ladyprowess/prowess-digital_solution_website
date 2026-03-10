"use client";

// FILE: src/app/login/page.tsx
//
// What this file does:
// This is the login screen at /login on your website.
// The user types their email and password.
// Supabase checks if that email and password exist in your auth users.
// If correct, they get sent to /dashboard.
// If wrong, they see an error message.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const B = "#507c80";

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div style={{ minHeight: "100svh", background: "linear-gradient(135deg,#0a1628,#0f2832,#0a1628)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans',-apple-system,sans-serif" }}>
      {/* Prevent iOS zoom on inputs */}
      <style>{`input,select,textarea{font-size:16px!important}`}</style>
      <div style={{ width: 400, maxWidth: "100%" }}>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: B, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <span style={{ color: "white", fontSize: 26, fontWeight: 800 }}>P</span>
          </div>
          <div style={{ color: "white", fontSize: 20, fontWeight: 800 }}>Prowess Digital Solutions</div>
          <div style={{ color: "#4b6470", fontSize: 13, marginTop: 4 }}>Internal Team Portal</div>
        </div>

        <div style={{ background: "white", borderRadius: 16, padding: 32, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Sign in</div>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24 }}>Access your workspace</div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, boxSizing: "border-box", outline: "none" }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 13, color: "#ef4444", marginBottom: 14, padding: "10px 14px", background: "#fef2f2", borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: "100%", padding: 12, borderRadius: 10, background: loading ? "#94a3b8" : B, color: "white", border: "none", cursor: loading ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 700 }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
