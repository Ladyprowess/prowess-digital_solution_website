import { supabaseAdmin } from "@/lib/supabase/admin";
import { randomBytes } from "node:crypto";

// Unique payment_key makes granting access retryable even if marking the order paid fails.
export async function ensureToolGrant(paymentKey: string, fields: Record<string, unknown>) {
  const supabase = supabaseAdmin();
  const code = `PDS-${randomBytes(12).toString("hex").toUpperCase()}`;
  const { error } = await supabase.from("client_codes").upsert({ ...fields, code, payment_key: paymentKey },
    { onConflict: "payment_key", ignoreDuplicates: true });
  if (error) throw new Error("Could not grant tools access");
  const { data, error: readError } = await supabase.from("client_codes").select("code")
    .eq("payment_key", paymentKey).single();
  if (readError || !data?.code) throw new Error("Could not retrieve tools access");
  return String(data.code);
}
