"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccountSession } from "@/components/account/MemberSessionProvider";
import { supabase } from "@/lib/supabase";

function initials(name: string | null, email: string | null): string {
  const source = (name || email || "?").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </Link>
  );
}

export default function AccountOverviewPage() {
  const { profile, email } = useAccountSession();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ saved: 0, learningInProgress: 0, purchases: 0, interests: 0 });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const userId = session?.user?.id;

      const [savedCount, learningRows, interestCount, purchasesRes, staffRow] = await Promise.all([
        supabase.from("saved_items").select("id", { count: "exact", head: true }),
        supabase.from("learning_progress").select("status"),
        supabase.from("user_career_interests").select("career_path_id", { count: "exact", head: true }),
        token
          ? fetch("/api/account/purchases", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null)
          : Promise.resolve(null),
        userId
          ? supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      setIsAdmin(staffRow?.data?.role === "admin");
      const learningInProgress = (learningRows.data || []).filter((r) => r.status !== "completed").length;
      setCounts({
        saved: savedCount.count || 0,
        learningInProgress,
        purchases: purchasesRes?.ok ? purchasesRes.items.length : 0,
        interests: interestCount.count || 0,
      });
      setLoading(false);
    })();
  }, []);

  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Overview</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}.</p>

      {/* Profile hero */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
            {initials(profile?.full_name || null, email)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{profile?.full_name || "My Account"}</h2>
            {profile?.headline && <p className="mt-0.5 text-sm text-muted-foreground">{profile.headline}</p>}
            <p className="mt-1 text-sm text-muted-foreground">{email}{memberSince ? ` · Member since ${memberSince}` : ""}</p>
          </div>
        </div>
        <Link href="/account/settings" className="flex-shrink-0 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">
          Edit profile
        </Link>
      </div>

      {isAdmin && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
          <div>
            <p className="text-sm font-bold text-primary">You&rsquo;re signed in as an admin</p>
            <p className="mt-1 text-sm text-muted-foreground">Manage jobs, opportunities, courses, users, purchases and more from one dashboard.</p>
          </div>
          <Link href="/admin" className="flex-shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Open Admin Dashboard →
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Saved" value={loading ? 0 : counts.saved} href="/account/saved" />
        <StatCard label="Learning in Progress" value={loading ? 0 : counts.learningInProgress} href="/account/learning" />
        <StatCard label="Purchases" value={loading ? 0 : counts.purchases} href="/account/purchases" />
        <StatCard label="Career Interests" value={loading ? 0 : counts.interests} href="/account/interests" />
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Looking to hire or grow your business? <Link href="/services" className="font-semibold text-primary hover:underline">Visit For Businesses</Link>
      </p>
    </div>
  );
}
