import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyMember } from "@/lib/auth/verifyMember";

export const runtime = "nodejs";

// Associates any guest-checkout purchases made with this email (before the
// buyer had an account) with their now-authenticated user id. Called on
// every login/dashboard load - safe to call repeatedly, it only ever
// touches rows that still have user_id null.
export async function POST(req: Request) {
  const member = await verifyMember(req);
  if (!member) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("purchases")
    .update({ user_id: member.id })
    .eq("email", member.email)
    .is("user_id", null);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
