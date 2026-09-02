"use client";

import { useEffect, useState } from "react";
import { Flame, Medal, Trophy } from "lucide-react";
import { Card, EmptyState } from "@/components/account/AccountUI";
import { BadgeIcon } from "@/lib/achievements/badgeIcons";
import { supabase } from "@/lib/supabase";

type Stats = { total_points: number; current_streak: number; last_activity_date: string | null };
type Badge = { id: string; key: string; title: string; description: string | null; icon_key: string; criteria_type: string; threshold: number };
type LeaderboardRow = { rank: number; userId: string; name: string; totalPoints: number };

function todayUTCString(): string {
  return new Date().toISOString().slice(0, 10);
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border p-4">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export default function AchievementsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ top: LeaderboardRow[]; self: { rank: number; totalPoints: number } | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      // Re-check badge eligibility on every visit - the only way a badge
      // published after this learner already qualified for it reaches
      // them without any new activity.
      await fetch("/api/achievements/reconcile", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } }).catch(() => null);

      const [{ data: statsRow }, { data: earned }, { data: badgeRows }, leaderboardRes] = await Promise.all([
        supabase.from("learner_stats").select("total_points, current_streak, last_activity_date").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("user_badges").select("badge_id").eq("user_id", session.user.id),
        supabase.from("badges").select("id, key, title, description, icon_key, criteria_type, threshold"),
        fetch("/api/achievements/leaderboard", { headers: { Authorization: `Bearer ${session.access_token}` } }).then((r) => r.json()).catch(() => null),
      ]);

      setStats(statsRow || null);
      setEarnedIds(new Set((earned || []).map((r) => r.badge_id)));
      setAllBadges((badgeRows || []).sort((a, b) => a.threshold - b.threshold));
      if (leaderboardRes?.ok) setLeaderboard({ top: leaderboardRes.top, self: leaderboardRes.self });
      setLoading(false);
    })();
  }, []);

  // Never trust the stored current_streak without checking it's still
  // "alive" - it only gets touched on an award event, so a learner who
  // went quiet for a few days would otherwise still see their old number.
  const streakAlive = stats?.last_activity_date === todayUTCString();
  const displayStreak = streakAlive ? stats?.current_streak ?? 0 : 0;

  return (
    <div>
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
        <Trophy size={14} aria-hidden="true" />
        Progress
      </div>
      <h1 className="mt-3 text-2xl font-bold text-foreground">Achievements</h1>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
        Track your points, streaks and badges from completed lessons, quizzes and courses.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <Medal size={20} className="mb-3 text-primary" aria-hidden="true" />
          <p className="text-2xl font-bold text-foreground">{loading ? "..." : stats?.total_points ?? 0}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total points</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <Flame size={20} className="mb-3 text-primary" aria-hidden="true" />
          <p className="text-2xl font-bold text-foreground">{loading ? "..." : displayStreak}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Day streak</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <Trophy size={20} className="mb-3 text-primary" aria-hidden="true" />
          <p className="text-2xl font-bold text-foreground">{loading ? "..." : earnedIds.size}</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Badges earned</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Badges">
          {loading ? (
            <LoadingRows />
          ) : allBadges.length === 0 ? (
            <EmptyState text="No badges have been set up yet." ctaLabel="Browse courses" ctaHref="/learn" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {allBadges.map((b) => {
                const owned = earnedIds.has(b.id);
                return (
                  <div key={b.id} className={`rounded-lg border p-4 ${owned ? "border-primary/30 bg-primary/5" : "border-border bg-background"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${owned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <BadgeIcon iconKey={b.icon_key} />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{b.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${owned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {owned ? "Earned" : "Locked"}
                          </span>
                        </div>
                        {b.description && <p className="mt-0.5 text-xs text-muted-foreground">{b.description}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Leaderboard">
          {loading ? (
            <LoadingRows />
          ) : !leaderboard || leaderboard.top.length === 0 ? (
            <EmptyState text="No one has earned points yet - be the first!" ctaLabel="Browse courses" ctaHref="/learn" />
          ) : (
            <>
              <ul className="space-y-2">
                {leaderboard.top.map((row) => (
                  <li key={row.userId} className="flex items-center justify-between rounded-lg border border-border px-4 py-2 text-sm">
                    <span className="font-medium text-foreground">#{row.rank} {row.name}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{row.totalPoints} pts</span>
                  </li>
                ))}
              </ul>
              {leaderboard.self && leaderboard.self.rank > leaderboard.top.length && (
                <p className="mt-3 text-xs text-muted-foreground">
                  You&rsquo;re #{leaderboard.self.rank} with {leaderboard.self.totalPoints} points.
                </p>
              )}
              <p className="mt-4 text-xs text-muted-foreground">Other learners can see your name on this leaderboard.</p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
