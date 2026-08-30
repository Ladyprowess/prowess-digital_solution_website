"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSignedIn } from "@/lib/useSignedIn";
import { formatMoney } from "@/lib/formatMoney";
import { CurrencyToggle } from "@/components/CurrencyToggle";

export type FormatPrice = { usd: number | null; ngn: number | null };
export type EbookFormatPrices = { read: FormatPrice; download: FormatPrice; hardcopy: FormatPrice };
export type EbookFormat = "read" | "download" | "hardcopy";

const FORMAT_INFO: Record<EbookFormat, { label: string; includes: string; excludes: string }> = {
  read: { label: "Read Online", includes: "Read inside Prowess Digital Solutions", excludes: "No PDF download" },
  download: { label: "Download", includes: "Download the PDF", excludes: "No online reader access" },
  hardcopy: { label: "Hard Copy", includes: "Physical printed book", excludes: "Delivery/shipping required" },
};

// Exported for ResourceBody's "You own: Read Online · Download" summary
// line, so the label wording stays in one place.
export const FORMAT_LABELS: Record<EbookFormat, string> = {
  read: FORMAT_INFO.read.label,
  download: FORMAT_INFO.download.label,
  hardcopy: FORMAT_INFO.hardcopy.label,
};

function defaultCurrencyFor(price: FormatPrice): "USD" | "NGN" {
  return price.usd ? "USD" : "NGN";
}

// The purchase UI for a format-priced ebook, shown instead of BuyButton.
// Selecting a format is the first step; the currency toggle then applies
// only to that one format's own price, not one toggle covering all three -
// confirmed on review. Each card states what that specific purchase
// includes and excludes, not just a price, since the three formats are
// genuinely different products, not tiers of the same thing.
export function EbookPurchasePicker({
  resourceId,
  formatPrices,
  ownedFormats = [],
}: {
  resourceId: string;
  formatPrices: EbookFormatPrices;
  ownedFormats?: EbookFormat[];
}) {
  const pathname = usePathname();
  const { signedIn, checking: checkingSession } = useSignedIn();

  const availableFormats = (Object.keys(FORMAT_INFO) as EbookFormat[]).filter(
    (key) => (formatPrices[key].usd || formatPrices[key].ngn) && !ownedFormats.includes(key)
  );

  const [selected, setSelected] = useState<EbookFormat | null>(availableFormats[0] ?? null);
  const [currency, setCurrency] = useState<"USD" | "NGN">(
    availableFormats[0] ? defaultCurrencyFor(formatPrices[availableFormats[0]]) : "USD"
  );
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function selectFormat(key: EbookFormat) {
    setSelected(key);
    setCurrency(defaultCurrencyFor(formatPrices[key]));
    setErr("");
  }

  async function buy() {
    if (!selected) return;
    setErr("");

    if (selected === "hardcopy" && (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim())) {
      setErr("Please fill in your delivery details.");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setErr("Please sign in to continue."); setLoading(false); return; }

      const res = await fetch("/api/content/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          itemType: "resource",
          itemId: resourceId,
          currency,
          format: selected,
          ...(selected === "hardcopy"
            ? { shipping: { fullName: shippingName.trim(), phone: shippingPhone.trim(), address: shippingAddress.trim() } }
            : {}),
        }),
      });
      const data = await res.json();
      if (!data.ok || !data.authorizationUrl) {
        setErr(data.error || "Could not start checkout.");
        setLoading(false);
        return;
      }
      window.location.href = data.authorizationUrl;
    } catch {
      setErr("Something went wrong.");
      setLoading(false);
    }
  }

  if (availableFormats.length === 0) return null;

  if (checkingSession) {
    return <div className="mt-6 h-40 w-full animate-pulse rounded-2xl bg-muted" />;
  }

  return (
    <div className="mt-6 rounded-2xl border-2 border-primary/20 bg-muted p-6">
      <h2 className="text-lg font-bold text-foreground">Choose how you want this ebook</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {availableFormats.map((key) => {
          const info = FORMAT_INFO[key];
          const price = formatPrices[key];
          const isSelected = selected === key;
          const displayCurrency = isSelected ? currency : defaultCurrencyFor(price);
          const amount = displayCurrency === "USD" ? price.usd : price.ngn;

          return (
            <button
              key={key}
              type="button"
              onClick={() => selectFormat(key)}
              className={`rounded-xl border p-4 text-left transition ${
                isSelected ? "border-primary bg-card shadow-sm" : "border-border bg-card/60 hover:border-primary/40"
              }`}
            >
              <p className="text-sm font-bold text-foreground">{info.label}</p>
              <p className="mt-1 text-xl font-bold text-primary">{amount ? formatMoney(amount, displayCurrency) : "—"}</p>
              <p className="mt-2 text-xs text-muted-foreground">{info.includes}</p>
              <p className="text-xs text-muted-foreground">{info.excludes}</p>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-5 space-y-4">
          {formatPrices[selected].usd && formatPrices[selected].ngn && (
            <div className="flex justify-center">
              <CurrencyToggle value={currency} onChange={setCurrency} />
            </div>
          )}

          {selected === "hardcopy" && (
            <div className="grid gap-3 rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Delivery details</p>
              <input
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
              />
              <input
                value={shippingPhone}
                onChange={(e) => setShippingPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
              />
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Delivery address"
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground"
              />
            </div>
          )}

          {!signedIn ? (
            <Link
              href={`/account/login?redirect=${encodeURIComponent(pathname)}`}
              className="block w-full rounded-xl bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Sign in to buy
            </Link>
          ) : (
            <button
              type="button"
              onClick={buy}
              disabled={loading}
              className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Starting checkout…" : `Buy ${FORMAT_INFO[selected].label}`}
            </button>
          )}

          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
      )}
    </div>
  );
}
