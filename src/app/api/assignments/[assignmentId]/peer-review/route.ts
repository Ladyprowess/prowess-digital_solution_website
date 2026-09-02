import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { resolveAssignmentAccess } from "@/lib/assignments/access";
import { evaluateCourseCompletion } from "@/lib/certificates/evaluate";
import { isUuid, normalizeBody } from "@/lib/community/validate";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const { assignmentId } = await params;
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    const access = await resolveAssignmentAccess(assignmentId, { userId: member.id, email: member.email });
    if (!access.ok) {
      return NextResponse.json({ ok: false, error: access.error, premium: access.premium }, { status: access.status });
    }
    if (!access.assignment.peer_review_enabled) {
      return NextResponse.json({ ok: false, error: "Peer review is not enabled for this assignment." }, { status: 400 });
    }

    const payload = await req.json().catch(() => ({}));
    const submissionId = payload?.submissionId;
    const rating = payload?.rating ?? null;
    const feedback = normalizeBody(payload?.feedback, 4000);

    if (!isUuid(submissionId)) {
      return NextResponse.json({ ok: false, error: "Invalid submission." }, { status: 400 });
    }
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return NextResponse.json({ ok: false, error: "Rating must be a whole number from 1 to 5." }, { status: 400 });
    }
    if (feedback === null) {
      return NextResponse.json({ ok: false, error: "Feedback must be 1-4000 characters." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { data: target } = await supabase
      .from("assignment_submissions")
      .select("id, assignment_id, user_id, status")
      .eq("id", submissionId)
      .maybeSingle();

    if (!target || target.assignment_id !== assignmentId) {
      return NextResponse.json({ ok: false, error: "Submission not found." }, { status: 404 });
    }
    if (target.user_id === member.id) {
      return NextResponse.json({ ok: false, error: "You can't review your own submission." }, { status: 400 });
    }
    if (!["submitted", "graded"].includes(target.status)) {
      return NextResponse.json({ ok: false, error: "This submission is no longer available to review." }, { status: 400 });
    }

    const { error: insertErr } = await supabase.from("assignment_peer_reviews").insert({
      assignment_id: assignmentId,
      course_id: access.courseId,
      reviewer_user_id: member.id,
      submission_id: submissionId,
      rating,
      feedback,
    });
    // Already reviewed this exact submission - no-op success, not an error.
    if (insertErr && insertErr.code !== "23505") {
      return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
    }

    // Finishing the Nth review can newly satisfy require_peer_reviews.
    let completion = null;
    try {
      completion = await evaluateCourseCompletion(access.courseId, member.id);
    } catch (err) {
      console.error("peer review completion evaluation failed:", err);
    }

    return NextResponse.json({ ok: true, newlyCompleted: completion?.newlyCompleted ?? false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
