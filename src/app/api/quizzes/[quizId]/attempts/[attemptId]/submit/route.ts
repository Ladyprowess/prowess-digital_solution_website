import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { resolveQuizAccess } from "@/lib/quizzes/access";
import { evaluateCourseCompletion, type EvaluationResult } from "@/lib/certificates/evaluate";
import { awardPoints, type AwardResult } from "@/lib/achievements/evaluate";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ quizId: string; attemptId: string }> }) {
  try {
    const { quizId, attemptId } = await params;
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    const access = await resolveQuizAccess(quizId, { userId: member.id, email: member.email });
    if (!access.ok) {
      return NextResponse.json({ ok: false, error: access.error, premium: access.premium }, { status: access.status });
    }

    const supabase = supabaseAdmin();

    const { data: attempt } = await supabase
      .from("quiz_attempts")
      .select("id, quiz_id, status")
      .eq("id", attemptId)
      .eq("user_id", member.id)
      .maybeSingle();

    if (!attempt || attempt.quiz_id !== quizId) {
      return NextResponse.json({ ok: false, error: "Attempt not found." }, { status: 404 });
    }
    if (attempt.status !== "in_progress") {
      return NextResponse.json({ ok: false, error: "This attempt has already been submitted." }, { status: 409 });
    }

    // Score against quiz_attempt_questions (what this learner actually
    // started), never a live count of quiz_questions for the quiz - immune
    // to an admin adding/editing/deleting questions mid-attempt.
    const { data: attemptQuestions } = await supabase
      .from("quiz_attempt_questions")
      .select("question_id")
      .eq("attempt_id", attemptId);

    const totalQuestions = attemptQuestions?.length || 0;
    const questionIds = (attemptQuestions || []).map((q) => q.question_id);

    const { data: answers } = questionIds.length
      ? await supabase
          .from("quiz_answers")
          .select("question_id, is_correct")
          .eq("attempt_id", attemptId)
          .in("question_id", questionIds)
      : { data: [] };

    const correctCount = (answers || []).filter((a) => a.is_correct).length;
    const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passMark = access.quiz.pass_mark_percent;
    const passed = passMark != null ? scorePercent >= passMark : null;

    const { error: updateErr } = await supabase
      .from("quiz_attempts")
      .update({ status: "submitted", submitted_at: new Date().toISOString(), score_percent: scorePercent, passed })
      .eq("id", attemptId);

    if (updateErr) {
      return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
    }

    // Completion rule: a required activity should not read as
    // course-progress-complete just because someone submitted and failed
    // it. No pass mark set -> submitting always completes it. A pass mark
    // set -> only a passing attempt completes it; a failed attempt is
    // recorded (scored) but does not tick the lesson off.
    const countsAsComplete = passMark == null || passed === true;
    let lessonCompleted = false;

    if (countsAsComplete && access.lessonId && access.courseId) {
      const { error: completionErr } = await supabase
        .from("lesson_completions")
        .upsert({ user_id: member.id, lesson_id: access.lessonId }, { onConflict: "user_id,lesson_id", ignoreDuplicates: true });

      if (!completionErr) {
        lessonCompleted = true;

        // Recompute learning_progress.progress_percent server-side, in
        // exactly this one place, so the formula never has to be
        // duplicated between here and CourseContent.tsx's client-side
        // toggleComplete for manual lessons.
        const { data: modules } = await supabase
          .from("course_modules")
          .select("id")
          .eq("course_id", access.courseId);
        const moduleIds = (modules || []).map((m) => m.id);

        const { data: allLessons } = moduleIds.length
          ? await supabase.from("course_lessons").select("id").in("module_id", moduleIds)
          : { data: [] };
        const allLessonIds = (allLessons || []).map((l) => l.id);

        const { data: completedRows } = allLessonIds.length
          ? await supabase
              .from("lesson_completions")
              .select("lesson_id")
              .eq("user_id", member.id)
              .in("lesson_id", allLessonIds)
          : { data: [] };

        const progressPercent = allLessonIds.length
          ? Math.round(((completedRows || []).length / allLessonIds.length) * 100)
          : 0;

        await supabase.from("learning_progress").upsert(
          {
            user_id: member.id,
            course_id: access.courseId,
            status: progressPercent === 100 ? "completed" : progressPercent > 0 ? "in_progress" : "not_started",
            progress_percent: progressPercent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,course_id" }
        );
      }
    }

    // The full per-question breakdown is fine here regardless of
    // show_correct_answer - the attempt is finished, there's nothing left
    // to leak an advantage on.
    const { data: questionsWithExplanation } = questionIds.length
      ? await supabase.from("quiz_questions").select("id, explanation").in("id", questionIds)
      : { data: [] };
    const explanationById = new Map((questionsWithExplanation || []).map((q) => [q.id, q.explanation]));

    const breakdown = (answers || []).map((a) => ({
      questionId: a.question_id,
      isCorrect: a.is_correct,
      explanation: explanationById.get(a.question_id) || null,
    }));

    // A completion-evaluation failure must not break the quiz-submit
    // response itself, but it must still be visible in server logs, not
    // fully silent.
    let completion: EvaluationResult | null = null;
    if (access.courseId) {
      try {
        completion = await evaluateCourseCompletion(access.courseId, member.id);
      } catch (err) {
        console.error("course completion evaluation failed:", err);
      }
    }

    // A Knowledge Check has no pass mark (passed stays null forever for
    // that quiz_type), so it would otherwise earn no achievement points at
    // all - falling through the gap between "assessment passed" and
    // "non-quiz lesson completed". Award it lesson_completed points
    // instead, same as any other lesson. An Assessment earns quiz_passed
    // points only (never also lesson_completed for the same lesson - no
    // double count).
    let activityPoints: AwardResult = { pointsAwarded: 0, newBadges: [] };
    try {
      if (access.quiz.quiz_type === "assessment" && passed === true) {
        activityPoints = await awardPoints(member.id, "quiz_passed", quizId);
      } else if (access.quiz.quiz_type === "knowledge_check" && lessonCompleted && access.lessonId) {
        activityPoints = await awardPoints(member.id, "lesson_completed", access.lessonId);
      }
    } catch (err) {
      console.error("quiz activity points award failed:", err);
    }

    return NextResponse.json({
      ok: true,
      scorePercent,
      passed,
      lessonCompleted,
      lessonId: access.lessonId,
      answers: breakdown,
      newlyCompleted: completion?.newlyCompleted ?? false,
      certificateIssued: completion?.certificateIssued ?? false,
      certificateBlockedReason: completion?.certificateBlockedReason ?? null,
      pointsAwarded: activityPoints.pointsAwarded + (completion?.pointsAwarded ?? 0),
      newBadges: [...activityPoints.newBadges, ...(completion?.newBadges ?? [])],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
