// FILE: src/app/api/create-member/route.ts
//
// What this file does:
// When the admin fills in the Add Team Member form and clicks Create Account,
// this API route runs on the server. It uses a secret Supabase key
// to create a real login account for the new team member.
// It also sets their name, job title, role, and initials in the profiles table.
//
// You need to add one environment variable in Netlify:
// Key:   SUPABASE_SERVICE_ROLE_KEY
// Value: find this in Supabase → Project Settings → API → service_role (secret)

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { fullName, email, password, jobTitle, role } = await req.json();

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }

  // This uses the service role key which can create users server-side
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Step 1: Create the login account in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      job_title: jobTitle || "",
      role: role || "member",
    },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Step 2: Update their profile row with full details
  // (the trigger creates the row automatically, we just fill in the rest)
  const initials = fullName.trim().split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  await supabaseAdmin.from("profiles").update({
    full_name:       fullName,
    job_title:       jobTitle || null,
    role:            role || "member",
    avatar_initials: initials,
  }).eq("id", authData.user.id);

  return NextResponse.json({ success: true });
}
