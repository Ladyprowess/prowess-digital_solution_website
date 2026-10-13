// Only send controlled labels, never form values, URLs with queries or customer data.
export function trackEvent(name: "assessment_start" | "assessment_complete" | "audience_select" | "service_enquiry" | "generate_lead" | "begin_checkout" | "checkout_error" | "sign_in_start", params: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  const analytics = window as Window & { gtag?: (...args: unknown[]) => void };
  try { analytics.gtag?.("event", name, params); } catch { /* Analytics must not block a journey. */ }
}
