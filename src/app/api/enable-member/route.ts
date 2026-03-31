import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { userId, reason } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID." }, { status: 400 });
    }
    if (!String(reason || "").trim()) {
      return NextResponse.json({ error: "Enable reason is required." }, { status: 400 });
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
      return NextResponse.json({ error: "Admin profiles cannot be enabled here." }, { status: 400 });
    }

    const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(userId);
    if (authUserError || !authUserData?.user) {
      return NextResponse.json({ error: authUserError?.message || "Auth user not found." }, { status: 404 });
    }

    const existingMeta = authUserData.user.user_metadata || {};
    const restoredRole =
      typeof existingMeta.previous_role === "string" &&
      existingMeta.previous_role !== "disabled" &&
      existingMeta.previous_role !== "admin"
        ? existingMeta.previous_role
        : "member";

    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: "none",
      user_metadata: {
        ...existingMeta,
        employment_status: "active",
        enabled_at: new Date().toISOString(),
        enabled_reason: String(reason).trim(),
        disabled_at: null,
        disabled_reason: null,
        role: restoredRole,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: restoredRole })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      role: restoredRole,
      enabledReason: String(reason).trim(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to enable profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
