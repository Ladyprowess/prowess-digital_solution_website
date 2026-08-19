import { createClient } from "@supabase/supabase-js";

// Verifies a member's own Supabase access token server-side (never trusts a
// client-supplied user id/email directly) - used by the /api/account/*
// routes that touch `purchases`, which has no client-readable/writable RLS
// policy at all (see accounts_schema.sql: a policy readable by email would
// let anyone look up anyone else's purchase history by guessing an
// address). This is the one legitimate way to identify the caller and then
// use the service role to act on their behalf.
export async function verifyMember(req: Request): Promise<{ id: string; email: string } | null> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const anon = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await anon.auth.getUser(token);
  if (error || !data?.user?.email) return null;

  return { id: data.user.id, email: data.user.email };
}
