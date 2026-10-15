"use client";

import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { defaultServicePrices } from "@/content/servicePages";
import { formatMoney } from "@/lib/formatMoney";
import { supabase } from "@/lib/supabase";
import s from "./ServiceOfferPage.module.css";

const serviceCopy: Record<string, { heading: string; question: string; placeholder: string }> = {
  "business-audit": {
    heading: "Tell us what needs an independent review.",
    question: "Which controls, records or business activities concern you most?",
    placeholder: "Describe the area to review, the problem you have noticed, the records available and any deadline or decision connected to the audit.",
  },
  "business-model": {
    heading: "Tell us where the business logic is still unclear.",
    question: "Which part of the model needs the most work?",
    placeholder: "Describe the customer, offer, delivery approach and how you expect the business to earn. Include the assumptions you are least certain about.",
  },
  "business-structure-diagnostic": {
    heading: "Tell us what keeps going wrong in the business.",
    question: "What problems keep returning, and what have you already tried?",
    placeholder: "Describe the repeated problems, where they affect the business, what you have tried and what you need to improve.",
  },
  "financial-review": {
    heading: "Tell us which numbers you need to understand.",
    question: "What do you track now, and where do the numbers stop making sense?",
    placeholder: "Describe your sales, costs, cash tracking and the financial decisions you need to make.",
  },
  sops: {
    heading: "Tell us which processes need to work without you.",
    question: "Which workflows create repeated questions, delays or inconsistent handovers?",
    placeholder: "Describe the processes, the people involved and where the work currently slows down or breaks.",
  },
  "pricing-offer-review": {
    heading: "Tell us what customers struggle to understand or buy.",
    question: "Describe your offer, current price and where customers hesitate.",
    placeholder: "Tell us what you sell, who buys it, what you charge and the objections or sales problems you encounter.",
  },
  "workflow-systems": {
    heading: "Tell us where work keeps getting stuck.",
    question: "Which workflow causes the most delay, confusion or repeated follow-up?",
    placeholder: "Describe how the work starts, who handles it, the tools you use, where it waits or breaks, and the effect on customers or the team.",
  },
};

export default function ServiceCheckout({ slug, title }: { slug: string; title: string }) {
  const fallback = defaultServicePrices[slug];
  const copy = serviceCopy[slug] ?? {
    heading: "Tell us what you need.",
    question: "What do you need this service to help you achieve?",
    placeholder: "Describe the business, the current situation, the decision you need to make and any deadline.",
  };
  const [prices, setPrices] = useState(fallback);
  const [currency, setCurrency] = useState<"USD" | "NGN">("NGN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/business-services/${slug}`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setPrices({ usd: Number(data.service.price_usd), ngn: Number(data.service.price_ngn) }))
      .catch(() => {});
  }, [slug]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/business-services/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ serviceSlug: slug, currency, fullName: data.get("fullName"), email: data.get("email"), phone: data.get("phone"), businessName: data.get("businessName"), brief: data.get("brief") }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not start payment.");
      window.location.href = result.authorizationUrl;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not start payment.");
      setLoading(false);
    }
  }

  const amount = currency === "NGN" ? prices.ngn : prices.usd;
  return <section id="service-checkout" className={s.checkout}>
    <div className={s.checkoutIntro} data-checkout-intro>
      <p className={s.eyebrow}>Start {title}</p>
      <h2>{copy.heading}</h2>
      <p>Complete the brief and make the one-time payment. Your confirmation and a copy of your request will be emailed to you.</p>
      <div className={s.currency} role="group" aria-label="Payment currency">
        <button type="button" aria-pressed={currency === "NGN"} onClick={() => setCurrency("NGN")}>NGN</button>
        <button type="button" aria-pressed={currency === "USD"} onClick={() => setCurrency("USD")}>USD</button>
      </div>
      <strong className={s.checkoutPrice}>{formatMoney(amount, currency)}</strong>
      <small>One-time service payment</small>
    </div>
    <form onSubmit={submit} className={s.checkoutForm} data-checkout-form>
      <div className={s.formPair}>
        <label>Full name<input name="fullName" autoComplete="name" required /></label>
        <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      </div>
      <div className={s.formPair}>
        <label>Phone<input name="phone" type="tel" autoComplete="tel" /></label>
        <label>Business name<input name="businessName" autoComplete="organization" /></label>
      </div>
      <label>{copy.question}<textarea name="brief" required minLength={20} rows={6} placeholder={copy.placeholder} /></label>
      {error && <p className={s.formError} role="alert">{error}</p>}
      <button type="submit" className={s.payButton} disabled={loading}><span>{loading ? "Preparing secure payment" : `Pay ${formatMoney(amount, currency)}`}</span><ArrowRight aria-hidden="true" /></button>
      <p className={s.secure}><LockKeyhole size={15} aria-hidden="true" />Payment is completed securely on Flutterwave.</p>
    </form>
  </section>;
}
