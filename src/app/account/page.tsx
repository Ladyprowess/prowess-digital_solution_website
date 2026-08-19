"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Container from "@/components/Container";
import { useMemberSession } from "@/lib/useMemberSession";
import { supabase } from "@/lib/supabase";

type SavedItem = { id: string; item_type: string; item_id: string; title?: string };
type Purchase = { id: string; item_type: string; item_id: string; amount: number; currency: string; title: string; slug: string | null; created_at: string };
type LearningRow = { id: string; course_id: string; status: string; progress_percent: number; title?: string };
type InterestRow = { career_path_id: string; title?: string };

const ITEM_TABLE: Record<string, string> = {
  job: "jobs",
  opportunity: "opportunities",
  resource: "resources",
  course: "courses",
  career_path: "career_paths",
};

async function attachTitles<T extends { item_type: string; item_id: string }>(rows: T[]): Promise<(T & { title?: string })[]> {
  const byType: Record<string, string[]> = {};
  for (const r of rows) (byType[r.item_type] ||= []).push(r.item_id);

  const titleMap: Record<string, string> = {};
  await Promise.all(
    Object.entries(byType).map(async ([type, ids]) => {
      const table = ITEM_TABLE[type];
      if (!table) return;
      const { data } = await supabase.from(table).select("id, title").in("id", ids);
      (data || []).forEach((row: { id: string; title: string }) => { titleMap[row.id] = row.title; });
    })
  );

  return rows.map((r) => ({ ...r, title: titleMap[r.item_id] || "Untitled" }));
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function AccountDashboardPage() {
  const { status, profile, email, reload, signOut } = useMemberSession();

  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

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
        const { data: course } = await supabase.from("courses").select("title").eq("id", row.course_id).maybeSingle();
        return { ...row, title: course?.title || "Untitled course" };
      })
    );
    setLearning(learningWithTitles);

    const interestsWithTitles = await Promise.all(
      (interestRows.data || []).map(async (row) => {
        const { data: path } = await supabase.from("career_paths").select("title").eq("id", row.career_path_id).maybeSingle();
        return { ...row, title: path?.title || "Untitled" };
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

  return (
    <div className="min-h-screen bg-muted py-16">
      <Container>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">{email}</p>
          </div>
          <button onClick={signOut} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">
            Sign out
          </button>
        </div>

        {isAdmin && (
          <div className="mb-6 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6">
            <p className="text-sm font-bold text-primary">You&rsquo;re signed in as an admin</p>
            <p className="mt-1 text-sm text-muted-foreground">This is your regular account page. Use these links to manage site content.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: "Jobs", href: "/admin/work" },
                { label: "Opportunities", href: "/admin/opportunities" },
                { label: "Career Paths", href: "/admin/career-paths" },
                { label: "Learn", href: "/admin/learn" },
                { label: "Resources", href: "/admin/resources" },
                { label: "Skills", href: "/admin/skills" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="rounded-xl border border-primary/30 bg-card px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="My Profile">
            <div className="grid gap-3">
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
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >
                {savingProfile ? "Saving..." : "Save profile"}
              </button>
            </div>
          </Section>

          <Section title="My Career Interests">
            {loadingData ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : interests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No career interests saved yet.</p>
            ) : (
              <ul className="space-y-2">
                {interests.map((i) => (
                  <li key={i.career_path_id} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-2 text-sm">
                    <span className="text-foreground">{i.title}</span>
                    <button onClick={() => removeInterest(i.career_path_id)} className="text-xs font-semibold text-red-600 hover:underline">Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Saved">
            {loadingData ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : saved.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
            ) : (
              <ul className="space-y-2">
                {saved.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-2 text-sm">
                    <span className="text-foreground">{s.title} <span className="text-muted-foreground">({s.item_type})</span></span>
                    <button onClick={() => removeSaved(s.id)} className="text-xs font-semibold text-red-600 hover:underline">Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Continue Learning">
            {loadingData ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : learning.length === 0 ? (
              <p className="text-sm text-muted-foreground">You haven&rsquo;t started a course yet.</p>
            ) : (
              <ul className="space-y-2">
                {learning.map((l) => (
                  <li key={l.id} className="rounded-xl border border-border/60 px-4 py-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">{l.title}</span>
                      <span className="text-xs text-muted-foreground">{l.status.replace("_", " ")}</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${l.progress_percent}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="My Purchases">
            {loadingData ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : purchases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No purchases yet.</p>
            ) : (
              <ul className="space-y-2">
                {purchases.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-2 text-sm">
                    <span className="text-foreground">{p.title}</span>
                    <span className="text-xs text-muted-foreground">{p.currency} {p.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Looking to hire or grow your business? <Link href="/services" className="font-semibold text-primary hover:underline">Visit For Businesses</Link>
        </p>
      </Container>
    </div>
  );
}
