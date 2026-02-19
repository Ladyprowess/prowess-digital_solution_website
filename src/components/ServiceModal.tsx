"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/Modal";
import Button from "@/components/Button";
import type { Service } from "@/content/site";
import Link from "next/link";


function ServiceIcon({ name }: { name?: string }) {
  const cls = "h-6 w-6 text-[var(--steel-teal)]";

  switch (name) {
    case "clarity":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2a7 7 0 00-4 12c.2.1.3.3.3.5V18a2 2 0 002 2h3a2 2 0 002-2v-3.5c0-.2.1-.4.3-.5A7 7 0 0012 2z"
          />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 21h6" />
        </svg>
      );

    case "audit":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 17h6M9 13h6M9 9h6" />
          <path
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 21h10a2 2 0 002-2V7l-4-4H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      );

    case "setup":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 21h18" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 21V8a2 2 0 012-2h6a2 2 0 012 2v13" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 10h6M9 14h6" />
        </svg>
      );

    case "brand":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M20 12V7a2 2 0 00-2-2h-5" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 12v5a2 2 0 002 2h5" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 8l8 8" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 7h4a2 2 0 012 2v4" />
        </svg>
      );

    case "systems":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2v3" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 19v3" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4.2 4.2l2.1 2.1" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17.7 17.7l2.1 2.1" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2 12h3" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 12h3" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4.2 19.8l2.1-2.1" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17.7 6.3l2.1-2.1" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      );

    case "training":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M22 10l-10 5L2 10l10-5 10 5z" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
        </svg>
      );

    case "support":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 9v6" />
        </svg>
      );

    case "strategy":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 14l3-3 3 2 5-6" />
        </svg>
      );

    case "team":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 11a4 4 0 10-8 0 4 4 0 008 0z" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 20a8 8 0 0116 0" />
        </svg>
      );

    // ✅ NEW: workflow
    case "workflow":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="4" width="7" height="6" rx="1" strokeWidth="2" />
          <rect x="14" y="4" width="7" height="6" rx="1" strokeWidth="2" />
          <rect x="8.5" y="14" width="7" height="6" rx="1" strokeWidth="2" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 7h4M12 10v4" />
        </svg>
      );

    // ✅ NEW: sop
    case "sop":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="4" y="3" width="16" height="18" rx="2" strokeWidth="2" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h8M8 15h5" />
        </svg>
      );

    // ✅ NEW: mentorship
    case "mentorship":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="9" cy="8" r="3" strokeWidth="2" />
          <circle cx="17" cy="10" r="2.5" strokeWidth="2" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 20a6 6 0 0112 0" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 20a5 5 0 018 0" />
        </svg>
      );

    // ✅ NEW: package
    case "package":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7l9-4 9 4-9 4-9-4z" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7v10l9 4 9-4V7" />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 11v10" />
        </svg>
      );

    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2a7 7 0 00-4 12c.2.1.3.3.3.5V18a2 2 0 002 2h3a2 2 0 002-2v-3.5c0-.2.1-.4.3-.5A7 7 0 0012 2z"
          />
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 21h6" />
        </svg>
      );
  }
}

export default function ServiceModalGrid({ services }: { services: Service[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = useMemo(
    () => services.find((s) => s.id === activeId) || null,
    [activeId, services]
  );

  return (
    <>
      {/* CARD GRID */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            {/* icon box */}
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef6f6]">
              <div className="text-[var(--steel-teal)]">
                <ServiceIcon name={s.icon} />
              </div>
            </div>

            {/* title */}
            <h3 className="mt-6 text-2xl font-semibold text-slate-900">{s.title}</h3>

            {/* description */}
            <p className="mt-3 text-base leading-relaxed text-slate-600">{s.short}</p>

            {/* Learn more */}
            <div className="mt-6 flex items-center gap-4">
  <Link
    href={`/services/${s.slug}`}
    className="inline-flex items-center gap-2 font-semibold text-[var(--steel-teal)] hover:opacity-80"
  >
    Learn more <span aria-hidden>→</span>
  </Link>

  <button
    type="button"
    onClick={() => setActiveId(s.id)}
    className="text-sm font-semibold text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
  >
    Quick view
  </button>
</div>


          </div>
        ))}
      </div>

      {/* MODAL */}
      <Modal open={!!active} title={active?.title || ""} onClose={() => setActiveId(null)}>
        {active ? (
          <div className="space-y-5">
            {/* ✅ Paragraph breaks */}
            <div className="text-slate-700">
              {active.details.description.split("\n\n").map((paragraph, index) => (
                <p key={index} className="mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>

            <div>
              <h4 className="font-semibold">Who it’s for</h4>
              <ul className="mt-2 list-disc pl-5 text-slate-700">
                {active.details.whoFor.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">What clients get</h4>
              <ul className="mt-2 list-disc pl-5 text-slate-700">
                {active.details.whatYouGet.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            {active.details.notes?.length ? (
              <div>
                <h4 className="font-semibold">Notes</h4>
                <ul className="mt-2 list-disc pl-5 text-slate-700">
                  {active.details.notes.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Actions */}
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-700">
                <span className="text-slate-500">Price range: </span>
                <span className="font-medium">{active.price}</span>
              </p>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button href="/contact">{active.cta}</Button>
                <Button variant="secondary" onClick={() => setActiveId(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
