import { NextResponse } from "next/server";
import { verifyMember } from "@/lib/auth/verifyMember";
import { hasEntitlement } from "@/lib/payments/entitlement";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isUuid, normalizeBody } from "@/lib/community/validate";
import { resolveAuthorFields } from "@/lib/community/author";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const { postId } = await params;
    const member = await verifyMember(req);
    if (!member) {
      return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
    }
    if (!isUuid(postId)) {
      return NextResponse.json({ ok: false, error: "Invalid post." }, { status: 400 });
    }

    const payload = await req.json().catch(() => ({}));
    const body = normalizeBody(payload?.body, 2000);
    if (body === null) {
      return NextResponse.json({ ok: false, error: "Reply text must be 1-2000 characters." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { data: post } = await supabase
      .from("discussion_posts")
      .select("id, course_id, status")
      .eq("id", postId)
      .maybeSingle();
    if (!post || post.status !== "visible") {
      return NextResponse.json({ ok: false, error: "This post is no longer available." }, { status: 404 });
    }

    const { entitled, reason } = await hasEntitlement("course", post.course_id, { userId: member.id, email: member.email });
    if (reason === "not_found") {
      return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
    }
    if (!entitled) {
      return NextResponse.json({ ok: false, error: "This content is premium. Purchase or sign in to access it.", premium: true }, { status: 403 });
    }

    const { author_name, author_avatar_url } = await resolveAuthorFields(supabase, member.id);

    const { error: insertErr } = await supabase.from("discussion_replies").insert({
      post_id: postId,
      course_id: post.course_id,
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
