"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { supabase } from "@/lib/supabase";

export default function AccountLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleLogin() {
    setErr("");
    if (!email.trim() || !password) {
      setErr("Enter your email and password.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push("/account");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <Container>
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8">
          <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Welcome back to Prowess Digital Solutions.</p>

          <div className="mt-6 grid gap-4">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
            />

            {err ? <p className="text-sm text-red-600">{err}</p> : null}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/account/signup" className="font-semibold text-primary hover:underline">Create an account</Link>
          </p>
        </div>
      </Container>
    </div>
  );
}
