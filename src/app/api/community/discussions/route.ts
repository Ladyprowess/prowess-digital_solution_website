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
    const lessonId = payload?.lessonId ?? null;
    const body = normalizeBody(payload?.body, 4000);

    if (!isUuid(courseId)) {
      return NextResponse.json({ ok: false, error: "Invalid course." }, { status: 400 });
    }
    if (lessonId !== null && !isUuid(lessonId)) {
      return NextResponse.json({ ok: false, error: "Invalid lesson." }, { status: 400 });
    }
    if (body === null) {
      return NextResponse.json({ ok: false, error: "Post text must be 1-4000 characters." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { entitled, reason } = await hasEntitlement("course", courseId, { userId: member.id, email: member.email });
    if (reason === "not_found") {
      return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    }
    if (!entitled) {
      return NextResponse.json({ ok: false, error: "This content is premium. Purchase or sign in to access it.", premium: true }, { status: 403 });
    }

    // course_lessons has no course_id of its own - must re-verify a
    // client-supplied lessonId genuinely belongs to this course via
    // course_modules, same two-step check evaluate-completion/route.ts
    // already established for this exact shape.
    if (lessonId) {
      const { data: modules } = await supabase.from("course_modules").select("id").eq("course_id", courseId);
      const moduleIds = (modules || []).map((m) => m.id);
      const { data: lesson } = moduleIds.length
        ? await supabase.from("course_lessons").select("id").eq("id", lessonId).in("module_id", moduleIds).maybeSingle()
        : { data: null };
      if (!lesson) {
        return NextResponse.json({ ok: false, error: "This lesson doesn't belong to that course." }, { status: 400 });
      }
    }

    const { author_name, author_avatar_url } = await resolveAuthorFields(supabase, member.id);

    const { error: insertErr } = await supabase.from("discussion_posts").insert({
      course_id: courseId,
      lesson_id: lessonId,
      user_id: member.id,
      author_name,
      author_avatar_url,
      body,
      status: "visible",
    });
    if (insertErr) {
      return NextResponse.json({ ok: false, error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
