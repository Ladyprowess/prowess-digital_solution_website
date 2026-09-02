import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasEntitlement } from "@/lib/payments/entitlement";

export type QuizRow = {
  id: string;
  title: string;
  description: string | null;
  quiz_type: "knowledge_check" | "assessment";
  pass_mark_percent: number | null;
  allow_retry: boolean;
  show_correct_answer: "immediately" | "after_submission";
};

export type QuizAccessResult =
  | { ok: true; quiz: QuizRow; courseId: string | null; lessonId: string | null; context: "quiz_lesson" | "assignment_quiz" | "standalone"; assignmentId: string | null }
  | { ok: false; status: number; error: string; premium?: true };

// The one place every quiz route resolves "does this quiz exist, and is
// this caller allowed to see/attempt it" - called by all four learner-facing
// routes, not just the GET one. verifyMember only proves identity; it
// doesn't prove entitlement to the course a quiz is attached to, so a
// caller who knows a quizId could otherwise skip straight to
// POST .../attempts and bypass the course paywall entirely if this check
// only lived in the GET route.
//
// A quiz attaches to a course one of two ways: directly to a lesson
// (course_lessons.quiz_id, "quiz_lesson" - the original Phase 1 shape), or
// embedded inside an Assignment as a combined auto-graded component
// (assignments.quiz_id -> course_lessons.assignment_id, "assignment_quiz").
// The two are mutually exclusive by admin-side validation (see
// src/app/admin/learn), never both at once for the same quiz. `context`
// tells every caller which shape it found, because the two must NOT be
// treated the same for completion purposes - see the submit route, which
// only upserts lesson_completions for "quiz_lesson"/"standalone", never
// for "assignment_quiz" (an embedded quiz passing is only half of an
// assignment's requirement; the grading route decides final completion).
export async function resolveQuizAccess(
  quizId: string,
  caller: { userId?: string | null; email?: string | null }
): Promise<QuizAccessResult> {
  const supabase = supabaseAdmin();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, description, quiz_type, pass_mark_percent, allow_retry, show_correct_answer")
    .eq("id", quizId)
    .maybeSingle();

  if (!quiz) {
    return { ok: false, status: 404, error: "Quiz not found." };
  }

  // At most one course_lessons row can point at this quiz (course_lessons_quiz_id_unique).
  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("id, module_id")
    .eq("quiz_id", quizId)
    .maybeSingle();

  let context: "quiz_lesson" | "assignment_quiz" | "standalone" = "standalone";
  let assignmentId: string | null = null;
  let resolvedLesson: { id: string; module_id: string } | null = lesson ?? null;

  if (lesson) {
    context = "quiz_lesson";
  } else {
    // Not a standalone quiz lesson - check whether it's embedded in an
    // assignment instead (course_lessons_assignment_id_unique means at
    // most one lesson points at that assignment).
    const { data: assignment } = await supabase.from("assignments").select("id").eq("quiz_id", quizId).maybeSingle();
    if (assignment) {
      assignmentId = assignment.id;
      const { data: assignmentLesson } = await supabase
        .from("course_lessons")
        .select("id, module_id")
        .eq("assignment_id", assignment.id)
        .maybeSingle();
      if (assignmentLesson) {
        context = "assignment_quiz";
        resolvedLesson = assignmentLesson;
      }
    }
  }

  if (!resolvedLesson) {
    // Unattached (a future standalone quiz) - nothing built yet uses this
    // path, but no entitlement check applies since there's no course to
    // check against.
    return { ok: true, quiz: quiz as QuizRow, courseId: null, lessonId: null, context: "standalone", assignmentId: null };
  }

  const { data: courseModule } = await supabase
    .from("course_modules")
    .select("course_id")
    .eq("id", resolvedLesson.module_id)
    .maybeSingle();

  const courseId = courseModule?.course_id ?? null;
  if (!courseId) {
    return { ok: true, quiz: quiz as QuizRow, courseId: null, lessonId: resolvedLesson.id, context, assignmentId };
  }

  const { entitled, reason } = await hasEntitlement("course", courseId, caller);
  if (reason === "not_found") {
    return { ok: false, status: 404, error: "Not found" };
  }
  if (!entitled) {
    return { ok: false, status: 403, error: "This content is premium. Purchase or sign in to access it.", premium: true };
  }

  return { ok: true, quiz: quiz as QuizRow, courseId, lessonId: resolvedLesson.id, context, assignmentId };
}
