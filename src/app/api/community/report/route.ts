import { NextResponse } from "next/server";
import { verifyMember } from "@/lib/auth/verifyMember";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/community/validate";

export const runtime = "nodejs";

// Server-side allow-list mapping a report's targetType to its real table -
// never a client-supplied table name.
const TARGET_TABLE: Record<string, string> = {
  course_review: "course_reviews",
  discussion_post: "discussion_posts",
  discussion_reply: "discussion_replies",
};

export async function POST(req: Request) {
  try {
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const targetType = payload?.targetType;
    const targetId = payload?.targetId;
    const reason = typeof payload?.reason === "string" ? payload.reason.trim().slice(0, 500) : null;

    const table = TARGET_TABLE[targetType];
    if (!table) {
      return NextResponse.json({ ok: false, error: "Invalid report target." }, { status: 400 });
    }
    if (!isUuid(targetId)) {
      return NextResponse.json({ ok: false, error: "Invalid report target." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // content_reports.target_id is intentionally not an FK (it points at
    // one of three different tables) - this lookup IS the integrity check
    // that would otherwise be missing, and content_reports has no
    // client-writable insert policy specifically so this can't be skipped.
    const { data: target } = await supabase.from(table).select("id, user_id, status").eq("id", targetId).maybeSingle();
    if (!target) {
      return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    }
    if (target.status !== "visible") {
      return NextResponse.json({ ok: false, error: "This content is no longer available." }, { status: 400 });
    }
    if (target.user_id === member.id) {
      return NextResponse.json({ ok: false, error: "You can't report your own content." }, { status: 400 });
    }

    const { error: insertErr } = await supabase.from("content_reports").insert({
      reporter_user_id: member.id,
      target_type: targetType,
      target_id: targetId,
      reason,
    });
    // A duplicate report from the same person on the same target is a
    // no-op success, not an error - the unique constraint is what
    // prevents spamming the moderation queue with repeats.
    if (insertErr && insertErr.code !== "23505") {
      return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
