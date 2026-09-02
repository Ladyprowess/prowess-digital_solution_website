import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { resolveAssignmentAccess } from "@/lib/assignments/access";
import { evaluateCourseCompletion } from "@/lib/certificates/evaluate";
import { normalizeBody } from "@/lib/community/validate";

export const runtime = "nodejs";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/zip",
  "text/plain",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const EXT_FOR_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "application/zip": "zip",
  "text/plain": "txt",
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

// Resubmission is unlimited - the latest submission is what counts.
// Uploads the optional file first (if any), then hands the atomic
// supersede-old/insert-new/clear-stale-completion transition to
// submit_assignment() (see supabase/assignments.sql) rather than doing
// those steps as separate JS-level calls, which would leave a real race
// window. If that RPC call fails for any reason, the just-uploaded file is
// deleted so a failed resubmission never leaves an orphaned object.
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

    const formData = await req.formData();
    const submissionText = normalizeBody(formData.get("submissionText"), 4000);
    if (submissionText === null) {
      return NextResponse.json({ ok: false, error: "Your submission text must be 1-4000 characters." }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    if (file && !access.assignment.allow_file_upload) {
      return NextResponse.json({ ok: false, error: "This assignment does not accept file uploads." }, { status: 400 });
    }
    if (file) {
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ ok: false, error: "File is too large. Maximum size is 15 MB." }, { status: 400 });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ ok: false, error: "File type not supported." }, { status: 400 });
      }
    }

    const supabase = supabaseAdmin();

    let filePath: string | null = null;
    let fileName: string | null = null;
    if (file) {
      const ext = EXT_FOR_TYPE[file.type] || "bin";
      filePath = `${member.id}/${assignmentId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      fileName = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadErr } = await supabase.storage
        .from("assignment-submissions")
        .upload(filePath, buffer, { contentType: file.type, upsert: false });
      if (uploadErr) {
        return NextResponse.json({ ok: false, error: uploadErr.message }, { status: 500 });
      }
    }

    const { error: rpcErr } = await supabase.rpc("submit_assignment", {
      p_assignment_id: assignmentId,
      p_course_id: access.courseId,
      p_user_id: member.id,
      p_lesson_id: access.lessonId,
      p_submission_text: submissionText,
      p_file_path: filePath,
      p_file_name: fileName,
    });

    if (rpcErr) {
      if (filePath) await supabase.storage.from("assignment-submissions").remove([filePath]);
      return NextResponse.json({ ok: false, error: rpcErr.message }, { status: 500 });
    }

    // Recompute learning_progress.progress_percent (same formula the quiz
    // submit route uses) - a resubmission can DECREASE the completed count
    // if the previous submission had been graded-passed (submit_assignment
    // just cleared that stale lesson_completions row), so this must run on
    // every submission, not just when something newly completes.
    const { data: modules } = await supabase.from("course_modules").select("id").eq("course_id", access.courseId);
    const moduleIds = (modules || []).map((m) => m.id);
    const { data: allLessons } = moduleIds.length
      ? await supabase.from("course_lessons").select("id").in("module_id", moduleIds)
      : { data: [] };
    const allLessonIds = (allLessons || []).map((l) => l.id);
    const { data: completedRows } = allLessonIds.length
      ? await supabase.from("lesson_completions").select("lesson_id").eq("user_id", member.id).in("lesson_id", allLessonIds)
      : { data: [] };
    const progressPercent = allLessonIds.length ? Math.round(((completedRows || []).length / allLessonIds.length) * 100) : 0;

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

    let completion = null;
    try {
      completion = await evaluateCourseCompletion(access.courseId, member.id);
    } catch (err) {
      console.error("assignment submission completion evaluation failed:", err);
    }

    return NextResponse.json({ ok: true, newlyCompleted: completion?.newlyCompleted ?? false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
