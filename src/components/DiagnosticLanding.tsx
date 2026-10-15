"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Service } from "@/content/site";
import Link from "next/link";
import Container from "@/components/Container";
import { trackEvent } from "@/lib/analytics";
import BusinessHealthExperience from "@/components/BusinessHealthExperience";
import { ArrowDown, ArrowRight } from "lucide-react";
import { DiagnosticBoard, DiagnosticReportPreview } from "./services/DiagnosticExplorer";
import RestoredServiceCommerce from "./services/RestoredServiceCommerce";
import s from "./services/Diagnostic.module.css";
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const button = `inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 ${focus}`;
const input = `mt-2 w-full rounded-lg border border-border bg-background p-3 text-foreground ${focus}`;
const tracking = { source: "business_diagnostic", offer: "business-structure-diagnostic" };

export default function DiagnosticLanding({ service }: { service: Service }) {
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

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

  return <div className={s.page}>
    <section className={s.hero}><Container><Link href="/services" className={s.back}>← All business services</Link><div className={s.heroGrid}>
      <div><p className={s.eyebrow}>Prowess Digital Solutions / Business Structure Diagnostic</p><h1>See what is holding<br/>your business <em>back.</em></h1><p className={s.intro}>You are doing the work. But the same problems keep returning. Get a clear view of the gaps, and a practical plan for what to address first.</p><div className={s.actions}><a href="#health-check" className={button}>Check my business <ArrowDown size={17}/></a><a href="#diagnostic-enquiry" className={s.textLink}>Enquire about the diagnostic <ArrowRight size={16}/></a></div><p className={s.caption}>Start with a free five-question health check. No email required.</p></div>
      <DiagnosticBoard/>
    </div></Container></section>
    <div className={s.facts}><Container><div><span><strong>{service.price}</strong> Fixed one-time fee</span><span><strong>5 business days</strong> After payment and complete information</span><span><strong>45-minute call</strong> Walk through your findings</span></div></Container></div>
    <Container><div className={s.sections}><DiagnosticReportPreview/>
      <section id="health-check" className={s.section} aria-labelledby="health-heading"><div className={s.sectionHeading}><div><p className={s.eyebrow}>01 / Start with your own view</p><h2 id="health-heading">Where does your business stand?</h2></div><p>Get a named result and practical starting points based on your answers. The paid diagnostic takes a closer look at your actual business.</p></div><BusinessHealthExperience source="business_diagnostic" offerHref="#diagnostic-offer"/></section>
      <section id="diagnostic-offer" className={s.section} aria-labelledby="offer-heading"><div className={s.sectionHeading}><div><p className={s.eyebrow}>02 / Turn the findings into a plan</p><h2 id="offer-heading">Clarity you can work with.</h2></div><p>{service.short}</p></div><div className={s.offerGrid}><div>{service.details.whatYouGet.map((item,i)=><details className={s.deliverable} key={item} open={i===0?true:undefined}><summary><span>{String(i+1).padStart(2,"0")}</span>{["Business review","Your diagnostic report","Your 30-day action plan","Tools and recommendations","A 45-minute review call"][i]}</summary><p>{item}</p></details>)}</div><aside className={s.offerCard}><p className={s.eyebrow}>One engagement. A clear scope.</p><h3>{service.price}</h3><p>Fixed one-time fee. No recurring membership required.</p><hr/><p>Start with an enquiry. Prowess Digital Solutions confirms suitability before providing payment instructions.</p><a href="#diagnostic-enquiry" className={button}>Enquire about the diagnostic <ArrowRight size={17}/></a><span className={s.caption}>No payment is taken when you enquire.</span></aside></div><details className={s.scope}><summary>Delivery, follow-up and what is not included</summary><ul>{service.details.notes?.map(item=><li key={item}>{item}</li>)}</ul></details></section>
      <section className={s.section}><div className={s.sectionHeading}><div><p className={s.eyebrow}>From enquiry to action</p><h2>A clear next step at every stage.</h2></div></div><div className={s.timeline}>{[["Tell us about your business","Share your business, challenges and goals in the form below."],["Confirm the fit","We review suitability, then send payment instructions and explain the information required."],["Receive your findings","The five-business-day delivery period begins once payment is confirmed and all required information is received."],["Review and move forward","Discuss your report in a 45-minute call, with one follow-up email within seven calendar days after the call."]].map(([title,body],i)=><article key={title}><span>0{i+1}</span><h3>{title}</h3><p>{body}</p></article>)}</div></section>
      <section id="diagnostic-enquiry-legacy" hidden className="scroll-mt-28 rounded-2xl border border-border bg-card p-6 sm:p-8" aria-labelledby="enquiry-heading">
        <p className="text-sm font-semibold text-primary">03 / Tell us about your business</p>
        <h2 id="enquiry-heading" className="mt-3 text-3xl font-semibold">Start with an enquiry</h2>
        <p className="mt-4 text-muted-foreground">Prowess Digital Solutions reviews your business, challenges and goals to confirm suitability before providing payment instructions. Submitting this form takes no payment.</p>
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
      <RestoredServiceCommerce slug="business-structure-diagnostic" title="Business Diagnostic" id="diagnostic-enquiry"/>
    </div></Container>
  </div>;
}
