import { supabaseAdmin } from "@/lib/supabase/admin";

// One flat price that unlocks every Premium feature site-wide, admin-edited
// from /admin/settings (site_settings is a singleton table - id is always
// 1) rather than hardcoded in src/content/site.ts. site_settings already
// has a public_read RLS policy, so the /account/membership upgrade page can
// read these same columns directly via the browser client to show pricing
// before checkout - this server-side helper is for the checkout route,
// which needs to resolve the real amount to charge without trusting
// anything the client sends.
export type PremiumMembershipPricing = {
  monthlyUsd: number | null;
  monthlyNgn: number | null;
  annualUsd: number | null;
  annualNgn: number | null;
};

export async function getPremiumMembershipPricing(): Promise<PremiumMembershipPricing> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("site_settings")
    .select("premium_membership_monthly_usd, premium_membership_monthly_ngn, premium_membership_annual_usd, premium_membership_annual_ngn")
    .eq("id", 1)
    .maybeSingle();

  return {
    monthlyUsd: data?.premium_membership_monthly_usd ?? null,
    monthlyNgn: data?.premium_membership_monthly_ngn ?? null,
    annualUsd: data?.premium_membership_annual_usd ?? null,
    annualNgn: data?.premium_membership_annual_ngn ?? null,
  };
}
