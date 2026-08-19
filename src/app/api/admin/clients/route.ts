import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { genAccessCode, PREMIUM_TOOL_KEYS } from "@/lib/tools/tierAccess";
import { verifyAdminOrCron } from "@/lib/auth/verifyAdmin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function sanitiseAllowedTools(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  const valid = input.filter((t) => (PREMIUM_TOOL_KEYS as readonly string[]).includes(t));
  // Empty selection or "all" selected means full access - store as null.
  return valid.length > 0 && valid.length < PREMIUM_TOOL_KEYS.length ? valid : null;
}

// GET - list all clients
export async function GET(req: NextRequest) {
  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await supabase
    .from("client_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST - create client
export async function POST(req: NextRequest) {
  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { name, phone, email, business, notes, type, allowed_tools } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const now = Date.now();
  const oneYear = now + 365 * 24 * 60 * 60 * 1000;

  const { data, error } = await supabase
    .from("client_codes")
    .insert({
      code:          genAccessCode(),
      name:          name.trim(),
      phone:         phone?.trim()    || null,
      email:         email?.trim()    || null,
      business:      business?.trim() || null,
      notes:         notes?.trim()    || null,
      type:          type || "1year",
      status:        "active",
      created_at:    now,
      expires_at:    type === "forever" ? null : oneYear,
      allowed_tools: sanitiseAllowedTools(allowed_tools),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH - update client
export async function PATCH(req: NextRequest) {
  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { code, action } = await req.json();
  if (!code || !action) return NextResponse.json({ error: "Missing code or action" }, { status: 400 });

  const now = Date.now();
  const oneYear = now + 365 * 24 * 60 * 60 * 1000;

  const updates: Record<string, unknown> = {
    revoke:   { status: "revoked" },
    restore:  { status: "active" },
    extend:   { expires_at: oneYear, status: "active", type: "1year" },
    forever:  { type: "forever", expires_at: null, status: "active" },
    set1year: { type: "1year", expires_at: oneYear, status: "active" },
  }[action as string] ?? {};

  const { data, error } = await supabase
    .from("client_codes")
    .update(updates)
    .eq("code", code)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE - remove client
export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminOrCron(req);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const { error } = await supabase.from("client_codes").delete().eq("code", code);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
