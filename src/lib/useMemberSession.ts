"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export type MemberProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  created_at: string;
};

// Guards the /account/* pages (B2C member dashboard) - deliberately separate
// from useRequireAdmin (which checks profiles.role = 'admin', the internal
// staff table) and from /login -> /dashboard (also internal staff). Any
// signed-in Supabase user is a valid member here; there's no role check.
export function useMemberSession() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out">("loading");
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Only drop to "loading" on the very first call - `reload()` (e.g.
    // after saving a profile edit) re-runs this same function, and if it
    // re-armed "loading" every time, every consumer gating its render on
    // status (the whole /account dashboard shell) would unmount and flash
    // a blank loading screen for what should be a quiet background refresh.
    setStatus((s) => (s === "ready" ? s : "loading"));
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setStatus("signed-out");
      router.push("/account/login");
      return;
    }
    setEmail(user.email ?? null);

    let { data: profileRow } = await supabase
      .from("member_profiles")
      .select("id, full_name, avatar_url, headline, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileRow) {
      const { data: created } = await supabase
        .from("member_profiles")
        .insert({ id: user.id, full_name: user.user_metadata?.full_name || null })
        .select("id, full_name, avatar_url, headline, created_at")
        .single();
      profileRow = created ?? null;
    }

    setProfile(profileRow);
    setStatus("ready");

    // Claim any guest purchases made with this email before the account
    // existed. Server-side because purchases has no client-readable/writable
    // RLS policy for regular users - the client can't do this directly.
    if (session.access_token) {
      fetch("/api/account/claim-purchases", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {});
    }
  }, [router]);

  useEffect(() => { (async () => { await load(); })(); }, [load]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/account/login");
  }, [router]);

  return { status, profile, email, reload: load, signOut };
}
