"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ClipboardCheck, FileUp, Loader2, ShieldCheck } from "lucide-react";
import Container from "@/components/Container";
import { supabase } from "@/lib/supabase";

type Status = "idle" | "submitting" | "success" | "error";

const inputCls = "w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const labelCls = "mb-1.5 block text-sm font-semibold text-foreground";
const hintCls = "mt-1.5 text-xs leading-5 text-muted-foreground";

export default function CvCheckerPageClient() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setStatus("error");
      setMessage("Please sign in before submitting your CV.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/cv-checker", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: formData,
    }).then((r) => r.json()).catch(() => null);

    if (!res?.ok) {
      setStatus("error");
      setMessage(res?.error || "Your CV could not be submitted. Please try again.");
      return;
    }

    formRef.current?.reset();
    setStatus("success");
    setMessage("Your CV has been submitted. The team has been notified and will review it manually.");
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-muted py-14 sm:py-18">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.45fr)] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Manual CV review
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Submit your CV for a practical review.</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                Upload your CV and tell us what you are applying for. An admin notification is sent immediately, then the review is handled by the Prowess team.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-foreground">Premium Membership required</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">CV Checker is included with Premium Membership. <Link href="/account/membership" className="font-semibold text-primary hover:underline">View membership plans →</Link></p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-14">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(300px,0.28fr)]">
            <form ref={formRef} onSubmit={submit} className="rounded-lg border border-border bg-card p-6 sm:p-8" aria-busy={status === "submitting"}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="full_name" className={labelCls}>Full name *</label>
                  <input id="full_name" name="full_name" type="text" autoComplete="name" required className={inputCls} />
                </div>
                <div>
                  <label htmlFor="email" className={labelCls}>Email *</label>
                  <input id="email" name="email" type="email" autoComplete="email" spellCheck={false} required className={inputCls} />
                </div>
                <div>
                  <label htmlFor="phone" className={labelCls}>Phone</label>
                  <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="target_role" className={labelCls}>Target role *</label>
                  <input id="target_role" name="target_role" type="text" required className={inputCls} placeholder="Product Manager, Data Analyst" />
                </div>
                <div>
                  <label htmlFor="career_level" className={labelCls}>Career level *</label>
                  <select id="career_level" name="career_level" required className={inputCls}>
                    <option value="">Choose level</option>
                    <option value="Student or Graduate">Student or Graduate</option>
                    <option value="Entry Level">Entry Level</option>
                    <option value="Mid Level">Mid Level</option>
                    <option value="Senior Level">Senior Level</option>
                    <option value="Career Switcher">Career Switcher</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cv" className={labelCls}>Upload CV *</label>
                  <input id="cv" name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  <p className={hintCls}>PDF, DOC or DOCX. Maximum 5 MB.</p>
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="review_focus" className={labelCls}>What should we check?</label>
                <textarea id="review_focus" name="review_focus" rows={5} className={inputCls} placeholder="Tell us about the roles you want, sections you are unsure about, or feedback you need." />
              </div>

              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

              {message && (
                <div className={`mt-5 rounded-lg border p-4 text-sm ${status === "success" ? "border-primary/20 bg-primary/5 text-foreground" : "border-destructive/20 bg-destructive/5 text-destructive"}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto"
              >
                {status === "submitting" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileUp className="h-4 w-4" aria-hidden="true" />}
                {status === "submitting" ? "Submitting" : "Submit CV"}
              </button>
            </form>

            <aside className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-5">
                <h2 className="text-base font-bold text-foreground">What happens next</h2>
                <ul className="mt-4 space-y-3">
                  {["Your CV is uploaded securely.", "The admin receives a notification.", "The team reviews it manually.", "You receive practical feedback by email."].map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
                      <CheckCircle2 className="mt-1 h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-border bg-muted p-5">
                <h2 className="text-base font-bold text-foreground">Need to build one first?</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Use the builder to create a clean first draft, then come back here for review.</p>
                <Link href="/tools/cv-builder" className="mt-4 inline-flex min-h-10 items-center rounded-lg px-1 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  Open CV Builder
                </Link>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
}
