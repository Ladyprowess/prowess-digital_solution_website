import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs"; // important

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

export async function POST(req: Request) {
  try {
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { businessType, problem, details, result } = body || {};

    if (!businessType || !details || !result) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const payload = {
      business_type: String(businessType),
      problem: problem ? String(problem) : null,
      details: String(details),
      report: result, // jsonb
      user_agent: req.headers.get("user-agent") || null,
    };

    const { data, error } = await supabase
      .from("business_helper_reports")
      .insert([payload])
      .select("id")
      .single();

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      return NextResponse.json(
        { error: error.message, hint: error.hint, details: error.details },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: data.id });
  } catch (e: any) {
    console.error("SAVE ROUTE ERROR:", e);
    return NextResponse.json({ error: e?.message || "Failed to save." }, { status: 500 });
  }
}