"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";
import { BADGE_ICONS, BadgeIcon } from "@/lib/achievements/badgeIcons";

type ActivityType = "lesson_completed" | "quiz_passed" | "course_completed" | "certificate_earned";
const ACTIVITY_LABELS: Record<ActivityType, string> = {
  lesson_completed: "Lesson completed",
  quiz_passed: "Quiz passed",
  course_completed: "Course completed",
  certificate_earned: "Certificate earned",
};
const ACTIVITY_ORDER: ActivityType[] = ["lesson_completed", "quiz_passed", "course_completed", "certificate_earned"];

type CriteriaType = "total_points" | "streak_days" | "courses_completed" | "quizzes_passed";
const CRITERIA_LABELS: Record<CriteriaType, string> = {
  total_points: "Total points reached",
  streak_days: "Streak (days) reached",
  courses_completed: "Courses completed",
  quizzes_passed: "Quizzes passed",
};

type Badge = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  icon_key: string;
  criteria_type: CriteriaType;
  threshold: number;
  status: "draft" | "published" | "archived";
};

const inputCls = "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function PointRulesCard() {
  const [points, setPoints] = useState<Record<ActivityType, string>>({
    lesson_completed: "", quiz_passed: "", course_completed: "", certificate_earned: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("achievement_point_rules").select("activity_type, points");
      const next = { ...points };
      for (const row of data || []) next[row.activity_type as ActivityType] = String(row.points);
      setPoints(next);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount, same shape as CompletionCard's own settings load
  }, []);

  const save = async () => {
    setErr(""); setMsg(""); setSaving(true);
    try {
      for (const activityType of ACTIVITY_ORDER) {
        const value = Number(points[activityType]);
        if (!Number.isFinite(value) || value < 0) throw new Error(`${ACTIVITY_LABELS[activityType]}: enter a whole number, 0 or more.`);
        const { error } = await supabase.from("achievement_point_rules").update({ points: value }).eq("activity_type", activityType);
        if (error) throw new Error(error.message);
      }
      setMsg("Saved.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-base font-bold text-foreground">Point values</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        How many points each activity earns. A change only affects future activity - it never rewrites points already
        recorded for past events, and does not retroactively change the leaderboard.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {ACTIVITY_ORDER.map((activityType) => (
          <Field key={activityType} label={ACTIVITY_LABELS[activityType]}>
            <input
              type="number"
              min={0}
              value={points[activityType]}
              onChange={(e) => setPoints({ ...points, [activityType]: e.target.value })}
              className={inputCls}
            />
          </Field>
        ))}
      </div>
      {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}
      {msg ? <p className="mt-3 text-sm text-primary">{msg}</p> : null}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        Save point values
      </button>
    </div>
  );
}

function BadgesCard() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [iconKey, setIconKey] = useState<string>(Object.keys(BADGE_ICONS)[0]);
  const [criteriaType, setCriteriaType] = useState<CriteriaType>("total_points");
  const [threshold, setThreshold] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("badges").select("*").order("created_at");
    setBadges(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setTitle(""); setDescription(""); setIconKey(Object.keys(BADGE_ICONS)[0]); setCriteriaType("total_points"); setThreshold(""); setStatus("draft");
  };

  function startEdit(badge: Badge) {
    setErr("");
    setEditingId(badge.id);
    setTitle(badge.title);
    setDescription(badge.description || "");
    setIconKey(badge.icon_key);
    setCriteriaType(badge.criteria_type);
    setThreshold(String(badge.threshold));
    setStatus(badge.status);
  }

  async function getUniqueKey(base: string): Promise<string> {
    let candidate = base || "badge";
    let suffix = 1;
    while (true) {
      const { data } = await supabase.from("badges").select("id").eq("key", candidate).maybeSingle();
      if (!data) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }

  const saveBadge = async () => {
    setErr("");
    if (!title.trim()) return setErr("Title is required.");
    const thresholdNum = Number(threshold);
    if (!Number.isFinite(thresholdNum) || thresholdNum <= 0) return setErr("Threshold must be a whole number greater than 0.");

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      icon_key: iconKey,
      criteria_type: criteriaType,
      threshold: thresholdNum,
      status,
    };

    // key is a stable internal identifier, set once at creation and never
    // regenerated on edit - it's not a public URL slug, so there's no
    // "can change while draft" nuance to it like course/career-path slugs.
    const { error } = editingId
      ? await supabase.from("badges").update(payload).eq("id", editingId)
      : await supabase.from("badges").insert({ ...payload, key: await getUniqueKey(slugify(title)) });

    if (error) return setErr(error.message);
    resetForm();
    load();
  };

  if (loading) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-base font-bold text-foreground">Badges</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Learners earn a badge automatically once they cross its threshold. There&rsquo;s no delete action - once a badge has
        been earned it&rsquo;s a credential, same as a certificate. Retire one by setting it to Archived instead.
      </p>

      {badges.length > 0 && (
        <ul className="mt-4 space-y-2">
          {badges.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-2 text-sm">
              <span className="flex items-center gap-2 text-foreground">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <BadgeIcon iconKey={b.icon_key} size={16} />
                </span>
                <span>
                  {b.title}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {CRITERIA_LABELS[b.criteria_type]} &ge; {b.threshold} &middot; {b.status}
                  </span>
                </span>
              </span>
              <button onClick={() => startEdit(b)} className="flex-shrink-0 text-xs font-semibold text-primary hover:underline">Edit</button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid gap-3 rounded-xl bg-muted p-4">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground">{editingId ? "EDIT BADGE" : "ADD BADGE"}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. First Course Complete" />
          </Field>
          <Field label="Icon">
            <select value={iconKey} onChange={(e) => setIconKey(e.target.value)} className={inputCls}>
              {Object.keys(BADGE_ICONS).map((key) => <option key={key} value={key}>{key}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Description">
          <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="Shown to learners on the Achievements page" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Criteria">
            <select value={criteriaType} onChange={(e) => setCriteriaType(e.target.value as CriteriaType)} className={inputCls}>
              {Object.entries(CRITERIA_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </Field>
          <Field label="Threshold">
            <input type="number" min={1} value={threshold} onChange={(e) => setThreshold(e.target.value)} className={inputCls} placeholder="e.g. 100" />
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={inputCls}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </div>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <div className="flex gap-2">
          <button type="button" onClick={saveBadge} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {editingId ? "Update badge" : "Add badge"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="flex-shrink-0 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminAchievementsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Achievements</h1>
      <p className="mt-1 text-sm text-muted-foreground">Point values and badges for the Learn achievement system.</p>
      <div className="mt-8 grid gap-6">
        <PointRulesCard />
        <BadgesCard />
      </div>
    </div>
  );
}
