"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Modal from "@/components/Modal";
import { supabase } from "@/lib/supabase";
import { useSignedIn } from "@/lib/useSignedIn";
import { formatMoney } from "@/lib/formatMoney";
import { CurrencyToggle } from "@/components/CurrencyToggle";
import { SKILL_TO_BUSINESS_PRICE_USD, SKILL_TO_BUSINESS_PRICE_NGN } from "@/lib/skillToBusinessPricing";

type Props = {
  open: boolean;
  onClose: () => void;
};

const BOTH_CURRENCIES_AVAILABLE = SKILL_TO_BUSINESS_PRICE_NGN != null;

export default function SkillToBusinessIntakeModal({ open, onClose }: Props) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<"USD" | "NGN">("USD");
  // Subscribes to real auth-state changes, not just a one-shot check tied
  // to `open` - catches a user who signs in from a different tab without
  // closing this modal, which a plain re-check-on-open never would (open
  // itself never changes value in that case).
  const { signedIn, checking: checkingSession } = useSignedIn();

  const amount = currency === "USD" ? SKILL_TO_BUSINESS_PRICE_USD : (SKILL_TO_BUSINESS_PRICE_NGN as number);
  const priceLabel = formatMoney(amount, currency);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Please sign in to continue."); setLoading(false); return; }

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      skillOrBusiness: formData.get("skillOrBusiness"),
      currency,
    };

    try {
      const res = await fetch("/api/skill-to-business/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Could not start checkout. Please try again.");
        setLoading(false);
        return;
      }

      window.location.href = data.authorizationUrl;
    } catch {
      setError("Could not start checkout. Please try again.");
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <Modal open={open} onClose={onClose} title={`Enroll in Skill to Business - ${priceLabel}`}>
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </Modal>
    );
  }

  if (!signedIn) {
    return (
      <Modal open={open} onClose={onClose} title={`Enroll in Skill to Business - ${priceLabel}`}>
        <p className="mb-4 text-sm text-muted-foreground">You need to sign in first to enroll and pay.</p>
        <Link
          href={`/account/login?redirect=${encodeURIComponent(pathname)}`}
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Sign in to continue
        </Link>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={`Enroll in Skill to Business - ${priceLabel}`}>
      <p className="mb-4 text-sm text-muted-foreground">
        Tell us a bit about yourself. Once you pay, you get instant access to every premium
        business tool for a full year, and we&apos;ll reach out to schedule your Foundation Session
        and get your Starter Pack to you.
      </p>

      {BOTH_CURRENCIES_AVAILABLE && (
        <div className="mb-4 flex justify-center">
          <CurrencyToggle value={currency} onChange={setCurrency} />
        </div>
      )}

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Full name</label>
            <input
              name="fullName"
              required
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
              placeholder="you@email.com"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Phone (optional)</label>
          <input
            name="phone"
            className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
            placeholder="For WhatsApp or a call"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">What is your skill or business?</label>
          <textarea
            name="skillOrBusiness"
            required
            rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
            placeholder="e.g. hairdressing, tailoring, photography, tech/web design..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Starting checkout..." : `Continue to payment - ${priceLabel}`}
        </button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </Modal>
  );
}
