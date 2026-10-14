import { supabaseAdmin } from "@/lib/supabase/admin";

/** Keep charge ordering, subscription state and tool grants in one transaction. */
export async function reconcileRecurring(
  kind: "membership" | "premium_membership",
  id: string,
  outcome: "paid" | "failed" | "cancelled",
  reference?: string,
  occurredAt?: string,
  tools: string[] = [],
) {
  const { data, error } = await supabaseAdmin().rpc("reconcile_subscription_event", {
    p_kind: kind,
    p_id: id,
    p_outcome: outcome,
    p_reference: reference ?? null,
    p_occurred_at: occurredAt ?? null,
    p_tools: tools,
  });
  if (error || !data) throw new Error("Subscription reconciliation failed");
  return data as { changed: boolean; initial?: boolean; code?: string };
}
