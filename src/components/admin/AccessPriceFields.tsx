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
export function AccessPriceFields({
  access,
  onAccessChange,
  price,
  onPriceChange,
  currency,
  onCurrencyChange,
}: {
  access: "free" | "premium";
  onAccessChange: (v: "free" | "premium") => void;
  price: string;
  onPriceChange: (v: string) => void;
  currency: string;
  onCurrencyChange: (v: string) => void;
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
          <Field label="Price">
            <input value={price} onChange={(e) => onPriceChange(e.target.value)} className={inputCls} type="number" placeholder="e.g. 5000" />
          </Field>
          <Field label="Currency">
            <input value={currency} onChange={(e) => onCurrencyChange(e.target.value)} className={inputCls} placeholder="USD" />
          </Field>
        </>
      )}
    </div>
  );
}
