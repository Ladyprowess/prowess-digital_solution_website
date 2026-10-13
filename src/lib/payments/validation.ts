/** Match a provider-verified charge to its server-created order. */
export function matchesPayment(data: Record<string, unknown> & { status?: string; tx_ref?: string; meta?: Record<string, unknown>; customer?: { email?: string } } | undefined, expected: {
  reference: string; type: string; idKey: string; id: string;
  amount: unknown; currency: string; email: string; storedReference?: string | null;
}) {
  const amount = Number(expected.amount);
  const paid = Number(data?.amount);
  return Boolean(data && data.status === "successful"
    && data.tx_ref === expected.reference
    && (!expected.storedReference || expected.storedReference === expected.reference)
    && data.meta?.type === expected.type
    && String(data.meta?.[expected.idKey] || "") === String(expected.id)
    && expected.amount != null && Number.isFinite(amount) && amount > 0
    && Number.isFinite(paid) && Math.round(paid * 100) === Math.round(amount * 100)
    && String(data.currency || "").toUpperCase() === expected.currency.toUpperCase()
    && String(data.customer?.email || "").trim().toLowerCase() === expected.email.trim().toLowerCase());
}

export function paymentPrice(usd: unknown, ngn: unknown, requested: unknown) {
  if (requested != null && requested !== "" && requested !== "USD" && requested !== "NGN") return null;
  const valid = (value: unknown) => value != null && Number.isFinite(Number(value)) && Number(value) > 0;
  const currency = requested === "USD" || requested === "NGN" ? requested : valid(usd) ? "USD" : "NGN";
  const raw = currency === "USD" ? usd : ngn;
  return valid(raw) ? { currency, amount: Number(raw) } as const : null;
}
