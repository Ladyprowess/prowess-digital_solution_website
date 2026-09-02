import { NextResponse } from "next/server";
import { verifyMember } from "@/lib/auth/verifyMember";
import { hasEntitlement } from "@/lib/payments/entitlement";
import { evaluateCourseCompletion } from "@/lib/certificates/evaluate";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { awardPoints, type AwardResult } from "@/lib/achievements/evaluate";

export const runtime = "nodejs";

// Called after CourseContent.tsx's manual "Mark complete" write succeeds,
// and opportunistically on every course-page load (the catch-up path for
// a learner who already satisfied a course's rules before an admin turned
// on issue_certificate_automatically, or before the rules existed at
// all - idempotent, so calling it repeatedly is safe).
export async function POST(req: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params;
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    // Without this, any signed-in member could POST an arbitrary courseId
    // and force an evaluation for a course they never purchased or opened
    // a single lesson in - the evaluator's own ruleset validation prevents
    // a meaningless configuration from ever completing, but doesn't
    // prevent an uninvolved caller from triggering evaluation of a
    // legitimately-configured course they have no relationship to.
    const { entitled, reason } = await hasEntitlement("course", courseId, { userId: member.id, email: member.email });
    if (reason === "not_found") {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }
    if (!entitled) {
      return NextResponse.json({ ok: false, error: "This content is premium. Purchase or sign in to access it.", premium: true }, { status: 403 });
    }

    const result = await evaluateCourseCompletion(courseId, member.id);

    // A client-supplied lessonId must never be trusted directly as the
    // achievement ledger's source_id - without independently re-verifying
    // it, any signed-in member could POST a fabricated UUID in a loop and
    // mint unlimited lesson_completed point events (the ledger's unique
    // constraint doesn't help here, since each fake UUID is a "new"
    // source_id to it).
    const body = await req.json().catch(() => ({}));
    const lessonId = typeof body?.lessonId === "string" ? body.lessonId : null;

    let lessonPoints: AwardResult = { pointsAwarded: 0, newBadges: [] };
    if (lessonId) {
      const supabase = supabaseAdmin();
      // Same two-step fetch evaluate.ts already established for this
      // exact "course_lessons has no course_id of its own" shape - never
      // a single trusted-embed query, and never a trust of the client's
      // claim alone.
      const { data: modules } = await supabase.from("course_modules").select("id").eq("course_id", courseId);
      const moduleIds = (modules || []).map((m) => m.id);
      const { data: lesson } = moduleIds.length
        ? await supabase.from("course_lessons").select("id, content_type").eq("id", lessonId).in("module_id", moduleIds).maybeSingle()
        : { data: null };
      const { data: completionRow } = lesson
        ? await supabase.from("lesson_completions").select("lesson_id").eq("user_id", member.id).eq("lesson_id", lessonId).maybeSingle()
        : { data: null };

      // The lesson must (a) really belong to this course, (b) not be a
      // quiz or assignment lesson (those complete via the quiz submit
      // route / the admin grading route instead - awarding lesson_completed
      // here too would double count, and an assignment lesson should never
      // reach "complete" from this client-driven path at all), and (c)
      // have a real lesson_completions row for this caller - never award
      // off the client's say-so alone.
      if (lesson && lesson.content_type !== "quiz" && lesson.content_type !== "assignment" && completionRow) {
        try {
          lessonPoints = await awardPoints(member.id, "lesson_completed", lessonId);
        } catch (err) {
          console.error("lesson-completed points award failed:", err);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      ...result,
      pointsAwarded: result.pointsAwarded + lessonPoints.pointsAwarded,
      newBadges: [...result.newBadges, ...lessonPoints.newBadges],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
