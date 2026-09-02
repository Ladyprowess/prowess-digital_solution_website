import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";
import { hasPremiumAccess } from "@/lib/payments/premiumMembership";

export const runtime = "nodejs";

// Interview Prep is a static, admin-authored question library - no AI, no
// submissions. Gated by Premium. Content only ever reaches the
// client through this route (service-role read, entitlement checked
// first) - interview_questions has no public RLS policy at all.
export async function GET(req: Request) {
  const member = await verifyMember(req);
  if (!member) {
    return NextResponse.json({ ok: false, error: "Please sign in to continue." }, { status: 401 });
  }

  const hasAccess = await hasPremiumAccess({ userId: member.id, email: member.email });
  if (!hasAccess) {
    return NextResponse.json({ ok: false, error: "Activate Premium to open Interview Prep.", locked: true }, { status: 403 });
  }

  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("interview_questions")
    .select("id, role_category, question, answer_tips, difficulty, position")
    .eq("status", "published")
    .order("role_category")
    .order("position");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, questions: data || [] });
}
