// Which of the 5 premium tools each membership tier unlocks, derived from
// the deliverables listed in `packages` (src/content/site.ts). Free tools
// (business-helper, business-health-check, business-structure,
// customer-support) are never gated and are not part of this map.

export const PREMIUM_TOOL_KEYS = [
  "calculator",
  "tracker",
  "invoice",
  "inventory",
  "reach",
] as const;

export type PremiumToolKey = (typeof PREMIUM_TOOL_KEYS)[number];

export const PREMIUM_TOOL_NAMES: Record<PremiumToolKey, string> = {
  calculator: "Startup Cost & Break-Even Calculator",
  tracker: "Profit & Cashflow Tracker",
  invoice: "Invoice Manager",
  inventory: "Inventory Manager",
  reach: "Reach & Growth Planner",
};

// The tier a client must be on for a given tool to be included at all -
// used to label tools on the /tools listing page ("From Diagnostic", etc).
export const TOOL_MIN_TIER: Record<PremiumToolKey, string> = {
  calculator: "Diagnostic",
  tracker: "Diagnostic",
  invoice: "Foundation",
  inventory: "Growth",
  reach: "Growth",
};

export const TIER_TOOLS: Record<string, PremiumToolKey[]> = {
  diagnostic: ["calculator", "tracker"],
  foundation: ["calculator", "tracker", "invoice"],
  growth: ["calculator", "tracker", "invoice", "inventory", "reach"],
  "full-support": ["calculator", "tracker", "invoice", "inventory", "reach"],
};

export function toolsForPlan(planSlug: string): PremiumToolKey[] {
  return TIER_TOOLS[planSlug] ?? [];
}

export function genAccessCode(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PDS-${part()}-${part()}`;
}
