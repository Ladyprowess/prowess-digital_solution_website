import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { resolveQuizAccess } from "@/lib/quizzes/access";

export const runtime = "nodejs";

// Resume-or-create, never blind-create: calling this with an attempt
// already open (an intentional "resume" click, or an accidental
// double-call/double-tab) must return that same attempt, not a second one.
// quiz_attempts_one_in_progress (a partial unique index) is the real
// guarantee against a concurrent-request race; the check below is the
// user-friendly fast path, not the enforcement.
export async function POST(req: Request, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const { quizId } = await params;
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    const access = await resolveQuizAccess(quizId, { userId: member.id, email: member.email });
    if (!access.ok) {
      return NextResponse.json({ ok: false, error: access.error, premium: access.premium }, { status: access.status });
    }

    const supabase = supabaseAdmin();

    const { data: inProgress } = await supabase
      .from("quiz_attempts")
      .select("id, status, started_at")
      .eq("quiz_id", quizId)
      .eq("user_id", member.id)
      .eq("status", "in_progress")
      .maybeSingle();

    if (inProgress) {
      return NextResponse.json({ ok: true, attempt: inProgress, resumed: true });
    }

    if (!access.quiz.allow_retry) {
      const { data: submitted } = await supabase
        .from("quiz_attempts")
        .select("id")
        .eq("quiz_id", quizId)
        .eq("user_id", member.id)
        .eq("status", "submitted")
        .limit(1)
        .maybeSingle();

      if (submitted) {
        return NextResponse.json({ ok: false, error: "You've already completed this quiz." }, { status: 403 });
      }
    }

    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("id, position")
      .eq("quiz_id", quizId)
      .order("position");

    if (!questions || questions.length === 0) {
      return NextResponse.json({ ok: false, error: "This quiz has no questions yet." }, { status: 400 });
    }

    const { data: created, error: insertErr } = await supabase
      .from("quiz_attempts")
      .insert({ quiz_id: quizId, user_id: member.id })
      .select("id, status, started_at")
      .single();

    if (insertErr) {
      // Unique-violation on quiz_attempts_one_in_progress - a race with
      // another request that started an attempt in between our check above
      // and this insert. Re-fetch and return the now-existing row instead
      // of surfacing a raw 500.
      if (insertErr.code === "23505") {
        const { data: raceWinner } = await supabase
          .from("quiz_attempts")
          .select("id, status, started_at")
          .eq("quiz_id", quizId)
          .eq("user_id", member.id)
          .eq("status", "in_progress")
          .maybeSingle();
        if (raceWinner) {
          return NextResponse.json({ ok: true, attempt: raceWinner, resumed: true });
        }
      }
      return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
    }

    // Snapshot the question set/order at this exact moment - this attempt
    // is graded against this table later, never a live re-query of
    // quiz_questions, so an admin editing/adding/deleting questions
    // mid-attempt can't change what the learner is graded against.
    const snapshot = questions.map((q) => ({ attempt_id: created.id, question_id: q.id, position: q.position }));
    const { error: snapshotErr } = await supabase.from("quiz_attempt_questions").insert(snapshot);
    if (snapshotErr) {
      return NextResponse.json({ ok: false, error: snapshotErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, attempt: created, resumed: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
