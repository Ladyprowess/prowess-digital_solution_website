import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Two legitimate callers for the jobs importer: an external cron scheduler
// (Authorization: Bearer <CRON_IMPORT_SECRET>, server-to-server only, never
// sent to a browser) or a signed-in admin clicking "Import now" in
// /admin/work (Authorization: Bearer <their own Supabase access token>).
// Mirrors verifyMember.ts's token-verification pattern, plus the role check
// admin-gated pages already do client-side via useRequireAdmin.
export async function verifyAdminOrCron(req: Request): Promise<{ ok: true; via: "cron" | "admin" } | { ok: false }> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return { ok: false };

  const cronSecret = process.env.CRON_IMPORT_SECRET;
  if (cronSecret && token === cronSecret) return { ok: true, via: "cron" };

  const anon = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data?.user) return { ok: false };

  const admin = supabaseAdmin();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", data.user.id).single();
  if (profile?.role !== "admin") return { ok: false };

  return { ok: true, via: "admin" };
}
