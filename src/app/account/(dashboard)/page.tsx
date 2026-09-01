"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, BriefcaseBusiness, FileText, Library, ReceiptText, Route, Settings, Sparkles, type LucideIcon } from "lucide-react";
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
    <Link href={href} className="rounded-lg border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon size={18} aria-hidden="true" />
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
      <p className="mt-4 text-sm font-semibold text-foreground">{label}</p>
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
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">
              {initials(profile?.full_name || null, email)}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">My Account</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
              </h1>
              {profile?.headline && <p className="mt-2 text-sm font-semibold text-foreground">{profile.headline}</p>}
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{email}{memberSince ? `, member since ${memberSince}` : ""}</p>
            </div>
          </div>
          <Link href="/account/settings" className="inline-flex min-h-10 flex-shrink-0 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors duration-150 ease-out hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Settings size={16} aria-hidden="true" />
            Edit profile
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Link href="/account/learning" className="rounded-lg bg-muted p-4 transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Library size={18} className="text-primary" aria-hidden="true" />
            <p className="mt-2 text-sm font-bold text-foreground">Continue learning</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Courses, videos and saved resources.</p>
          </Link>
          <Link href="/tools/cv-builder" className="rounded-lg bg-muted p-4 transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <FileText size={18} className="text-primary" aria-hidden="true" />
            <p className="mt-2 text-sm font-bold text-foreground">Build your CV</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Create or edit your career documents.</p>
          </Link>
          <Link href="/career-paths" className="rounded-lg bg-muted p-4 transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Route size={18} className="text-primary" aria-hidden="true" />
            <p className="mt-2 text-sm font-bold text-foreground">Explore career paths</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Connect skills to jobs and opportunities.</p>
          </Link>
        </div>
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

      <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <Sparkles size={20} className="mt-0.5 flex-shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-base font-bold text-foreground">Keep your profile useful</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Save resources, track learning, keep CV drafts, and return to the career paths you are exploring.</p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Looking to hire or grow your business? <Link href="/services" className="font-semibold text-primary hover:underline">Visit For Businesses</Link>
      </p>
    </div>
  );
}
