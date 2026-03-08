import type { Metadata } from "next";
import Container from "@/components/Container";
import SectionTitle from "@/components/SectionTitle";
import ResourcesBrowser from "@/components/resources/ResourcesBrowser";
import Link from "next/link";

const youtubeUrl = "https://www.youtube.com/@ProwessDigitalSolutions";

export const metadata: Metadata = {
  title: "Resources | Prowess Digital Solutions",
  description:
    "Free business tools, guides, templates, and practical materials built for African entrepreneurs. Diagnose your business, plan your structure, and track your growth.",
  keywords: [
    "business tools for African entrepreneurs",
    "free business checklist Nigeria",
    "business structure template Africa",
    "business diagnostic tool",
    "African small business resources",
    "startup cost calculator Africa",
    "Prowess Digital Solutions resources",
  ],
  openGraph: {
    title: "Resources | Prowess Digital Solutions",
    description:
      "Free tools and guides built for African business owners. Start with a diagnostic report, check your foundations, and map your structure.",
    url: "https://prowessdigitalsolutions.com/resources",
    siteName: "Prowess Digital Solutions",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resources | Prowess Digital Solutions",
    description:
      "Free business tools and guides built for African entrepreneurs. Diagnose your business. Build your foundation.",
  },
  alternates: {
    canonical: "https://prowessdigitalsolutions.com/resources",
  },
};

const TOOLS = [
  {
    icon: "🤖",
    title: "Business Helper",
    desc: "Describe what is happening in your business and get a structured diagnostic report with a Business Health Score and clear next steps, powered by AI.",
    href: "/tools/business-helper.html",
    cta: "Run a Diagnostic",
  },
  {
    icon: "✅",
    title: "Business Starter Checklist",
    desc: "36 checkpoints across 6 categories. See what your business already has in place and exactly what to fix before you chase growth.",
    href: "/tools/business-starter.html",
    cta: "Check Your Foundations",
  },
  {
    icon: "🏗️",
    title: "Business Structure Template",
    desc: "Map out your roles, departments, decision making, and communication flow. Fill it in and download it as your operating foundation.",
    href: "/tools/business-structure.html",
    cta: "Build Your Structure",
  },
  {
    icon: "🤝",
    title: "Customer Service Guide",
    desc: "A practical guide to handling clients, complaints, and retention built specifically for African service businesses.",
    href: "/tools/customer-support.html",
    cta: "Read the Guide",
  },
];

export default function ResourcesPage() {
  return (
    <section className="py-12 sm:py-16 bg-slate-50/40">
      <Container>
        {/* TITLE SECTION */}
        <div className="max-w-3xl">
          <SectionTitle
            title="Resources"
            desc="Guides, templates, and practical tools to support clear business thinking. Everything here is built for African entrepreneurs who are serious about structure."
          />
        </div>

        {/* CONTENT CARDS */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Blog */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Blog</h3>
            <p className="mt-2 text-slate-600">
              Articles that help you build structure, make better decisions, and
              think long-term about your business.
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
              Short, practical videos on business structure, clarity, and
              building systems that actually work.
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
              Workshops, sessions, and learning events designed for African
              business owners at every stage.
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
        {/*  FREE TOOLS SECTION                                        */}
        {/* ---------------------------------------------------------- */}
        <section id="tools" className="mt-24">
          <div className="max-w-2xl mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#507c80]/10 px-3 py-1 text-xs font-semibold text-[#507c80] mb-4">
              Free Tools
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Tools that do the thinking with you
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
              Tools built for African business owners. To help businesses grow the right way.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {TOOLS.map((tool) => (
              <div
                key={tool.href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-[#507c80]/40 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#507c80]/08 text-2xl border border-slate-100">
                    {tool.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">{tool.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                      {tool.desc}
                    </p>
                    <div className="mt-4">
                      <a
                        href={tool.href}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#507c80] hover:text-[#3a5c60] transition-colors"
                      >
                        {tool.cta}
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex-wrap gap-4">
            <div>
              <p className="font-semibold text-slate-900">
                Need to see other tools?
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Those tools are available to Prowess Digital Solutions clients.
              </p>
            </div>
            <Link
              href="/tools"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--steel-teal)] px-5 py-3 text-sm font-semibold text-white hover:opacity-90 whitespace-nowrap"
            >
              View all tools →
            </Link>
          </div>
        </section>

        {/* RESOURCE BROWSER */}
        <div className="mt-16">
          <ResourcesBrowser />
        </div>
      </Container>
    </section>
  );
}