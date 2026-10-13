import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { code, tool } = await req.json();
  if (typeof code !== "string" || !code.trim() || (tool != null && typeof tool !== "string")) return NextResponse.json({ valid: false, reason: "invalid" });

  const { data, error } = await supabase
    .from("client_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (error || !data) return NextResponse.json({ valid: false, reason: "invalid" });
  if (data.status === "revoked") return NextResponse.json({ valid: false, reason: "revoked" });
  if (data.type !== "forever" && data.expires_at && Date.now() > data.expires_at)
    return NextResponse.json({ valid: false, reason: "expired" });

  // Null/empty allowed_tools means full access (legacy codes and admin-
  // created codes with every tool checked) - only reject when the list is
  // non-empty and specifically excludes the tool being requested.
  if (
    tool &&
    Array.isArray(data.allowed_tools) &&
    data.allowed_tools.length > 0 &&
    !data.allowed_tools.includes(tool)
  ) {
    return NextResponse.json({ valid: false, reason: "not_included" });
  }

  return NextResponse.json({
    valid: true,
    client: {
      name: data.name,
      business: data.business,
      type: data.type,
      expires_at: data.expires_at,
    },
  });
}
