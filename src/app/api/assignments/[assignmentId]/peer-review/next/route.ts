import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { resolveAssignmentAccess, getActiveSubmission } from "@/lib/assignments/access";

export const runtime = "nodejs";

const CANDIDATE_BATCH = 20;

// An eligibility lookup, not a reservation/allocation system - two
// reviewers (or two tabs) can be handed the same candidate; no fairness
// balancing is built for V1. Deliberately returns only what's needed to
// review {submissionId, submissionText, fileAvailable} - never user_id,
// author name, or the raw file path/name, since anonymity applies to the
// reviewer's view of the candidate exactly as it does to the reviewed
// learner's view of the reviewer.
export async function GET(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
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

    const ownSubmission = await getActiveSubmission(assignmentId, member.id);
    if (!ownSubmission) {
      return NextResponse.json({ ok: false, error: "Submit your own work before reviewing others." }, { status: 403 });
    }

    const supabase = supabaseAdmin();

    const { data: alreadyReviewed } = await supabase
      .from("assignment_peer_reviews")
      .select("submission_id")
      .eq("reviewer_user_id", member.id);
    const reviewedIds = new Set((alreadyReviewed || []).map((r) => r.submission_id));

    const { data: candidates } = await supabase
      .from("assignment_submissions")
      .select("id, submission_text, file_path")
      .eq("assignment_id", assignmentId)
      .neq("user_id", member.id)
      .in("status", ["submitted", "graded"])
      .order("submitted_at", { ascending: true })
      .limit(CANDIDATE_BATCH);

    const next = (candidates || []).find((c) => !reviewedIds.has(c.id));

    if (!next) {
      return NextResponse.json({ ok: true, submission: null });
    }

    return NextResponse.json({
      ok: true,
      submission: { submissionId: next.id, submissionText: next.submission_text, fileAvailable: Boolean(next.file_path) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
