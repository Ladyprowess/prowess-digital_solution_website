import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { getActiveSubmission } from "@/lib/assignments/access";

export const runtime = "nodejs";

// Same-origin proxy (mirrors /api/resources/[id]/file's reasoning: the
// response is the file's bytes served from this route's own URL, never a
// raw storage-domain link). Authorized callers: the submission's owner;
// an admin; or a learner currently eligible to peer-review this exact
// submission (own active submission for the same assignment, hasn't
// already reviewed this one, isn't the author) - re-evaluated on every
// request rather than a stored reservation, same as /peer-review/next.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    const supabase = supabaseAdmin();

    const { data: submission } = await supabase
      .from("assignment_submissions")
      .select("id, assignment_id, user_id, status, file_path, file_name")
      .eq("id", id)
      .maybeSingle();

    if (!submission || !submission.file_path) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const isOwner = submission.user_id === member.id;
    let authorized = isOwner;
    let isReviewer = false;

    if (!authorized) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", member.id).maybeSingle();
      authorized = profile?.role === "admin";
    }

    if (!authorized && ["submitted", "graded"].includes(submission.status)) {
      const { data: assignment } = await supabase
        .from("assignments")
        .select("peer_review_enabled")
        .eq("id", submission.assignment_id)
        .maybeSingle();
      const ownSubmission = assignment?.peer_review_enabled ? await getActiveSubmission(submission.assignment_id, member.id) : null;
      if (ownSubmission) {
        const { data: alreadyReviewed } = await supabase
          .from("assignment_peer_reviews")
          .select("id")
          .eq("reviewer_user_id", member.id)
          .eq("submission_id", submission.id)
          .maybeSingle();
        authorized = !alreadyReviewed;
        isReviewer = authorized;
      }
    }

    if (!authorized) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const { data: blob, error } = await supabase.storage.from("assignment-submissions").download(submission.file_path);
    if (error || !blob) {
      return NextResponse.json({ ok: false, error: "File not found in storage." }, { status: 404 });
    }

    // A reviewer never sees the original filename - it can contain the
    // learner's name (e.g. "John_Smith_Assignment.pdf"), which would break
    // the same anonymity guarantee /peer-review/next already withholds it
    // for. Owner/admin still get the real name.
    const ext = (submission.file_name || "").split(".").pop() || "";
    const downloadName = isReviewer ? `submission${ext ? `.${ext}` : ""}` : (submission.file_name || "submission");

    return new NextResponse(blob, {
      headers: {
        "Content-Type": blob.type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${downloadName.replace(/["\\]/g, "")}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
