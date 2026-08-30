"use client";

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

// Shared by every content type that can be free or premium (courses,
// resources, career paths) so pricing behaves identically everywhere and a
// change here doesn't need to be repeated per admin page.
//
// Two price fields, not one - the customer picks USD or Naira at checkout,
// so both need a real price set by the admin. Either can be left blank (an
// item priced in only one currency just won't show a currency toggle to the
// customer), but at least one is required for a premium item.
export function AccessPriceFields({
  access,
  onAccessChange,
  priceUsd,
  onPriceUsdChange,
  priceNgn,
  onPriceNgnChange,
}: {
  access: "free" | "premium";
  onAccessChange: (v: "free" | "premium") => void;
  priceUsd: string;
  onPriceUsdChange: (v: string) => void;
  priceNgn: string;
  onPriceNgnChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Field label="Access">
        <select value={access} onChange={(e) => onAccessChange(e.target.value as "free" | "premium")} className={inputCls}>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
      </Field>
      {access === "premium" && (
        <>
          <Field label="Price (USD)">
            <input value={priceUsd} onChange={(e) => onPriceUsdChange(e.target.value)} className={inputCls} type="number" placeholder="e.g. 10" />
          </Field>
          <Field label="Price (NGN)">
            <input value={priceNgn} onChange={(e) => onPriceNgnChange(e.target.value)} className={inputCls} type="number" placeholder="e.g. 15000" />
          </Field>
        </>
      )}
    </div>
  );
}
