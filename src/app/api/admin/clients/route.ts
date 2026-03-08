import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function checkAuth(req: NextRequest): boolean {
  return req.headers.get("x-admin-token") === process.env.ADMIN_PIN;
}

function genCode(): string {
  const p = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PDS-${p()}-${p()}`;
}

// GET — list all clients
export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { data, error } = await supabase
    .from("client_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — create client
export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { name, phone, email, business, notes, type } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const now = Date.now();
  const oneYear = now + 365 * 24 * 60 * 60 * 1000;

  const { data, error } = await supabase
    .from("client_codes")
    .insert({
      code:       genCode(),
      name:       name.trim(),
      phone:      phone?.trim()    || null,
      email:      email?.trim()    || null,
      business:   business?.trim() || null,
      notes:      notes?.trim()    || null,
      type:       type || "1year",
      status:     "active",
      created_at: now,
      expires_at: type === "forever" ? null : oneYear,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH — update client
export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

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

// DELETE — remove client
export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const { error } = await supabase.from("client_codes").delete().eq("code", code);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
