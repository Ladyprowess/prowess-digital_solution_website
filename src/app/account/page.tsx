"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Container from "@/components/Container";
import { useMemberSession } from "@/lib/useMemberSession";
import { supabase } from "@/lib/supabase";

type SavedItem = { id: string; item_type: string; item_id: string; title?: string; slug?: string };
type Purchase = { id: string; item_type: string; item_id: string; amount: number; currency: string; title: string; slug: string | null; created_at: string };
type LearningRow = { id: string; course_id: string; status: string; progress_percent: number; title?: string; slug?: string };
type InterestRow = { career_path_id: string; title?: string; slug?: string };

const ITEM_TABLE: Record<string, string> = {
  job: "jobs",
  opportunity: "opportunities",
  resource: "resources",
  course: "courses",
  career_path: "career_paths",
  skill: "skills",
};

const ITEM_LABEL: Record<string, string> = {
  job: "Job",
  opportunity: "Opportunity",
  resource: "Resource",
  course: "Course",
  career_path: "Career Path",
  skill: "Skill",
};

function hrefFor(itemType: string, slug?: string | null): string | null {
  if (!slug) return null;
  switch (itemType) {
    case "job": return `/jobs/${slug}`;
    case "opportunity": return `/opportunities/${slug}`;
    case "resource": return `/resources/${slug}`;
    case "course": return `/learn/${slug}`;
    case "career_path": return `/career-paths/${slug}`;
    case "skill": return `/skills/${slug}`;
    default: return null;
  }
}

async function attachTitles<T extends { item_type: string; item_id: string }>(rows: T[]): Promise<(T & { title?: string; slug?: string })[]> {
  const byType: Record<string, string[]> = {};
  for (const r of rows) (byType[r.item_type] ||= []).push(r.item_id);

  const infoMap: Record<string, { title: string; slug: string }> = {};
  await Promise.all(
    Object.entries(byType).map(async ([type, ids]) => {
      const table = ITEM_TABLE[type];
      if (!table) return;
      // skills has a `name` column, not `title` like every other saveable
      // table - aliased back to `title` in the select so the rest of this
      // function can stay generic across item types.
      const { data } = await supabase.from(table).select(type === "skill" ? "id, title:name, slug" : "id, title, slug").in("id", ids);
      (data || []).forEach((row: { id: string; title: string; slug: string }) => { infoMap[row.id] = { title: row.title, slug: row.slug }; });
    })
  );

  return rows.map((r) => ({ ...r, title: infoMap[r.item_id]?.title || "Untitled", slug: infoMap[r.item_id]?.slug }));
}

function initials(name: string | null, email: string | null): string {
  const source = (name || email || "?").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function EmptyState({ text, ctaLabel, ctaHref }: { text: string; ctaLabel: string; ctaHref: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-5 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link href={ctaHref} className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">{ctaLabel} →</Link>
    </div>
  );
}

export default function AccountDashboardPage() {
  const { status, profile, email, reload, signOut } = useMemberSession();

  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [learning, setLearning] = useState<LearningRow[]>([]);
  const [interests, setInterests] = useState<InterestRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setHeadline(profile.headline || "");
    }
  }, [profile]);

  const loadDashboardData = useCallback(async () => {
    if (status !== "ready") return;
    setLoadingData(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const userId = session?.user?.id;

    const [savedRows, learningRows, interestRows, purchasesRes, staffRow] = await Promise.all([
      supabase.from("saved_items").select("id, item_type, item_id").order("created_at", { ascending: false }),
      supabase.from("learning_progress").select("id, course_id, status, progress_percent").order("updated_at", { ascending: false }),
      supabase.from("user_career_interests").select("career_path_id"),
      token
        ? fetch("/api/account/purchases", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).catch(() => null)
        : Promise.resolve(null),
      // Same account, different table: this checks whether this signed-in
      // person is also Prowess Digital Solutions staff with admin rights
      // (the internal `profiles` table, unrelated to member_profiles above)
      // so we can show a way into the admin tools right here instead of
      // them having to know/type the admin URLs by hand.
      userId
        ? supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setIsAdmin(staffRow?.data?.role === "admin");

    setSaved(await attachTitles((savedRows.data || []) as SavedItem[]));

    const learningWithTitles = await Promise.all(
      (learningRows.data || []).map(async (row) => {
        const { data: course } = await supabase.from("courses").select("title, slug").eq("id", row.course_id).maybeSingle();
        return { ...row, title: course?.title || "Untitled course", slug: course?.slug };
      })
    );
    setLearning(learningWithTitles);

    const interestsWithTitles = await Promise.all(
      (interestRows.data || []).map(async (row) => {
        const { data: path } = await supabase.from("career_paths").select("title, slug").eq("id", row.career_path_id).maybeSingle();
        return { ...row, title: path?.title || "Untitled", slug: path?.slug };
      })
    );
    setInterests(interestsWithTitles);

    setPurchases(purchasesRes?.ok ? purchasesRes.items : []);
    setLoadingData(false);
  }, [status]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  async function saveProfile() {
    if (!profile) return;
    setSavingProfile(true);
    await supabase
      .from("member_profiles")
      .update({ full_name: fullName.trim() || null, headline: headline.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    setSavingProfile(false);
    setEditingProfile(false);
    reload();
  }

  async function removeSaved(id: string) {
    await supabase.from("saved_items").delete().eq("id", id);
    setSaved((prev) => prev.filter((s) => s.id !== id));
  }

  async function removeInterest(careerPathId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;
    await supabase.from("user_career_interests").delete().eq("user_id", userId).eq("career_path_id", careerPathId);
    setInterests((prev) => prev.filter((i) => i.career_path_id !== careerPathId));
  }

  if (status === "loading") {
    return <div className="flex min-h-[50vh] items-center justify-center"><p className="text-sm text-muted-foreground">Loading your dashboard…</p></div>;
  }
  if (status === "signed-out") return null;

  const learningInProgress = learning.filter((l) => l.status !== "completed").length;
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : null;

  return (
    <div className="min-h-screen bg-muted py-12 sm:py-16">
      <Container>
        {/* Hero */}
        <div className="flex flex-wrap items-start justify-between gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
              {initials(profile?.full_name || null, email)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{profile?.full_name || "My Account"}</h1>
              {profile?.headline && <p className="mt-0.5 text-sm text-muted-foreground">{profile.headline}</p>}
              <p className="mt-1 text-sm text-muted-foreground">{email}{memberSince ? ` · Member since ${memberSince}` : ""}</p>
              <button onClick={() => setEditingProfile((v) => !v)} className="mt-2 text-sm font-semibold text-primary hover:underline">
                {editingProfile ? "Cancel" : "Edit profile"}
              </button>
            </div>
          </div>
          <button onClick={signOut} className="flex-shrink-0 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">
            Sign out
          </button>
        </div>

        {editingProfile && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
              />
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Headline, e.g. Aspiring Product Designer"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
              />
            </div>
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="mt-3 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {savingProfile ? "Saving..." : "Save profile"}
            </button>
          </div>
        )}

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
          <StatCard label="Saved" value={saved.length} />
          <StatCard label="Learning in Progress" value={learningInProgress} />
          <StatCard label="Purchases" value={purchases.length} />
          <StatCard label="Career Interests" value={interests.length} />
        </div>

        {/* Content */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card title="Continue Learning" action={<Link href="/learn" className="text-sm font-semibold text-primary hover:underline">Browse →</Link>}>
            {loadingData ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : learning.length === 0 ? (
              <EmptyState text="You haven't started a course yet." ctaLabel="Explore courses" ctaHref="/learn" />
            ) : (
              <ul className="space-y-2">
                {learning.map((l) => {
                  const href = hrefFor("course", l.slug);
                  return (
                    <li key={l.id} className="rounded-xl border border-border/60 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        {href ? (
                          <Link href={href} className="font-medium text-foreground hover:text-primary hover:underline">{l.title}</Link>
                        ) : (
                          <span className="font-medium text-foreground">{l.title}</span>
                        )}
                        <span className="flex-shrink-0 text-xs text-muted-foreground">{l.status.replace("_", " ")}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${l.progress_percent}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="My Purchases">
            {loadingData ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : purchases.length === 0 ? (
              <EmptyState text="No purchases yet." ctaLabel="Browse premium content" ctaHref="/resources" />
            ) : (
              <ul className="space-y-2">
                {purchases.map((p) => {
                  const href = hrefFor(p.item_type, p.slug);
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm">
                      {href ? (
                        <Link href={href} className="font-medium text-foreground hover:text-primary hover:underline">{p.title}</Link>
                      ) : (
                        <span className="font-medium text-foreground">{p.title}</span>
                      )}
                      <span className="flex-shrink-0 text-xs text-muted-foreground">{p.currency} {p.amount.toLocaleString()}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Saved">
            {loadingData ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : saved.length === 0 ? (
              <EmptyState text="Nothing saved yet." ctaLabel="Browse jobs" ctaHref="/jobs" />
            ) : (
              <ul className="space-y-2">
                {saved.map((s) => {
                  const href = hrefFor(s.item_type, s.slug);
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm">
                      <div className="min-w-0">
                        {href ? (
                          <Link href={href} className="font-medium text-foreground hover:text-primary hover:underline">{s.title}</Link>
                        ) : (
                          <span className="font-medium text-foreground">{s.title}</span>
                        )}
                        <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">{ITEM_LABEL[s.item_type] || s.item_type}</span>
                      </div>
                      <button onClick={() => removeSaved(s.id)} className="flex-shrink-0 text-xs font-semibold text-red-600 hover:underline">Remove</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="My Career Interests" action={<Link href="/career-paths" className="text-sm font-semibold text-primary hover:underline">Browse →</Link>}>
            {loadingData ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : interests.length === 0 ? (
              <EmptyState text="No career interests saved yet." ctaLabel="Explore career paths" ctaHref="/career-paths" />
            ) : (
              <ul className="space-y-2">
                {interests.map((i) => {
                  const href = hrefFor("career_path", i.slug);
                  return (
                    <li key={i.career_path_id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm">
                      {href ? (
                        <Link href={href} className="font-medium text-foreground hover:text-primary hover:underline">{i.title}</Link>
                      ) : (
                        <span className="font-medium text-foreground">{i.title}</span>
                      )}
                      <button onClick={() => removeInterest(i.career_path_id)} className="flex-shrink-0 text-xs font-semibold text-red-600 hover:underline">Remove</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Looking to hire or grow your business? <Link href="/services" className="font-semibold text-primary hover:underline">Visit For Businesses</Link>
        </p>
      </Container>
    </div>
  );
}
