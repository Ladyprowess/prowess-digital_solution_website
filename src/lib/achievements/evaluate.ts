import { supabaseAdmin } from "@/lib/supabase/admin";

export type ActivityType = "lesson_completed" | "quiz_passed" | "course_completed" | "certificate_earned";
export type Badge = { id: string; key: string; title: string; description: string | null; icon_key: string };
export type AwardResult = { pointsAwarded: number; newBadges: Badge[] };

function todayUTCString(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD", UTC calendar day
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86400000);
}

// The one place "did this genuinely just happen, and what does it earn"
// gets decided. Callers must only ever pass a sourceId already
// independently re-verified against a durable source-of-truth table (see
// the evaluate-completion route's lesson_completed re-check) - this
// function trusts its caller completely, it is not itself a security
// boundary.
//
// A duplicate (user, activity_type, source_id) is NOT treated as "stop
// processing" - it means "this event was already recorded; reconcile
// derived state anyway." If a prior call's ledger insert succeeded but
// crashed before finishing the stats/badge steps, the next call for the
// same event repairs that missed work instead of losing it forever, via
// the isNewEvent handling below.
export async function awardPoints(userId: string, activityType: ActivityType, sourceId: string): Promise<AwardResult> {
  const supabase = supabaseAdmin();

  const { data: rule, error: ruleErr } = await supabase.from("achievement_point_rules").select("points").eq("activity_type", activityType).maybeSingle();
  if (ruleErr) throw new Error(`Could not read point rule for "${activityType}": ${ruleErr.message}`);
  // A missing row is schema drift (an operational error to surface
  // loudly), not the same thing as an admin deliberately configuring 0
  // points - silently no-op-ing here would permanently lose the event
  // with nobody ever finding out.
  if (!rule) throw new Error(`No achievement_point_rules row configured for activity_type "${activityType}"`);

  const { error: insertErr } = await supabase
    .from("point_events")
    .insert({ user_id: userId, activity_type: activityType, source_id: sourceId, points: rule.points });

  let isNewEvent = true;
  // Whether this event should touch today's streak. A brand-new event
  // always does. A duplicate (23505) needs to be told apart into two very
  // different cases that both look identical from here: (a) a prior call
  // for the SAME event crashed after inserting the ledger row but before
  // finishing the streak step - that's still genuinely today's activity,
  // and must still bump the streak, or the crash would permanently lose
  // it; (b) this event was recorded on some EARLIER day and is only being
  // re-confirmed now (e.g. a course completed weeks ago, self-healing via
  // the Phase 2 catch-up call that fires on every course page load) -
  // that must NOT bump today's streak, or simply reopening an
  // already-finished course's page would silently extend a learner's
  // streak for free with zero new learning activity.
  let countsTowardStreakToday = true;
  if (insertErr) {
    if (insertErr.code === "23505") {
      isNewEvent = false;
      const { data: existingEvent } = await supabase
        .from("point_events")
        .select("created_at")
        .eq("user_id", userId)
        .eq("activity_type", activityType)
        .eq("source_id", sourceId)
        .maybeSingle();
      countsTowardStreakToday = existingEvent?.created_at?.slice(0, 10) === todayUTCString();
    } else {
      throw new Error(`Could not record point event: ${insertErr.message}`);
    }
  }

  await reconcileTotalPoints(userId);
  if (countsTowardStreakToday) await bumpStreak(userId);
  const newBadges = await checkAndAwardBadges(userId);

  // pointsAwarded is 0 on a replay so a UI never shows "+10 points" twice
  // for the same underlying event.
  return { pointsAwarded: isNewEvent ? rule.points : 0, newBadges };
}

async function reconcileTotalPoints(userId: string) {
  const supabase = supabaseAdmin();
  const { error } = await supabase.rpc("reconcile_learner_total_points", { p_user_id: userId });
  if (error) throw new Error(`Could not reconcile total points: ${error.message}`);
}

async function bumpStreak(userId: string) {
  const supabase = supabaseAdmin();
  const today = todayUTCString();
  const nowIso = new Date().toISOString();

  // reconcileTotalPoints's upsert (called just before this, in
  // awardPoints) guarantees this row already exists.
  const { data: existing, error: fetchErr } = await supabase
    .from("learner_stats")
    .select("current_streak, longest_streak, last_activity_date")
    .eq("user_id", userId)
    .single();
  if (fetchErr || !existing) throw new Error(`Could not read learner_stats for streak update: ${fetchErr?.message ?? "row missing"}`);

  if (existing.last_activity_date === today) return; // already touched today - nothing to do

  const gap = existing.last_activity_date ? daysBetween(today, existing.last_activity_date) : null;
  const nextStreak = gap === 1 ? existing.current_streak + 1 : 1;
  const nextLongest = Math.max(existing.longest_streak, nextStreak);

  const base = supabase
    .from("learner_stats")
    .update({ current_streak: nextStreak, longest_streak: nextLongest, last_activity_date: today, updated_at: nowIso })
    .eq("user_id", userId);
  // .is(), not .eq(), for a null previous date - eq(col, null) compiles to
  // "col = null", which never matches any row in Postgres and would
  // silently no-op a learner's very first-ever streak update forever.
  await (existing.last_activity_date === null ? base.is("last_activity_date", null) : base.eq("last_activity_date", existing.last_activity_date));
  // If a concurrent call already won this day's transition, this affects
  // 0 rows and safely no-ops - total_points was already independently
  // reconciled above via the atomic RPC regardless of which call wins
  // here, so there is no "loses the newer total" failure mode; the two
  // concerns are fully decoupled.
}

async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const supabase = supabaseAdmin();
  const [{ data: stats }, { data: completions }, { data: passedAttempts }, { data: allBadges }, { data: owned }] = await Promise.all([
    supabase.from("learner_stats").select("total_points, current_streak, last_activity_date").eq("user_id", userId).maybeSingle(),
    // courses_completed reads course_completions directly (Phase 2's own
    // durable fact), not point_events - stays correct even if an admin
    // sets course_completed points to 0, or a point event somehow failed
    // to record.
    supabase.from("course_completions").select("id").eq("user_id", userId),
    // Same principle for quizzes_passed: read quiz_attempts (Phase 1's own
    // durable "did this learner pass this quiz" source), not point_events -
    // badge correctness must never depend on the achievement system
    // itself having successfully recorded an event.
    supabase.from("quiz_attempts").select("quiz_id").eq("user_id", userId).eq("passed", true),
    supabase.from("badges").select("*").eq("status", "published"),
    supabase.from("user_badges").select("badge_id").eq("user_id", userId),
  ]);

  const ownedIds = new Set((owned || []).map((r) => r.badge_id));
  // Never trust the stored current_streak without checking it's still
  // "alive" - the column only gets touched on an award event, so a
  // learner who went quiet for a week would otherwise still read their
  // old streak number. bumpStreak just ran above in this same call, so
  // last_activity_date is always today by this point (either this call
  // set it, or a concurrent competing call did).
  const streakAlive = stats?.last_activity_date === todayUTCString();
  const distinctQuizzesPassed = new Set((passedAttempts || []).map((r) => r.quiz_id)).size;

  const metrics: Record<string, number> = {
    total_points: stats?.total_points ?? 0,
    streak_days: streakAlive ? stats?.current_streak ?? 0 : 0,
    courses_completed: (completions || []).length,
    quizzes_passed: distinctQuizzesPassed,
  };

  const eligible = (allBadges || []).filter((b) => !ownedIds.has(b.id) && metrics[b.criteria_type] >= b.threshold);
  const newBadges: Badge[] = [];
  for (const badge of eligible) {
    const { error } = await supabase.from("user_badges").insert({ user_id: userId, badge_id: badge.id });
    if (!error) newBadges.push(badge);
    else if (error.code !== "23505") throw new Error(`Could not award badge: ${error.message}`);
  }
  return newBadges;
}

// Re-checks badge eligibility with no new point event - the only way a
// badge published AFTER a learner already qualified for it (e.g. they've
// had 1,000 points for weeks before an admin adds a "500 points" badge)
// ever reaches them, since checkAndAwardBadges above only otherwise runs
// as a side effect of a fresh award. Called once whenever a learner opens
// their Achievements page.
export async function reconcileBadges(userId: string): Promise<Badge[]> {
  return checkAndAwardBadges(userId);
}
