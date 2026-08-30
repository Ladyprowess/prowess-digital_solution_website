const SYMBOLS: Record<"USD" | "NGN", string> = { USD: "$", NGN: "₦" };

// Every payment flow on the site formats a price slightly differently today
// (some with a currency code, some with cents forced on, some without) -
// this is the one shared formatter the dual-currency rollout uses instead,
// so USD and NGN always read the same way everywhere.
export function formatMoney(amount: number, currency: "USD" | "NGN") {
  const symbol = SYMBOLS[currency] ?? "";
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
