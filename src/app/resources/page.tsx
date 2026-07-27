import type { Metadata } from "next";
import Container from "@/components/Container";
import AgencyPageHeader from "@/components/AgencyPageHeader";
import ResourcesBrowser from "@/components/resources/ResourcesBrowser";
import { Reveal } from "@/components/Reveal";
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
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    title: "Business Helper",
    desc: "Describe what is happening in your business and get a structured diagnostic report with a Business Health Score and clear next steps, powered by AI.",
    href: "/tools/business-helper.html",
    cta: "Run a Diagnostic",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Operational Health Self-Audit",
    desc: "36 checkpoints across 6 categories. See what your business already has in place and exactly what to fix before you chase growth.",
    href: "/tools/business-health-check",
    cta: "Check Your Foundations",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
    title: "Business Structure Template",
    desc: "Map out your roles, departments, decision making, and communication flow. Fill it in and download it as your operating foundation.",
    href: "/tools/business-structure.html",
    cta: "Build Your Structure",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    title: "Customer Service Guide",
    desc: "A practical guide to handling clients, complaints, and retention.",
    href: "/tools/customer-support.html",
    cta: "Read the Guide",
  },
];

export default function ResourcesPage() {
  return (
    <div>
      <AgencyPageHeader
        eyebrow="Resources"
        title={
          <>
            Tools, guides, and <span className="text-primary">practical resources.</span>
          </>
        }
        description="Guides, templates, and practical tools to support clear business thinking. Everything here is built for entrepreneurs who are serious about structure."
        primaryAction={{ label: "Explore Free Tools", href: "#tools" }}
        secondaryAction={{ label: "Talk to Us", href: "/contact" }}
        proof={[
          "Free tools you can use today",
          "Templates for structure and planning",
          "Guides for clearer business decisions",
        ]}
      />

    <section className="py-12 sm:py-16 bg-muted/40">
      <Container>

        {/* CONTENT CARDS */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Blog",
              desc: "Articles that help you build structure, make better decisions, and think long-term about your business.",
              href: "/blog",
              cta: "View Blog",
              external: false,
            },
            {
              title: "Videos",
              desc: "Short, practical videos on business structure, clarity, and building systems that actually work.",
              href: youtubeUrl,
              cta: "Visit YouTube",
              external: true,
            },
            {
              title: "Events",
              desc: "Workshops, sessions, and learning events designed for business owners at every stage.",
              href: "/events",
              cta: "View Events",
              external: false,
            },
          ].map((card, i) => (
            <Reveal key={card.title} delay={i * 90}>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                <p className="mt-2 text-muted-foreground">{card.desc}</p>
                <div className="mt-4">
                  {card.external ? (
                    <a
                      href={card.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      {card.cta}
                    </a>
                  ) : (
                    <Link
                      href={card.href}
                      className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      {card.cta}
                    </Link>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* ---------------------------------------------------------- */}
        {/*  FREE TOOLS SECTION                                        */}
        {/* ---------------------------------------------------------- */}
        <section id="tools" className="mt-24">
          <Reveal>
            <div className="max-w-2xl mb-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
                Free Tools
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Tools that do the thinking with you
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Practical tools built for business owners, to help you grow the right way.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2">
            {TOOLS.map((tool, i) => (
              <Reveal key={tool.href} delay={i * 80}>
                <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] ring-1 ring-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                      {tool.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">{tool.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {tool.desc}
                      </p>
                      <div className="mt-4">
                        <a
                          href={tool.href}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:opacity-80"
                        >
                          {tool.cta}
                          <span className="transition-transform group-hover:translate-x-1">→</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={TOOLS.length * 80}>
            <div className="mt-8 flex items-center justify-between rounded-2xl border border-border bg-card p-6 shadow-sm flex-wrap gap-4">
              <div>
                <p className="font-semibold text-foreground">
                  Need to see other tools?
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Those tools are available to Prowess Digital Solutions clients.
                </p>
              </div>
              <Link
                href="/tools"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 whitespace-nowrap"
              >
                View all tools →
              </Link>
            </div>
          </Reveal>
        </section>

        {/* RESOURCE BROWSER */}
        <Reveal delay={80}>
          <div className="mt-16">
            <ResourcesBrowser />
          </div>
        </Reveal>
      </Container>
    </section>
    </div>
  );
}
