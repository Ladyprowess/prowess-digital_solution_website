"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Service } from "@/content/site";
import Container from "@/components/Container";
import { trackEvent } from "@/lib/analytics";
import { healthQuestions, scoreHealth } from "@/lib/businessHealth";

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const button = `inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 ${focus}`;
const input = `mt-2 w-full rounded-lg border border-border bg-background p-3 text-foreground ${focus}`;
const tracking = { source: "business_diagnostic", offer: "business-structure-diagnostic" };

export default function DiagnosticLanding({ service }: { service: Service }) {
  const [answers, setAnswers] = useState<number[]>(Array(healthQuestions.length).fill(-1));
  const [result, setResult] = useState<ReturnType<typeof scoreHealth>>(null);
  const started = useRef(false);
  const completed = useRef(false);
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function assess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = scoreHealth(answers);
    if (!next) return;
    setResult(next);
    if (!completed.current) {
      completed.current = true;
      trackEvent("assessment_complete", tracking);
    }
  }

  async function enquire(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || sent) return;
    const data = new FormData(event.currentTarget);
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: data.get("full_name"), email: data.get("email"), phone: data.get("phone"),
          business_stage: data.get("business_stage"), company_site: data.get("company_site"),
          inquiry_type: service.title, source: "business_diagnostic",
          message: `Business: ${data.get("business")}\n\nCurrent challenges: ${data.get("challenges")}\n\nGoals: ${data.get("goals")}`,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || body?.ok !== true) throw new Error("Your enquiry could not be confirmed. Your details are still here. Please try submitting again.");
      setSent(true);
      if (!data.get("company_site")) trackEvent("generate_lead", tracking);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to send. Please try again.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return <div className="bg-background text-foreground">
    <section className="border-b border-border bg-muted/40 py-16 sm:py-24">
      <Container><div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Business Structure Diagnostic</p>
        <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">Identify the operational problems holding your business back.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">Everything depends on you. Prices feel like guesswork. Tasks live in your head. Start by finding the parts of your business that need more structure.</p>
        <a href="#health-check" className={`${button} mt-8`}>Take the 60-Second Business Health Check</a>
        <p className="mt-4 text-sm text-muted-foreground">Five questions. An immediate result. No email required.</p>
      </div></Container>
    </section>

    <Container><div className="mx-auto max-w-3xl space-y-20 py-16">
      <section id="health-check" className="scroll-mt-28" aria-labelledby="health-heading">
        <p className="text-sm font-semibold text-primary">01 / Understand where you stand</p>
        <h2 id="health-heading" className="mt-3 text-3xl font-semibold">Your Business Health Check</h2>
        <p className="mt-4 text-muted-foreground">Choose the answer closest to how your business works today. Each area is weighted equally: Not yet = 0, Sometimes = 1, Consistently = 2.</p>
        <form onSubmit={assess} className="mt-8 space-y-6">
          {healthQuestions.map((item, index) => <fieldset key={item.area} className="rounded-xl border border-border p-5">
            <legend className="px-2 font-medium">{index + 1}. {item.question}</legend>
            <div className="flex flex-wrap gap-3">{["Not yet", "Sometimes", "Consistently"].map((label, value) => <label key={label} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 has-checked:bg-primary/10">
              <input className={focus} type="radio" name={`health-${index}`} value={value} required checked={answers[index] === value} onChange={() => {
                if (!started.current) { started.current = true; trackEvent("assessment_start", tracking); }
                setAnswers(previous => previous.map((answer, position) => position === index ? value : answer));
                setResult(null);
              }} />{label}
            </label>)}</div>
          </fieldset>)}
          <button className={button} type="submit">See my business health score</button>
        </form>
        <div aria-live="polite" aria-atomic="true">{result && <div className="mt-8 rounded-xl border border-border bg-muted p-6">
          <h3 className="text-2xl font-semibold">Your score: {result.score}/100</h3>
          <p className="mt-3 text-muted-foreground">This is a reflection of your answers, not an independent audit or a prediction of business success.</p>
          <h4 className="mt-6 font-semibold">{result.priorities.length ? "Areas to work on" : "Keep strengthening your systems"}</h4>
          {result.priorities.length ? <ul className="mt-3 space-y-4">{result.priorities.map(item => <li key={item.area}><strong>{item.area}:</strong> {item.action}</li>)}</ul> : <p className="mt-3">Your answers suggest consistent habits across all five areas. Review whether your documented processes still work as your business grows.</p>}
          <a href="#diagnostic-offer" className={`${button} mt-6`}>Explore the full diagnostic</a>
        </div>}</div>
        <p className="mt-4 text-sm text-muted-foreground">Answers stay on this page and are not included in your enquiry or analytics.</p>
      </section>

      <section id="diagnostic-offer" className="scroll-mt-28" aria-labelledby="offer-heading">
        <p className="text-sm font-semibold text-primary">02 / Get a practical plan</p>
        <h2 id="offer-heading" className="mt-3 text-3xl font-semibold">{service.title}</h2>
        <p className="mt-4 text-lg text-muted-foreground">{service.short}</p>
        <div className="my-8 border-y border-border py-6"><p className="text-sm text-muted-foreground">Fixed one-time fee</p><p className="mt-2 text-3xl font-semibold">{service.price}</p><p className="mt-3">A standalone engagement. No recurring membership is required.</p></div>
        <h3 className="text-xl font-semibold">What you receive</h3>
        <ol className="mt-5 list-decimal space-y-4 pl-6">{service.details.whatYouGet.map(item => <li key={item}>{item}</li>)}</ol>
        <h3 className="mt-8 text-xl font-semibold">Delivery and scope</h3>
        <ul className="mt-4 space-y-4 text-muted-foreground">{service.details.notes?.map(item => <li key={item}>{item}</li>)}</ul>
        <a href="#diagnostic-enquiry" className={`${button} mt-8`}>Enquire about the diagnostic</a>
      </section>

      <section id="diagnostic-enquiry" className="scroll-mt-28 rounded-2xl border border-border bg-card p-6 sm:p-8" aria-labelledby="enquiry-heading">
        <p className="text-sm font-semibold text-primary">03 / Tell us about your business</p>
        <h2 id="enquiry-heading" className="mt-3 text-3xl font-semibold">Start with an enquiry</h2>
        <p className="mt-4 text-muted-foreground">Prowess reviews your business, challenges and goals to confirm suitability before providing payment instructions. Submitting this form takes no payment.</p>
        {sent ? <div role="status" className="mt-8 rounded-xl bg-muted p-6"><h3 className="text-xl font-semibold">Your diagnostic enquiry has been received.</h3><p className="mt-3">We’ll review your details and reply by email to confirm whether the diagnostic is appropriate. If it is, we’ll provide payment instructions. The five-business-day delivery period starts only after payment is confirmed and all required information is received.</p></div> : <form onSubmit={enquire} className="mt-8 space-y-5" aria-busy={pending}>
          <p className="text-sm text-muted-foreground">All fields are required unless marked optional. Please do not include passwords or financial account details.</p>
          <input name="company_site" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <fieldset disabled={pending} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block font-medium">Full name<input className={input} name="full_name" autoComplete="name" required maxLength={200} /></label>
              <label className="block font-medium">Email<input className={input} name="email" type="email" autoComplete="email" required maxLength={254} /></label>
            </div>
            <label className="block font-medium">Phone (optional)<input className={input} name="phone" type="tel" autoComplete="tel" maxLength={50} /></label>
            <label className="block font-medium">Business stage<select className={input} name="business_stage" required defaultValue=""><option value="" disabled>Select your stage</option><option>Planning</option><option>Starting</option><option>Growing</option><option>Established</option></select></label>
            <label className="block font-medium">What does your business do?<textarea className={input} name="business" required rows={3} maxLength={2000} /></label>
            <label className="block font-medium">What are your current challenges?<textarea className={input} name="challenges" required rows={4} maxLength={3000} /></label>
            <label className="block font-medium">What would you like to improve?<textarea className={input} name="goals" required rows={3} maxLength={2000} /></label>
          </fieldset>
          {error && <p role="alert" className="text-destructive">{error}</p>}
          <button type="submit" className={button} disabled={pending}>{pending ? "Submitting enquiry…" : "Submit Diagnostic Enquiry"}</button>
        </form>}
      </section>
    </div></Container>
  </div>;
}
