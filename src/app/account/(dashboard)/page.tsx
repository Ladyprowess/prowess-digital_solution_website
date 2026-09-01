"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BriefcaseBusiness, Library, ReceiptText, Route, type LucideIcon } from "lucide-react";
import { useAccountSession } from "@/components/account/MemberSessionProvider";
import { supabase } from "@/lib/supabase";

function initials(name: string | null, email: string | null): string {
  const source = (name || email || "?").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function StatCard({ label, value, href, icon: Icon }: { label: string; value: number; href: string; icon: LucideIcon }) {
  return (
    <Link href={href} className="rounded-lg border border-border bg-card p-5 transition-[border-color,background-color] duration-150 ease-out hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <Icon className="text-primary" size={18} aria-hidden="true" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
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
      <p className="mt-1 text-sm text-muted-foreground">Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}. Your library, saves, learning, purchases, and career interests are here.</p>

      {/* Profile hero */}
      <div className="mt-6 flex flex-wrap items-start justify-between gap-6 rounded-lg border border-border bg-card p-6 sm:p-8">
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
        <Link href="/account/settings" className="inline-flex min-h-10 flex-shrink-0 items-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors duration-150 ease-out hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Edit profile
        </Link>
      </div>

      {isAdmin && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/30 bg-primary/5 p-6">
          <div>
            <p className="text-sm font-bold text-primary">You&rsquo;re signed in as an admin</p>
            <p className="mt-1 text-sm text-muted-foreground">Manage jobs, opportunities, courses, users, purchases and more from one dashboard.</p>
          </div>
          <Link href="/admin" className="inline-flex min-h-10 flex-shrink-0 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            Open admin dashboard
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Saved" value={loading ? 0 : counts.saved} href="/account/saved" icon={Bookmark} />
        <StatCard label="My library" value={loading ? 0 : counts.learningInProgress} href="/account/learning" icon={Library} />
        <StatCard label="Purchases" value={loading ? 0 : counts.purchases} href="/account/purchases" icon={ReceiptText} />
        <StatCard label="Career interests" value={loading ? 0 : counts.interests} href="/account/interests" icon={Route} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href="/resources" className="rounded-lg border border-border bg-card p-5 transition-[border-color,background-color] duration-150 ease-out hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Library className="text-primary" size={20} aria-hidden="true" />
          <h2 className="mt-3 text-base font-bold text-foreground">Build your library</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Read books, guides, templates, and saved resources for life, career, business, and learning.</p>
        </Link>
        <Link href="/services" className="rounded-lg border border-border bg-card p-5 transition-[border-color,background-color] duration-150 ease-out hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <BriefcaseBusiness className="text-primary" size={20} aria-hidden="true" />
          <h2 className="mt-3 text-base font-bold text-foreground">For your business</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Use diagnostics, SOPs, playbooks, dashboards, and tools to run a stronger business.</p>
        </Link>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Looking to hire or grow your business? <Link href="/services" className="font-semibold text-primary hover:underline">Visit For Businesses</Link>
      </p>
    </div>
  );
}
