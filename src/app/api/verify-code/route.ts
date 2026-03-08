import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ valid: false, reason: "invalid" });

  const { data, error } = await supabase
    .from("client_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (error || !data) return NextResponse.json({ valid: false, reason: "invalid" });
  if (data.status === "revoked") return NextResponse.json({ valid: false, reason: "revoked" });
  if (data.type !== "forever" && data.expires_at && Date.now() > data.expires_at)
    return NextResponse.json({ valid: false, reason: "expired" });

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
