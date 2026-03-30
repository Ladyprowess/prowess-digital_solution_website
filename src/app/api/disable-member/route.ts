import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID." }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id,role")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    if (profile.role === "admin") {
      return NextResponse.json({ error: "Admin profiles cannot be disabled here." }, { status: 400 });
    }

    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: "876000h",
      user_metadata: {
        employment_status: "disabled",
        disabled_at: new Date().toISOString(),
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        role: "disabled",
        managed_by: null,
        earns_commission: false,
      })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to disable profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
