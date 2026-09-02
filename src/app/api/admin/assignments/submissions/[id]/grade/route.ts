import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { evaluateCourseCompletion } from "@/lib/certificates/evaluate";
import { normalizeBody } from "@/lib/community/validate";

export const runtime = "nodejs";

// The one admin action in this codebase routed through an API instead of
// a direct client RLS write, because it must cascade into
// evaluateCourseCompletion()/awardPoints() - real TypeScript logic, not
// portable to a Postgres function the way Community's
// resolve_content_report was.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    const supabase = supabaseAdmin();

    // First server-side admin check in this codebase - mirrors
    // useRequireAdmin's client-side query, just moved server-side.
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", member.id).maybeSingle();
    if (profile?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 403 });
    }

    const payload = await req.json().catch(() => ({}));
    const scorePercent = payload?.scorePercent ?? null;
    const passed = payload?.passed;
    const feedback = payload?.feedback == null ? null : normalizeBody(payload.feedback, 4000);

    if (scorePercent !== null && (!Number.isInteger(scorePercent) || scorePercent < 0 || scorePercent > 100)) {
      return NextResponse.json({ ok: false, error: "Score must be a whole number from 0 to 100." }, { status: 400 });
    }
    if (typeof passed !== "boolean") {
      return NextResponse.json({ ok: false, error: "Pass/fail is required." }, { status: 400 });
    }
    if (payload?.feedback != null && feedback === null) {
      return NextResponse.json({ ok: false, error: "Feedback must be 1-4000 characters." }, { status: 400 });
    }

    const { data: submission } = await supabase
      .from("assignment_submissions")
      .select("id, assignment_id, course_id, user_id, status")
      .eq("id", id)
      .maybeSingle();
    if (!submission) {
      return NextResponse.json({ ok: false, error: "Submission not found." }, { status: 404 });
    }

    // The denormalized course_id is a query convenience, never the
    // authority for anything that affects completion/credentials -
    // re-derive it from the trusted relationship and cross-check.
    const { data: lesson } = await supabase
      .from("course_lessons")
      .select("id, module_id")
      .eq("assignment_id", submission.assignment_id)
      .maybeSingle();
    const { data: courseModule } = lesson
      ? await supabase.from("course_modules").select("course_id").eq("id", lesson.module_id).maybeSingle()
      : { data: null };

    if (!lesson || !courseModule || courseModule.course_id !== submission.course_id) {
      return NextResponse.json({ ok: false, error: "This submission's course/lesson data is inconsistent." }, { status: 500 });
    }
    const courseId = courseModule.course_id;
    const lessonId = lesson.id;

    // Re-grading an already-graded active submission is allowed (an admin
    // can revise a grade/feedback) - but a since-superseded submission
    // (the learner resubmitted while this sat in the queue) must be
    // rejected, never silently graded.
    const { data: updated } = await supabase
      .from("assignment_submissions")
      .update({ status: "graded", score_percent: scorePercent, passed, feedback, graded_at: new Date().toISOString(), graded_by: member.id })
      .eq("id", id)
      .in("status", ["submitted", "graded"])
      .select("id")
      .maybeSingle();

    if (!updated) {
      return NextResponse.json({ ok: false, error: "This submission has been replaced by a newer submission." }, { status: 409 });
    }

    // Always recompute lesson_completions from the NEW passed value,
    // regardless of what it was before - a regrade can flip either
    // direction (pass -> fail must remove it; fail -> pass must create
    // it). Never revokes an already-issued certificate/course_completions
    // row - only the current activity/progress state.
    if (passed) {
      await supabase.from("lesson_completions").upsert({ user_id: submission.user_id, lesson_id: lessonId }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });
    } else {
      await supabase.from("lesson_completions").delete().eq("user_id", submission.user_id).eq("lesson_id", lessonId);
    }

    const { data: modules } = await supabase.from("course_modules").select("id").eq("course_id", courseId);
    const moduleIds = (modules || []).map((m) => m.id);
    const { data: allLessons } = moduleIds.length
      ? await supabase.from("course_lessons").select("id").in("module_id", moduleIds)
      : { data: [] };
    const allLessonIds = (allLessons || []).map((l) => l.id);
    const { data: completedRows } = allLessonIds.length
      ? await supabase.from("lesson_completions").select("lesson_id").eq("user_id", submission.user_id).in("lesson_id", allLessonIds)
      : { data: [] };
    const progressPercent = allLessonIds.length ? Math.round(((completedRows || []).length / allLessonIds.length) * 100) : 0;

    await supabase.from("learning_progress").upsert(
      {
        user_id: submission.user_id,
        course_id: courseId,
        status: progressPercent === 100 ? "completed" : progressPercent > 0 ? "in_progress" : "not_started",
        progress_percent: progressPercent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_id" }
    );

    let completion = null;
    try {
      completion = await evaluateCourseCompletion(courseId, submission.user_id);
    } catch (err) {
      console.error("assignment grading completion evaluation failed:", err);
    }

    return NextResponse.json({
      ok: true,
      newlyCompleted: completion?.newlyCompleted ?? false,
      certificateIssued: completion?.certificateIssued ?? false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
