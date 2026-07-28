"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SkillToBusinessIntakeModal({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      skillOrBusiness: formData.get("skillOrBusiness"),
    };

    try {
      const res = await fetch("/api/skill-to-business/checkout", {
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
    <Modal open={open} onClose={onClose} title="Enroll in Skill to Business - $100">
      <p className="mb-4 text-sm text-muted-foreground">
        Tell us a bit about yourself. Once you pay, you get instant access to every premium
        business tool for a full year, and we&apos;ll reach out to schedule your Foundation Session
        and get your Starter Pack to you.
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
          {loading ? "Starting checkout..." : "Continue to payment - $100"}
        </button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>
    </Modal>
  );
}
