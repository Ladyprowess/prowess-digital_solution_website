"use client";

import { useState } from "react";
import Link from "next/link";
import Container from "@/components/Container";

type ChecklistCategory = {
  title: string;
  description: string;
  items: string[];
};

const categories: ChecklistCategory[] = [
  {
    title: "Registration & Legal",
    description: "The legal basics that protect you and make your business legitimate.",
    items: [
      "Business name registered with your local business registrar",
      "Business structure decided (sole proprietorship, LLC, partnership, etc.)",
      "Tax ID obtained from your local tax authority",
      "Business bank account opened in the registered business name",
      "Relevant industry permits or licences obtained (if applicable)",
      "Basic contract or service agreement template prepared for clients",
    ],
  },
  {
    title: "Business Clarity & Direction",
    description: "The foundational thinking that determines whether your business has real direction.",
    items: [
      "Clear description of what your business does (in one or two sentences)",
      "Target audience defined (who exactly you serve and why)",
      "Core services or products clearly listed with pricing",
      "Revenue model defined (how you actually make money)",
      "Short term goals set for the next 3 to 6 months",
      "Long term vision documented (where you want the business to be in 2 to 3 years)",
    ],
  },
  {
    title: "Financial Foundation",
    description: "The money systems that keep you informed and in control.",
    items: [
      "Income and expenses being tracked consistently (even a simple spreadsheet)",
      "Pricing structured to cover costs and generate profit",
      "Separate personal and business finances",
      "Basic budget or financial plan in place for the next quarter",
      "Invoicing system set up (even a simple template)",
      "Emergency fund or reserve started for the business",
    ],
  },
  {
    title: "Operations & Systems",
    description: "The internal processes that keep your business running without chaos.",
    items: [
      "Client onboarding process defined (what happens when someone pays)",
      "Service delivery process documented (how work gets done, start to finish)",
      "Communication channels decided (email, WhatsApp, Slack, etc.) with a clear purpose for each",
      "File storage organised (Google Drive, Dropbox, or similar) with a naming convention",
      "Basic project or task management system in use",
      "At least one key process written as a simple SOP",
    ],
  },
  {
    title: "Brand & Online Presence",
    description: "How people find you and what impression they get when they do.",
    items: [
      "Professional logo and basic brand identity in place",
      "Business website live with clear service descriptions",
      "Google Business Profile set up and verified",
      "Active on at least one social media platform relevant to your audience",
      "Contact information easy to find (email, phone, WhatsApp)",
      "Client testimonials or case studies collected (even one or two)",
    ],
  },
  {
    title: "Team & Growth Readiness",
    description: "The structural pieces that determine whether growth will help or hurt you.",
    items: [
      "Roles and responsibilities defined (even if you are the only person)",
      "Decision making process clear (who decides what)",
      "Delegation plan in place or identified (what can be handed off first)",
      "Skills gap identified (what you need but do not currently have)",
      "Basic onboarding process ready for when you hire or bring on help",
      "Growth priorities ranked (what to focus on next, and what to wait on)",
    ],
  },
];

export default function BusinessHealthCheckPageClient() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expandedCategory, setExpandedCategory] = useState<number | null>(0);
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progressPercent = totalItems ? Math.round((checkedCount / totalItems) * 100) : 0;

  function toggleItem(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleCategory(index: number) {
    setExpandedCategory((prev) => (prev === index ? null : index));
  }

  function getCategoryProgress(catIndex: number) {
    const cat = categories[catIndex];
    const done = cat.items.filter((_, i) => checked[`${catIndex}-${i}`]).length;
    return { done, total: cat.items.length };
  }

  function getScoreLabel() {
    if (progressPercent === 100) return "Your foundations are solid. Time to grow with confidence.";
    if (progressPercent >= 75) return "Strong foundation. A few gaps to close before scaling.";
    if (progressPercent >= 50) return "Decent progress. Focus on the unchecked items before chasing growth.";
    if (progressPercent >= 25) return "Early stages. Prioritise the basics before investing further.";
    return "Just getting started. Work through this list before making big moves.";
  }

  async function unlockResults(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "operational-health-self-audit",
          email,
          scorePercent: progressPercent,
          checkedCount,
          totalItems,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not save your results. Please try again.");
        setSubmitting(false);
        return;
      }
      setUnlocked(true);
      setSubmitting(false);
    } catch {
      setError("Could not save your results. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="page-wrap section">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Free Self-Audit</p>
          <h1 className="h1">Operational Health Self-Audit</h1>
          <p className="lead mt-4">
            36 checkpoints across 6 categories. Work through them honestly, then unlock your score
            and see exactly where your business is solid and where it is not.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl space-y-8">
          {/* SCORE (blurred until unlocked) */}
          <div className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Progress</p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {checkedCount} <span className="text-lg font-normal text-muted-foreground">/ {totalItems}</span>
                </p>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-bold text-primary ${unlocked ? "" : "blur-sm select-none"}`}>
                  {progressPercent}%
                </p>
              </div>
            </div>

            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className={`mt-3 text-sm leading-relaxed text-muted-foreground ${unlocked ? "" : "blur-sm select-none"}`}>
              {getScoreLabel()}
            </p>

            {!unlocked && (
              <form onSubmit={unlockResults} className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@business.com"
                  className="flex-1 rounded-lg border border-border bg-background p-3 text-sm text-foreground"
                />
                <button
                  type="submit"
                  disabled={submitting || checkedCount === 0}
                  className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? "Unlocking..." : "See My Score"}
                </button>
              </form>
            )}
            {!unlocked && checkedCount === 0 && (
              <p className="mt-2 text-xs text-muted-foreground">Check at least one item below to unlock your score.</p>
            )}
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>

          {/* CATEGORIES */}
          <div className="space-y-3">
            {categories.map((cat, catIndex) => {
              const { done, total } = getCategoryProgress(catIndex);
              const isExpanded = expandedCategory === catIndex;
              const isComplete = done === total;

              return (
                <div
                  key={catIndex}
                  className={`overflow-hidden rounded-2xl border shadow-sm transition-colors ${
                    isComplete ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <button
                    onClick={() => toggleCategory(catIndex)}
                    className="flex w-full items-center justify-between p-5 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                          isComplete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isComplete ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          catIndex + 1
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{cat.title}</h3>
                        <p className="mt-0.5 text-sm text-muted-foreground">{done} of {total} complete</p>
                      </div>
                    </div>
                    <svg
                      className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border px-5 pb-5 pt-3">
                      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{cat.description}</p>
                      <div className="space-y-2">
                        {cat.items.map((item, itemIndex) => {
                          const key = `${catIndex}-${itemIndex}`;
                          const isChecked = !!checked[key];
                          return (
                            <label
                              key={key}
                              className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-colors ${
                                isChecked ? "bg-primary/5" : "hover:bg-muted"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleItem(key)}
                                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-border accent-primary"
                              />
                              <span className={`text-sm leading-relaxed ${isChecked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                {item}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Found gaps? That is completely normal. The Business Structure Diagnostic gives you a
              fixed 48 to 72 hour, honest outside look at what to fix first.
            </p>
            <Link
              href="/services/business-structure-diagnostic"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Start the Diagnostic
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
