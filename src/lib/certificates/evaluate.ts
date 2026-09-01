import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type EvaluationResult = {
  completed: boolean;
  newlyCompleted: boolean;
  certificateIssued: boolean;
  certificateAlreadyIssued: boolean;
  certificateBlockedReason: "missing_profile_name" | null;
};

const NOT_COMPLETED: EvaluationResult = {
  completed: false,
  newlyCompleted: false,
  certificateIssued: false,
  certificateAlreadyIssued: false,
  certificateBlockedReason: null,
};

const MAX_CODE_ATTEMPTS = 5;

function generateVerificationCode(): string {
  const part = () => crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 hex chars per part
  return `CERT-${part()}-${part()}`;
}

// Fetches this course's course_lessons the same way src/lib/quizzes/access.ts
// and the quiz submit route's learning_progress recompute do - course_lessons
// has no course_id column of its own, only module_id -> course_modules.course_id,
// so it's always a two-step fetch, never a single joined/embedded query.
async function fetchCourseLessons(supabase: ReturnType<typeof supabaseAdmin>, courseId: string) {
  const { data: modules } = await supabase.from("course_modules").select("id").eq("course_id", courseId);
  const moduleIds = (modules || []).map((m) => m.id);
  if (moduleIds.length === 0) return [];
  const { data: lessons } = await supabase
    .from("course_lessons")
    .select("id, required, quiz_id")
    .in("module_id", moduleIds);
  return lessons || [];
}

// The one place "has this learner completed this course, and does that
// earn them a certificate" gets decided. Both trigger points (the quiz
// submit route, and the evaluate-completion route) call this and never
// compute completion themselves.
export async function evaluateCourseCompletion(courseId: string, userId: string): Promise<EvaluationResult> {
  const supabase = supabaseAdmin();

  const { data: rules } = await supabase
    .from("course_completion_rules")
    .select("*")
    .eq("course_id", courseId)
    .maybeSingle();

  // No rules configured means completion itself isn't defined yet for
  // this course, not just that no certificate is configured.
  if (!rules) return NOT_COMPLETED;

  const { data: existingCompletion } = await supabase
    .from("course_completions")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  let newlyCompleted = false;

  if (existingCompletion) {
    // Already completed - skip straight to the certificate step.
  } else {
    const lessons = await fetchCourseLessons(supabase, courseId);

    let anyRealTarget = false;
    let allSatisfied = true;

    if (rules.require_all_required_activities) {
      const requiredLessonIds = lessons.filter((l) => l.required).map((l) => l.id);
      if (requiredLessonIds.length > 0) {
        anyRealTarget = true;
        const { data: completedRows } = await supabase
          .from("lesson_completions")
          .select("lesson_id")
          .eq("user_id", userId)
          .in("lesson_id", requiredLessonIds);
        const completedIds = new Set((completedRows || []).map((r) => r.lesson_id));
        if (requiredLessonIds.some((id) => !completedIds.has(id))) allSatisfied = false;
      }
    }

    if (rules.require_all_quizzes_passed) {
      const quizIds = lessons.filter((l) => l.quiz_id).map((l) => l.quiz_id as string);
      if (quizIds.length > 0) {
        const { data: quizzes } = await supabase
          .from("quizzes")
          .select("id, quiz_type, pass_mark_percent")
          .in("id", quizIds);
        // Filtered in application code, not in the query - a filtered
        // nested-embed query would only filter the embedded array, not
        // exclude the parent row, silently including non-assessment/
        // no-pass-mark quizzes in this count.
        const gatingQuizIds = (quizzes || [])
          .filter((q) => q.quiz_type === "assessment" && q.pass_mark_percent != null)
          .map((q) => q.id);
        if (gatingQuizIds.length > 0) {
          anyRealTarget = true;
          const { data: passedAttempts } = await supabase
            .from("quiz_attempts")
            .select("quiz_id")
            .eq("user_id", userId)
            .eq("passed", true)
            .in("quiz_id", gatingQuizIds);
          const passedIds = new Set((passedAttempts || []).map((a) => a.quiz_id));
          if (gatingQuizIds.some((id) => !passedIds.has(id))) allSatisfied = false;
        }
      }
    }

    if (rules.require_final_assessment) {
      // Do not trust that final_assessment_quiz_id belongs to this course
      // or is a valid target just because the admin UI's picker only
      // offered valid options - re-verify server-side. If it fails any of
      // these checks, this rule is unsatisfiable (fail closed), not skipped.
      const finalQuizId = rules.final_assessment_quiz_id as string | null;
      const belongsToCourse = finalQuizId ? lessons.some((l) => l.quiz_id === finalQuizId) : false;

      if (!finalQuizId || !belongsToCourse) {
        anyRealTarget = true; // the rule is enabled, just misconfigured/unsatisfiable
        allSatisfied = false;
      } else {
        const { data: finalQuiz } = await supabase
          .from("quizzes")
          .select("quiz_type, pass_mark_percent")
          .eq("id", finalQuizId)
          .maybeSingle();

        if (!finalQuiz || finalQuiz.quiz_type !== "assessment" || finalQuiz.pass_mark_percent == null) {
          anyRealTarget = true;
          allSatisfied = false;
        } else {
          anyRealTarget = true;
          const { data: attempts } = await supabase
            .from("quiz_attempts")
            .select("score_percent")
            .eq("user_id", userId)
            .eq("quiz_id", finalQuizId)
            .eq("passed", true)
            .order("score_percent", { ascending: false })
            .limit(1);

          const bestPassingScore = attempts?.[0]?.score_percent ?? null;
          if (bestPassingScore == null) {
            allSatisfied = false;
          } else if (rules.minimum_final_score_percent != null && bestPassingScore < rules.minimum_final_score_percent) {
            allSatisfied = false;
          }
        }
      }
    }

    // require_assignments / require_peer_reviews are never evaluated -
    // schema-only until the Assignment system exists.

    // A vacuous ruleset (enabled rules with no real, checkable target)
    // must not silently complete every entitled learner on first visit -
    // this is defense in depth; the admin UI is the primary place this
    // gets prevented, by blocking the save of such a configuration.
    if (!anyRealTarget || !allSatisfied) return NOT_COMPLETED;

    const { error: insertErr } = await supabase.from("course_completions").insert({ user_id: userId, course_id: courseId });
    if (insertErr && insertErr.code !== "23505") {
      // A real error, not a race with another concurrent evaluation.
      throw new Error(`Could not record course completion: ${insertErr.message}`);
    }
    newlyCompleted = true;
  }

  // Certificate step - only reached once completed is true, whether just
  // now or previously.
  if (!rules.issue_certificate_automatically) {
    return { completed: true, newlyCompleted, certificateIssued: false, certificateAlreadyIssued: false, certificateBlockedReason: null };
  }

  const { data: existingCertificate } = await supabase
    .from("certificates")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existingCertificate) {
    return { completed: true, newlyCompleted, certificateIssued: false, certificateAlreadyIssued: true, certificateBlockedReason: null };
  }

  const { data: profile } = await supabase.from("member_profiles").select("full_name").eq("id", userId).maybeSingle();

  // No email fallback - a certificate reading "someone@example.com has
  // successfully completed..." looks broken, not professional.
  if (!profile?.full_name) {
    return { completed: true, newlyCompleted, certificateIssued: false, certificateAlreadyIssued: false, certificateBlockedReason: "missing_profile_name" };
  }

  const { data: course } = await supabase.from("courses").select("title").eq("id", courseId).maybeSingle();

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const { error: certErr } = await supabase.from("certificates").insert({
      user_id: userId,
      course_id: courseId,
      verification_code: generateVerificationCode(),
      learner_name: profile.full_name,
      course_title: course?.title || "Untitled course",
    });

    if (!certErr) {
      return { completed: true, newlyCompleted, certificateIssued: true, certificateAlreadyIssued: false, certificateBlockedReason: null };
    }

    if (certErr.code === "23505") {
      // Two unique constraints share this error code - disambiguate by
      // re-querying (user_id, course_id) rather than assuming which fired.
      const { data: raceWinner } = await supabase
        .from("certificates")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();
      if (raceWinner) {
        return { completed: true, newlyCompleted, certificateIssued: false, certificateAlreadyIssued: true, certificateBlockedReason: null };
      }
      // No (user_id, course_id) row exists - the collision was on
      // verification_code specifically. Loop and try a fresh code.
      continue;
    }

    throw new Error(`Could not issue certificate: ${certErr.message}`);
  }

  throw new Error(`Could not generate a unique verification code after ${MAX_CODE_ATTEMPTS} attempts`);
}
