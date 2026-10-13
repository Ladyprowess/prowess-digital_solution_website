import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify the code is valid before allowing data access
async function codeIsValid(code: string, tool: string): Promise<boolean> {
  const { data } = await supabase
    .from("client_codes")
    .select("status, type, expires_at, allowed_tools")
    .eq("code", code)
    .single();

  if (!data || data.status === "revoked") return false;
  if (data.type !== "forever" && data.expires_at && Date.now() > data.expires_at) return false;
  if (Array.isArray(data.allowed_tools) && data.allowed_tools.length > 0 && !data.allowed_tools.includes(tool)) return false;
  return true;
}

// GET /api/tools-data?code=PDS-XXXX&tool=calculator
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim().toUpperCase();
  const tool = searchParams.get("tool")?.trim();

  if (!code || !tool) return NextResponse.json({ error: "Missing params" }, { status: 400 });
  if (!(await codeIsValid(code, tool))) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data } = await supabase
    .from("client_tool_data")
    .select("data")
    .eq("code", code)
    .eq("tool", tool)
    .single();

  return NextResponse.json({ data: data?.data ?? null });
}

// POST /api/tools-data  { code, tool, data }
export async function POST(req: NextRequest) {
  const { code: rawCode, tool, data } = await req.json();
  const code = typeof rawCode === "string" ? rawCode.trim().toUpperCase() : "";

  if (!code || typeof tool !== "string" || !tool || !data) return NextResponse.json({ error: "Missing params" }, { status: 400 });
  if (!(await codeIsValid(code, tool))) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { error } = await supabase
    .from("client_tool_data")
    .upsert({ code, tool, data, updated_at: Date.now() }, { onConflict: "code,tool" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
