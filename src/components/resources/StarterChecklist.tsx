"use client";

import { useState } from "react";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

type ChecklistCategory = {
  title: string;
  description: string;
  items: string[];
};

const categories: ChecklistCategory[] = [
  {
    title: "Business Registration & Legal",
    description:
      "The legal basics that protect you and make your business legitimate.",
    items: [
      "Business name registered with the CAC (Corporate Affairs Commission)",
      "Business structure decided (sole proprietorship, LLC, partnership, etc.)",
      "TIN (Tax Identification Number) obtained from FIRS",
      "Business bank account opened in the registered business name",
      "Relevant industry permits or licences obtained (if applicable)",
      "Basic contract or service agreement template prepared for clients",
    ],
  },
  {
    title: "Business Clarity & Direction",
    description:
      "The foundational thinking that determines whether your business has real direction.",
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
    description:
      "The money systems that keep you informed and in control.",
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
    description:
      "The internal processes that keep your business running without chaos.",
    items: [
      "Client onboarding process defined (what happens when someone pays)",
      "Service delivery process documented (how work gets done, start to finish)",
      "Communication channels decided (email, WhatsApp, Slack, etc.) with clear purpose for each",
      "File storage organised (Google Drive, Dropbox, or similar) with a naming convention",
      "Basic project or task management system in use",
      "At least one key process written as a simple SOP",
    ],
  },
  {
    title: "Brand & Online Presence",
    description:
      "How people find you and what impression they get when they do.",
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
    description:
      "The structural pieces that determine whether growth will help or hurt you.",
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

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function StarterChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expandedCategory, setExpandedCategory] = useState<number | null>(0);

  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const progressPercent = Math.round((checkedCount / totalItems) * 100);

  function toggleItem(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleCategory(index: number) {
    setExpandedCategory((prev) => (prev === index ? null : index));
  }

  function getCategoryProgress(catIndex: number) {
    const cat = categories[catIndex];
    const done = cat.items.filter(
      (_, i) => checked[`${catIndex}-${i}`]
    ).length;
    return { done, total: cat.items.length };
  }

  function getScoreLabel() {
    if (progressPercent === 100) return "Your foundations are solid. Time to grow with confidence.";
    if (progressPercent >= 75) return "Strong foundation. A few gaps to close before scaling.";
    if (progressPercent >= 50) return "Decent progress. Focus on the unchecked items before chasing growth.";
    if (progressPercent >= 25) return "Early stages. Prioritise the basics before investing further.";
    return "Just getting started. Work through this list before making big moves.";
  }

  function handleReset() {
    setChecked({});
    setExpandedCategory(0);
  }

  return (
    <div className="space-y-8">
      {/* PROGRESS BAR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Your Progress</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {checkedCount}{" "}
              <span className="text-lg font-normal text-slate-400">
                / {totalItems}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-[#507c80]">{progressPercent}%</p>
          </div>
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#507c80] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          {getScoreLabel()}
        </p>

        {checkedCount > 0 && (
          <button
            onClick={handleReset}
            className="mt-3 text-sm text-slate-400 underline hover:text-slate-600"
          >
            Reset checklist
          </button>
        )}
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
                isComplete
                  ? "border-[#507c80]/30 bg-[#507c80]/5"
                  : "border-slate-200 bg-white"
              }`}
            >
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(catIndex)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      isComplete
                        ? "bg-[#507c80] text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isComplete ? "✓" : catIndex + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{cat.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {done} of {total} complete
                    </p>
                  </div>
                </div>
                <svg
                  className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Category Items */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-5 pb-5 pt-3">
                  <p className="mb-4 text-sm leading-relaxed text-slate-500">
                    {cat.description}
                  </p>
                  <div className="space-y-2">
                    {cat.items.map((item, itemIndex) => {
                      const key = `${catIndex}-${itemIndex}`;
                      const isChecked = !!checked[key];

                      return (
                        <label
                          key={key}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 transition-colors ${
                            isChecked
                              ? "bg-[#507c80]/5"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleItem(key)}
                            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 text-[#507c80] accent-[#507c80]"
                          />
                          <span
                            className={`text-sm leading-relaxed ${
                              isChecked
                                ? "text-slate-400 line-through"
                                : "text-slate-700"
                            }`}
                          >
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm leading-relaxed text-slate-600">
          Found gaps? That is completely normal. A clarity session can help you
          prioritise what to fix first and build a plan that fits your current
          resources.
        </p>
        <a
          href="/consultation"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#507c80] px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
        >
          Book a Clarity Session
        </a>
      </div>
    </div>
  );
                  }
