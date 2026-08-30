"use client";

// Same pill-toggle look as the Monthly/Yearly switch on /pricing, reused
// everywhere a customer needs to pick which currency they're paying in -
// content checkout, events, memberships, consultations, skill-to-business -
// instead of five separately hand-rolled toggles.
export function CurrencyToggle({
  value,
  onChange,
  className,
}: {
  value: "USD" | "NGN";
  onChange: (v: "USD" | "NGN") => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 ${className || ""}`}>
      {(["USD", "NGN"] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            value === c ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
