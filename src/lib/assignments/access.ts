import { supabaseAdmin } from "@/lib/supabase/admin";
import { hasEntitlement } from "@/lib/payments/entitlement";

export type AssignmentRow = {
  id: string;
  title: string;
  instructions: string;
  quiz_id: string | null;
  allow_file_upload: boolean;
  peer_review_enabled: boolean;
  status: "draft" | "published";
};

export type ActiveSubmission = {
  id: string;
  assignment_id: string;
  course_id: string;
  user_id: string;
  submission_text: string;
  file_path: string | null;
  file_name: string | null;
  status: "submitted" | "graded";
  score_percent: number | null;
  passed: boolean | null;
  feedback: string | null;
  graded_at: string | null;
  submitted_at: string;
};

export type AssignmentAccessResult =
  | { ok: true; assignment: AssignmentRow; courseId: string; lessonId: string }
  | { ok: false; status: number; error: string; premium?: true };

// The one place every assignment route resolves "does this assignment
// exist, is it published, and is this caller allowed to see/submit to
// it" - mirrors resolveQuizAccess()'s reasoning exactly (verifyMember only
// proves identity, not course entitlement). Also rejects a still-draft
// assignment even if its containing course is published - an assignment
// lesson pointing at draft content must not be reachable by learners.
export async function resolveAssignmentAccess(
  assignmentId: string,
  caller: { userId?: string | null; email?: string | null }
): Promise<AssignmentAccessResult> {
  const supabase = supabaseAdmin();

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id, title, instructions, quiz_id, allow_file_upload, peer_review_enabled, status")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!assignment || assignment.status !== "published") {
    return { ok: false, status: 404, error: "Assignment not found." };
  }

  // At most one course_lessons row can point at this assignment
  // (course_lessons_assignment_id_unique).
  const { data: lesson } = await supabase
    .from("course_lessons")
    .select("id, module_id")
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  if (!lesson) {
    return { ok: false, status: 404, error: "This assignment is not attached to any lesson." };
  }

  const { data: courseModule } = await supabase
    .from("course_modules")
    .select("course_id")
    .eq("id", lesson.module_id)
    .maybeSingle();

  const courseId = courseModule?.course_id;
  if (!courseId) {
    return { ok: false, status: 404, error: "Not found" };
  }

  const { entitled, reason } = await hasEntitlement("course", courseId, caller);
  if (reason === "not_found") {
    return { ok: false, status: 404, error: "Not found" };
  }
  if (!entitled) {
    return { ok: false, status: 403, error: "This content is premium. Purchase or sign in to access it.", premium: true };
  }

  return { ok: true, assignment: assignment as AssignmentRow, courseId, lessonId: lesson.id };
}

// "Active" = status in ('submitted','graded'), enforced at the DB level by
// assignment_submissions_one_active (a partial unique index), so there is
// at most one. Every caller that needs "the current submission" - the GET
// route, the grading route, the evaluator - uses this SAME helper, never a
// separate "latest by submitted_at" query that could quietly diverge from
// this definition once history grows.
export async function getActiveSubmission(assignmentId: string, userId: string): Promise<ActiveSubmission | null> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("assignment_submissions")
    .select("id, assignment_id, course_id, user_id, submission_text, file_path, file_name, status, score_percent, passed, feedback, graded_at, submitted_at")
    .eq("assignment_id", assignmentId)
    .eq("user_id", userId)
    .in("status", ["submitted", "graded"])
    .maybeSingle();
  return (data as ActiveSubmission | null) ?? null;
}
