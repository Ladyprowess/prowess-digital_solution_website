import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { resolveAssignmentAccess, getActiveSubmission } from "@/lib/assignments/access";

export const runtime = "nodejs";

// Fetches an assignment's prompt for the learner, plus their current
// active submission (if any) and any peer reviews received on it. member
// is optional (mirrors /api/quizzes/[quizId]'s own optional-member
// handling) - an assignment on a free course should be readable signed-out.
export async function GET(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const { assignmentId } = await params;
    const member = await verifyMember(req);

    const access = await resolveAssignmentAccess(assignmentId, { userId: member?.id ?? null, email: member?.email ?? null });
    if (!access.ok) {
      return NextResponse.json({ ok: false, error: access.error, premium: access.premium }, { status: access.status });
    }

    let activeSubmission = null;
    // Received reviews are served ONLY through this route, selecting just
    // {rating, feedback, created_at} - reviewer_user_id must never reach
    // the reviewed learner (anonymity is a stated product requirement).
    // There is deliberately no RLS policy that would let a client read
    // this table directly for exactly that reason.
    let receivedReviews: { rating: number | null; feedback: string; created_at: string }[] = [];

    // Course-wide peer-review progress ("X of N course reviews done") -
    // the same count the evaluator itself uses for require_peer_reviews,
    // computed here so AssignmentRunner never needs its own read access to
    // course_completion_rules (admin-only, no client policy at all).
    let peerReviewProgress: { done: number; required: number } | null = null;

    if (member) {
      const supabase = supabaseAdmin();
      activeSubmission = await getActiveSubmission(assignmentId, member.id);
      if (activeSubmission) {
        const { data } = await supabase
          .from("assignment_peer_reviews")
          .select("rating, feedback, created_at")
          .eq("submission_id", activeSubmission.id)
          .order("created_at", { ascending: false });
        receivedReviews = data || [];
      }

      if (access.assignment.peer_review_enabled) {
        const [{ count }, { data: rules }] = await Promise.all([
          supabase
            .from("assignment_peer_reviews")
            .select("id", { count: "exact", head: true })
            .eq("reviewer_user_id", member.id)
            .eq("course_id", access.courseId),
          supabase.from("course_completion_rules").select("required_peer_review_count").eq("course_id", access.courseId).maybeSingle(),
        ]);
        peerReviewProgress = { done: count || 0, required: rules?.required_peer_review_count ?? 1 };
      }
    }

    return NextResponse.json({
      ok: true,
      assignment: {
        id: access.assignment.id,
        title: access.assignment.title,
        instructions: access.assignment.instructions,
        quizId: access.assignment.quiz_id,
        allowFileUpload: access.assignment.allow_file_upload,
        peerReviewEnabled: access.assignment.peer_review_enabled,
      },
      activeSubmission,
      receivedReviews,
      peerReviewProgress,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
