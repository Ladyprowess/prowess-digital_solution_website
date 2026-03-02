import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";
import ResourcesBrowser from "@/components/resources/ResourcesBrowser";
import BusinessHelperTool from "@/components/resources/BusinessHelperTool";
import StarterChecklist from "@/components/resources/StarterChecklist";
import BusinessStructureTemplate from "@/components/resources/BusinessStructureTemplate";
import Link from "next/link";

const youtubeUrl = "https://www.youtube.com/@ProwessDigitalSolutions";

export default function ResourcesPage() {
  return (
    <section className="py-12 sm:py-16 bg-slate-50/40">
      <Container>
        {/* TITLE SECTION */}
        <div className="max-w-3xl">
          <SectionTitle
            title="Resources"
            desc="Guides, templates, and practical materials to support clear business thinking."
          />
        </div>

        {/* CARDS SECTION */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Blog */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Blog</h3>
            <p className="mt-2 text-slate-600">
              Articles that help you build structure, make better decisions, and
              think long-term.
            </p>
            <div className="mt-4">
              <Link
                href="/blog"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                View Blog
              </Link>
            </div>
          </div>

          {/* Videos */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Videos</h3>
            <p className="mt-2 text-slate-600">
              Short and practical videos explaining business structure and
              clarity.
            </p>
            <div className="mt-4">
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                Visit YouTube
              </a>
            </div>
          </div>

          {/* Events */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Events</h3>
            <p className="mt-2 text-slate-600">
              Workshops, sessions, and learning events for business owners.
            </p>
            <div className="mt-4">
              <Link
                href="/events"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                View Events
              </Link>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------- */}
        {/*  BUSINESS HELPER                                           */}
        {/* ---------------------------------------------------------- */}
        <section
          id="business-helper"
          className="mt-24 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 sm:p-12"
        >
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#507c80]/10 px-3 py-1 text-xs font-semibold text-[#507c80]">
              Free Tool
            </div>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Business Helper
            </h2>

            <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
              Share what is happening in your business and get a simple
              diagnostic report with a Business Health Score and clear next
              steps.
            </p>
          </div>

          <div className="mt-10">
            <BusinessHelperTool />
          </div>

          <p className="mt-6 text-sm text-slate-500">
            This tool provides guidance only. For personalised support, book a
            clarity session.
          </p>
        </section>

        {/* ---------------------------------------------------------- */}
        {/*  STARTER CHECKLIST                                         */}
        {/* ---------------------------------------------------------- */}
        <section
          id="starter-checklist"
          className="mt-24 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 sm:p-12"
        >
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#507c80]/10 px-3 py-1 text-xs font-semibold text-[#507c80]">
              Free Tool
            </div>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              African Small Business Starter Checklist
            </h2>

            <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
              Work through the foundational things every business should have in
              place before chasing growth. Check off what you have, see where the
              gaps are, and know exactly what to prioritise next.
            </p>
          </div>

          <div className="mt-10">
            <StarterChecklist />
          </div>

          <p className="mt-6 text-sm text-slate-500">
            This checklist covers the essentials. Your specific industry may
            have additional requirements.
          </p>
        </section>

        {/* ---------------------------------------------------------- */}
        {/*  BUSINESS STRUCTURE TEMPLATE                               */}
        {/* ---------------------------------------------------------- */}
        <section
          id="structure-template"
          className="mt-24 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 sm:p-12"
        >
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#507c80]/10 px-3 py-1 text-xs font-semibold text-[#507c80]">
              Free Tool
            </div>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Business Structure Template for African Entrepreneurs
            </h2>

            <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
              Map out your business structure step by step. Define roles,
              responsibilities, decision making, and communication flow. Download
              or copy the result and use it as the foundation your team operates
              from.
            </p>
          </div>

          <div className="mt-10">
            <BusinessStructureTemplate />
          </div>

          <p className="mt-6 text-sm text-slate-500">
            This template gives you a starting framework. For a fully customised
            structure, consider a Business Structure Setup engagement.
          </p>
        </section>

        {/* RESOURCE BROWSER */}
        <div className="mt-10">
          <ResourcesBrowser />
        </div>
      </Container>
    </section>
  );
}
