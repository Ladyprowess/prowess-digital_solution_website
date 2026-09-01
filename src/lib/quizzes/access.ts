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
  | { ok: true; quiz: QuizRow; courseId: string | null; lessonId: string | null }
  | { ok: false; status: number; error: string; premium?: true };

// The one place every quiz route resolves "does this quiz exist, and is
// this caller allowed to see/attempt it" - called by all four learner-facing
// routes, not just the GET one. verifyMember only proves identity; it
// doesn't prove entitlement to the course a quiz is attached to, so a
// caller who knows a quizId could otherwise skip straight to
// POST .../attempts and bypass the course paywall entirely if this check
// only lived in the GET route.
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

  if (!lesson) {
    // Unattached (a future standalone quiz) - nothing built yet uses this
    // path in Phase 1, but no entitlement check applies since there's no
    // course to check against.
    return { ok: true, quiz: quiz as QuizRow, courseId: null, lessonId: null };
  }

  const { data: courseModule } = await supabase
    .from("course_modules")
    .select("course_id")
    .eq("id", lesson.module_id)
    .maybeSingle();

  const courseId = courseModule?.course_id ?? null;
  if (!courseId) {
    return { ok: true, quiz: quiz as QuizRow, courseId: null, lessonId: lesson.id };
  }

  const { entitled, reason } = await hasEntitlement("course", courseId, caller);
  if (reason === "not_found") {
    return { ok: false, status: 404, error: "Not found" };
  }
  if (!entitled) {
    return { ok: false, status: 403, error: "This content is premium. Purchase or sign in to access it.", premium: true };
  }

  return { ok: true, quiz: quiz as QuizRow, courseId, lessonId: lesson.id };
}
