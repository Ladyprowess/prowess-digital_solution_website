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
  const tables = [
    "purchases",
    "business_service_orders",
    "membership_subscriptions",
    "skill_to_business_purchases",
    "consultation_bookings",
    "event_registrations",
  ];
  const results = await Promise.all(tables.map((table) => supabase
    .from(table)
    .update({ user_id: member.id })
    .eq("email", member.email.toLowerCase())
    .is("user_id", null)));
  const failed = results.find((result) => result.error);
  if (failed?.error) return NextResponse.json({ ok: false, error: failed.error.message }, { status: 500 });

  return NextResponse.json({ ok: true, claimed: tables.length });
}
