"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Shared checkout trigger for any premium item (course or resource). The
// amount is never sent from here - /api/content/checkout reads the real
// price server-side. If signed in, uses that verified email automatically;
// otherwise this is a guest checkout (same pattern as skill_to_business),
// and the buyer will need to sign in with the same email afterward to
// actually read what they bought (see /api/content/access).
export function BuyButton({
  itemType,
  itemId,
  price,
  currency,
  className = "",
}: {
  itemType: "resource" | "course";
  itemId: string;
  price: number | null;
  currency: string | null;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) {
        setEmail(data.session.user.email);
        setSignedIn(true);
      }
    });
  }, []);

  async function buy() {
    setErr("");
    if (!email.trim()) return setErr("Enter your email to continue.");
    setLoading(true);
    try {
      const res = await fetch("/api/content/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), itemType, itemId }),
      });
      const data = await res.json();
      if (!data.ok || !data.authorizationUrl) {
        setErr(data.error || "Could not start checkout.");
        setLoading(false);
        return;
      }
      window.location.href = data.authorizationUrl;
    } catch {
      setErr("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      {!signedIn && (
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="mb-2 w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground"
        />
      )}
      <button
        type="button"
        onClick={buy}
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Starting checkout…" : `Buy for ${currency || "USD"} ${price?.toLocaleString() ?? ""}`}
      </button>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </div>
  );
}
