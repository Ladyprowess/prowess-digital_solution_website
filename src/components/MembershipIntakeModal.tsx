"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import type { BillingInterval } from "@/lib/payments/flutterwave";

type Plan = {
  slug: string;
  title: string;
  monthlyPrice: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  plan: Plan | null;
  interval: BillingInterval;
  displayPrice: string; // e.g. "$320/mo" or "$3,072/yr" - already formatted by the caller
};

export default function MembershipIntakeModal({ open, onClose, plan, interval, displayPrice }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!plan) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      planSlug: plan!.slug,
      interval,
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      businessName: formData.get("businessName"),
      website: formData.get("website"),
      businessDescription: formData.get("businessDescription"),
      serviceFocus: formData.get("serviceFocus"),
    };

    try {
      const res = await fetch("/api/memberships/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return (
    <Modal open={open} onClose={onClose} title={`${plan.title} - ${displayPrice}`}>
      <p className="mb-4 text-sm text-muted-foreground">
        Tell us about your business first. Once you pay, we will use these details to reach out
        to you directly within 24 hours and get started.
      </p>

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
              placeholder="you@business.com"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Phone (optional)</label>
            <input
              name="phone"
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
              placeholder="For WhatsApp or a call"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Website (optional)</label>
            <input
              name="website"
              className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
              placeholder="yourbusiness.com"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Business name</label>
          <input
            name="businessName"
            required
            className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
            placeholder="Your business name"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">What does your business do?</label>
          <textarea
            name="businessDescription"
            required
            rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
            placeholder="A short description of what you sell and who you sell it to"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">What specifically do you want us to look at or deliver?</label>
          <textarea
            name="serviceFocus"
            required
            rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
            placeholder="e.g. our onboarding process is a mess, or we have no idea if our pricing is profitable"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Starting checkout..." : `Continue to payment - ${displayPrice}`}
        </button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </Modal>
  );
}
