"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/formatMoney";
import { AdminCurrencyToggle, suggestAdminCurrency, useAdminCurrency } from "@/components/admin/AdminCurrency";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";

type CountRow = { count: number | null };

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

// Last N calendar months as "YYYY-MM" keys, oldest first, so a month with
// zero activity still shows as a real zero point on the chart instead of
// silently disappearing.
function lastMonths(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function StatCard({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const inner = (
    <div className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    jobsPublished: 0, jobsDraft: 0,
    opportunitiesPublished: 0, opportunitiesDraft: 0,
    careerPathsPublished: 0, careerPathsDraft: 0,
    coursesPublished: 0, coursesDraft: 0,
    resourcesPublished: 0, resourcesDraft: 0,
    events: 0, users: 0,
  });
  // Per currency throughout. USD and NGN cannot be added into one number,
  // and they cannot share one chart axis either - $10 next to N15,000 would
  // flatten the dollar line to nothing. Each currency gets its own total
  // and its own series, and the chart shows one at a time.
  const [revenueSeriesByCurrency, setRevenueSeriesByCurrency] = useState<Record<string, { month: string; revenue: number }[]>>({});
  const currency = useAdminCurrency();
  const [signupSeries, setSignupSeries] = useState<{ month: string; signups: number }[]>([]);
  const [contentBreakdown, setContentBreakdown] = useState<{ name: string; published: number; draft: number }[]>([]);
  const [revenueByCurrency, setRevenueByCurrency] = useState<Record<string, number>>({});
  const [totalPurchases, setTotalPurchases] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const countBy = (table: string, status: string) =>
        supabase.from(table).select("id", { count: "exact", head: true }).eq("status", status);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
      const sixMonthsAgoIso = sixMonthsAgo.toISOString();

      const [
        jobsPub, jobsDraft, oppPub, oppDraft, cpPub, cpDraft, coursePub, courseDraft, resPub, resDraft,
        eventsCount, usersCount, paidAmounts, recentPurchases, recentSignups,
      ] = await Promise.all([
        countBy("jobs", "published"), countBy("jobs", "draft"),
        countBy("opportunities", "published"), countBy("opportunities", "draft"),
        countBy("career_paths", "published"), countBy("career_paths", "draft"),
        countBy("courses", "published"), countBy("courses", "draft"),
        countBy("resources", "published"), countBy("resources", "draft"),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("member_profiles").select("id", { count: "exact", head: true }),
        // All-time totals for the stat cards: only the amount column, kept
        // light regardless of row count.
        supabase.from("purchases").select("amount, currency").eq("payment_status", "paid"),
        // The chart only needs the last 6 months, not the platform's whole
        // purchase history - same fix as the /resources and /videos
        // unbounded-fetch issue found earlier.
        supabase.from("purchases").select("amount, currency, created_at").eq("payment_status", "paid").gte("created_at", sixMonthsAgoIso),
        supabase.from("member_profiles").select("created_at").gte("created_at", sixMonthsAgoIso),
      ]);

      const c = (r: { count: number | null }) => r.count || 0;
      setStats({
        jobsPublished: c(jobsPub as CountRow), jobsDraft: c(jobsDraft as CountRow),
        opportunitiesPublished: c(oppPub as CountRow), opportunitiesDraft: c(oppDraft as CountRow),
        careerPathsPublished: c(cpPub as CountRow), careerPathsDraft: c(cpDraft as CountRow),
        coursesPublished: c(coursePub as CountRow), coursesDraft: c(courseDraft as CountRow),
        resourcesPublished: c(resPub as CountRow), resourcesDraft: c(resDraft as CountRow),
        events: c(eventsCount as CountRow), users: c(usersCount as CountRow),
      });

      setContentBreakdown([
        { name: "Jobs", published: c(jobsPub as CountRow), draft: c(jobsDraft as CountRow) },
        { name: "Opportunities", published: c(oppPub as CountRow), draft: c(oppDraft as CountRow) },
        { name: "Career Paths", published: c(cpPub as CountRow), draft: c(cpDraft as CountRow) },
        { name: "Courses", published: c(coursePub as CountRow), draft: c(courseDraft as CountRow) },
        { name: "Resources", published: c(resPub as CountRow), draft: c(resDraft as CountRow) },
      ]);

      const paidAll = (paidAmounts.data as { amount: number; currency: string | null }[]) || [];
      const totals: Record<string, number> = {};
      for (const p of paidAll) {
        // Rows from before the dual-currency rollout carry no currency;
        // those were naira, so that is what an empty value means.
        const code = (p.currency || "NGN").toUpperCase();
        totals[code] = (totals[code] || 0) + Number(p.amount || 0);
      }
      setRevenueByCurrency(totals);
      setTotalPurchases(paidAll.length);

      const months = lastMonths(6);
      const monthlyByCurrency: Record<string, Map<string, number>> = {};
      for (const p of (recentPurchases.data as { amount: number; currency: string | null; created_at: string }[]) || []) {
        const key = monthKey(p.created_at);
        const code = (p.currency || "NGN").toUpperCase();
        if (!monthlyByCurrency[code]) monthlyByCurrency[code] = new Map(months.map((m) => [m, 0]));
        const bucket = monthlyByCurrency[code];
        if (bucket.has(key)) bucket.set(key, (bucket.get(key) || 0) + Number(p.amount || 0));
      }
      const series: Record<string, { month: string; revenue: number }[]> = {};
      for (const [code, bucket] of Object.entries(monthlyByCurrency)) {
        series[code] = months.map((m) => ({ month: monthLabel(m), revenue: bucket.get(m) || 0 }));
      }
      setRevenueSeriesByCurrency(series);
      // Open on whichever currency has actually taken the most money, so a
      // first visit is not staring at a confident zero. Only applies until
      // somebody uses the toggle - after that their choice stands.
      const busiest = Object.entries(totals).sort(([, a], [, b]) => b - a)[0]?.[0];
      if (busiest === "USD" || busiest === "NGN") suggestAdminCurrency(busiest);

      const signupsByMonth = new Map(months.map((m) => [m, 0]));
      for (const m of (recentSignups.data as { created_at: string }[]) || []) {
        const key = monthKey(m.created_at);
        if (signupsByMonth.has(key)) signupsByMonth.set(key, (signupsByMonth.get(key) || 0) + 1);
      }
      setSignupSeries(months.map((m) => ({ month: monthLabel(m), signups: signupsByMonth.get(m) || 0 })));

      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  // Everything on this page reports the currency the toggle is set to. The
  // two are never added together - they are separate books.
  const revenueLabel = formatMoney(revenueByCurrency[currency] || 0, currency);
  const activeSeries = revenueSeriesByCurrency[currency] || [];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">A snapshot of Prowess Digital Solutions right now.</p>
        </div>
        <AdminCurrencyToggle />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label={`Total Revenue (${currency})`} value={revenueLabel} href="/admin/purchases" />
        <StatCard label="Paid Purchases" value={totalPurchases} href="/admin/purchases" />
        <StatCard label="Users" value={stats.users} href="/admin/users" />
        <StatCard label="Events" value={stats.events} href="/admin/events" />
        <StatCard label="Jobs" value={`${stats.jobsPublished} live / ${stats.jobsDraft} draft`} href="/admin/work" />
        <StatCard label="Opportunities" value={`${stats.opportunitiesPublished} live / ${stats.opportunitiesDraft} draft`} href="/admin/opportunities" />
        <StatCard label="Career Paths" value={`${stats.careerPathsPublished} live / ${stats.careerPathsDraft} draft`} href="/admin/career-paths" />
        <StatCard label="Courses" value={`${stats.coursesPublished} live / ${stats.coursesDraft} draft`} href="/admin/learn" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground">Revenue ({currency}) - last 6 months</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeSeries}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} width={56} tickFormatter={(v: number) => formatMoney(v, currency)} />
                <Tooltip formatter={(v: number) => [formatMoney(v, currency), `Revenue (${currency})`]} />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fill="url(#revFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold text-foreground">New signups - last 6 months</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={signupSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} width={30} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="signups" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Content: published vs draft</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contentBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} width={30} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="published" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="draft" fill="var(--muted-foreground)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
