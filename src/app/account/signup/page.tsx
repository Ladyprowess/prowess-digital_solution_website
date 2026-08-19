"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Container from "@/components/Container";
import { supabase } from "@/lib/supabase";

export default function AccountSignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSignup() {
    setErr("");
    if (!fullName.trim() || !email.trim() || !password) {
      setErr("Please fill in every field.");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } },
    });
    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }
    if (data.session) {
      router.push(redirect);
      return;
    }
    // Email confirmation required before a session exists.
    setCheckEmail(true);
  }

  if (checkEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <Container>
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center">
            <h1 className="text-xl font-bold text-foreground">Check your email</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              We sent a confirmation link to <b>{email}</b>. Confirm it, then{" "}
              <Link href={`/account/login${redirect !== "/account" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="font-semibold text-primary hover:underline">sign in</Link>.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <Container>
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8">
          <h1 className="text-2xl font-bold text-foreground">Join Prowess Digital Solutions</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Save jobs and opportunities, track your purchases, and continue learning where you left off.
          </p>

          <div className="mt-6 grid gap-4">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
            />
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
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
            />

            {err ? <p className="text-sm text-red-600">{err}</p> : null}

            <button
              type="button"
              onClick={handleSignup}
              disabled={loading}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href={`/account/login${redirect !== "/account" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="font-semibold text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </Container>
    </div>
  );
}
