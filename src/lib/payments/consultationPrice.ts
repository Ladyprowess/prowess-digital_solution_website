export function consultationPrice(service: { price_usd: number | null; price_ngn: number | null }, requested: "USD" | "NGN" | null) {
  const currency = requested ?? (service.price_usd != null ? "USD" : "NGN");
  const configured = currency === "USD" ? service.price_usd : service.price_ngn;
  if (configured == null || !Number.isFinite(Number(configured)) || Number(configured) < 0) return null;
  return { currency, amount: Number(configured) };
}
