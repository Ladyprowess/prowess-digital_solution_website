import { NextResponse } from "next/server";
import { verifyMember } from "@/lib/auth/verifyMember";
import { hasEntitlement } from "@/lib/payments/entitlement";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isUuid, normalizeBody } from "@/lib/community/validate";
import { resolveAuthorFields } from "@/lib/community/author";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const courseId = payload?.courseId;
    const rating = payload?.rating;
    const body = payload?.body == null ? null : normalizeBody(payload.body, 4000);

    if (!isUuid(courseId)) {
      return NextResponse.json({ ok: false, error: "Invalid course." }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ ok: false, error: "Rating must be a whole number from 1 to 5." }, { status: 400 });
    }
    if (payload?.body != null && body === null) {
      return NextResponse.json({ ok: false, error: "Review text must be 1-4000 characters." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { entitled, reason } = await hasEntitlement("course", courseId, { userId: member.id, email: member.email });
    if (reason === "not_found") {
      return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    }
    if (!entitled) {
      return NextResponse.json({ ok: false, error: "This content is premium. Purchase or sign in to access it.", premium: true }, { status: 403 });
    }

    // Entitlement only proves access, not that the learner actually took
    // the course - a driveby review with zero engagement isn't meaningful.
    const { data: completion } = await supabase
      .from("course_completions")
      .select("id")
      .eq("user_id", member.id)
      .eq("course_id", courseId)
      .maybeSingle();
    if (!completion) {
      return NextResponse.json({ ok: false, error: "Complete this course before leaving a review." }, { status: 403 });
    }

    const { data: existing } = await supabase
      .from("course_reviews")
      .select("id, status")
      .eq("user_id", member.id)
      .eq("course_id", courseId)
      .maybeSingle();

    // Never a blind upsert: a review a moderator removed for cause must
    // never be silently resurrected by the same "leave a review" action
    // that would otherwise just re-save it as visible again.
    if (existing?.status === "removed_by_moderator") {
      return NextResponse.json({ ok: false, error: "Your previous review on this course was removed and can't be resubmitted." }, { status: 403 });
    }

    const { author_name } = await resolveAuthorFields(supabase, member.id);

    if (existing) {
      // Covers both an already-visible review (plain edit) and one the
      // author themselves had self-deleted (deleted_by_author) - that's
      // the author's own prior choice, not moderation, so it's fine to
      // bring it back to visible with the new content.
      const { error: updateErr } = await supabase
        .from("course_reviews")
        .update({ rating, body, status: "visible" })
        .eq("id", existing.id);
      if (updateErr) {
        return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
      }
    } else {
      const { error: insertErr } = await supabase
        .from("course_reviews")
        .insert({ course_id: courseId, user_id: member.id, author_name, rating, body, status: "visible" });
      if (insertErr) {
        return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
