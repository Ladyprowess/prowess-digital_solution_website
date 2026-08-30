// Single source of truth for the Skill to Business price, shared by the
// checkout route and the client-side UI (modal + landing page) - no server
// secrets in this file, safe to import from client components, unlike
// src/lib/payments/skillToBusiness.ts which pulls in supabaseAdmin/resend.
export const SKILL_TO_BUSINESS_PRICE_USD = 100;

export const SKILL_TO_BUSINESS_PRICE_NGN: number | null = 138000; // 100 * 1380
