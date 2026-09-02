"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type TargetType = "course_review" | "discussion_post" | "discussion_reply";

type Report = {
  id: string;
  reporter_user_id: string;
  target_type: TargetType;
  target_id: string;
  reason: string | null;
  created_at: string;
};

type TargetContent = { author_name: string; body: string | null; rating: number | null; status: string } | null;

const TARGET_TABLE: Record<TargetType, string> = {
  course_review: "course_reviews",
  discussion_post: "discussion_posts",
  discussion_reply: "discussion_replies",
};

const TARGET_LABEL: Record<TargetType, string> = {
  course_review: "Review",
  discussion_post: "Discussion post",
  discussion_reply: "Reply",
};

export default function AdminCommunityPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [targets, setTargets] = useState<Record<string, TargetContent>>({});
  const [reporterNames, setReporterNames] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: pending } = await supabase
      .from("content_reports")
      .select("id, reporter_user_id, target_type, target_id, reason, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    const list = (pending || []) as Report[];
    setReports(list);

    // Batched by target_type - one query per content table, never one
    // query per report - target_id has no FK so PostgREST can't join this
    // for us automatically.
    const byType: Record<TargetType, string[]> = { course_review: [], discussion_post: [], discussion_reply: [] };
    for (const r of list) byType[r.target_type].push(r.target_id);

    const nextTargets: Record<string, TargetContent> = {};
    await Promise.all(
      (Object.keys(byType) as TargetType[]).map(async (type) => {
        const ids = byType[type];
        if (ids.length === 0) return;
        const table = TARGET_TABLE[type];
        const select = type === "course_review" ? "id, author_name, body, rating, status" : "id, author_name, body, status";
        const { data } = await supabase.from(table).select(select).in("id", ids) as unknown as {
          data: Array<{ id: string; author_name: string; body: string | null; rating?: number; status: string }> | null;
        };
        for (const row of data || []) {
          nextTargets[`${type}:${row.id}`] = { author_name: row.author_name, body: row.body, rating: row.rating ?? null, status: row.status };
        }
      })
    );
    setTargets(nextTargets);

    const reporterIds = Array.from(new Set(list.map((r) => r.reporter_user_id)));
    if (reporterIds.length > 0) {
      const { data: profiles } = await supabase.from("member_profiles").select("id, full_name").in("id", reporterIds);
      const nextNames: Record<string, string> = {};
      for (const p of profiles || []) nextNames[p.id] = p.full_name || "Community member";
      setReporterNames(nextNames);
    }

    setLoading(false);
  }, []);

  useEffect(() => { (async () => { await load(); })(); }, [load]);

  async function resolve(reportId: string, action: "remove" | "dismiss") {
    setBusy(reportId);
    setError("");
    const { error: rpcErr } = await supabase.rpc("resolve_content_report", {
      p_report_id: reportId,
      p_action: action,
      p_note: notes[reportId] || null,
    });
    setBusy(null);
    if (rpcErr) { setError(rpcErr.message); return; }
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Community moderation</h1>
      <p className="mt-1 text-sm text-muted-foreground">Reports on course reviews, discussion posts and replies.</p>

      {error && <p className="mt-4 text-sm font-semibold text-destructive">{error}</p>}

      <div className="mt-8 space-y-4">
        {!loading && reports.length === 0 && (
          <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">No pending reports.</p>
        )}
        {reports.map((r) => {
          const content = targets[`${r.target_type}:${r.target_id}`];
          return (
            <div key={r.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">{TARGET_LABEL[r.target_type]}</p>
                <p className="text-xs text-muted-foreground">Reported by {reporterNames[r.reporter_user_id] || "…"} on {new Date(r.created_at).toLocaleDateString()}</p>
              </div>

              {content ? (
                <div className="mt-3 rounded-lg bg-muted p-3">
                  <p className="text-sm font-semibold text-foreground">
                    {content.author_name}
                    {content.rating != null && <span className="ml-2 text-amber-500">{"★".repeat(content.rating)}</span>}
                  </p>
                  {content.body && <p className="mt-1 text-sm text-muted-foreground">{content.body}</p>}
                  {content.status !== "visible" && <p className="mt-1 text-xs font-semibold text-muted-foreground">Current status: {content.status}</p>}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">This content is no longer available.</p>
              )}

              {r.reason && <p className="mt-3 text-sm text-foreground"><span className="font-semibold">Reason: </span>{r.reason}</p>}

              <input
                value={notes[r.id] || ""}
                onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                placeholder="Optional resolution note"
                className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => resolve(r.id, "remove")}
                  disabled={busy === r.id}
                  className="inline-flex min-h-9 items-center rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-60"
                >
                  Remove content
                </button>
                <button
                  type="button"
                  onClick={() => resolve(r.id, "dismiss")}
                  disabled={busy === r.id}
                  className="inline-flex min-h-9 items-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
                >
                  Dismiss
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
