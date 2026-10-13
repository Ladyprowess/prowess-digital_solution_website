"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  LineChart,
  NotebookText,
  SearchCheck,
  Target,
  UsersRound,
  Wrench,
} from "lucide-react";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { services } from "@/content/site";

const serviceIcons: Record<string, LucideIcon> = {
  audit: SearchCheck,
  sop: NotebookText,
  strategy: Target,
  tools: LineChart,
  clarity: SearchCheck,
  setup: Wrench,
  workflow: ClipboardCheck,
  training: UsersRound,
  mentorship: UsersRound,
  package: BriefcaseBusiness,
};

const stageCards = [
  {
    label: "Starting",
    title: "Get clear before you build.",
    text: "Clarify the offer, check the numbers and understand what has to be in place before you spend more.",
  },
  {
    label: "Running",
    title: "Turn repeated work into systems.",
    text: "Document the work, clean up handovers and stop depending on memory for daily operations.",
  },
  {
    label: "Growing",
    title: "Keep control as demand increases.",
    text: "Track performance, train the team and make better decisions with a clearer operating rhythm.",
  },
];

const toolCards = [
  { title: "Startup Cost Calculator", text: "Know launch costs and break even point.", icon: Gauge },
  { title: "Cashflow Tracker", text: "See income, expenses and monthly movement.", icon: LineChart },
  { title: "Invoice Manager", text: "Create invoices and track payment follow ups.", icon: ClipboardCheck },
  { title: "Inventory Manager", text: "Monitor stock before shortages become expensive.", icon: Wrench },
];

const processSteps = [
  {
    title: "Diagnose",
    text: "We look at the business as it is now. Workflow, numbers, decisions and the places where things keep slowing down.",
  },
  {
    title: "Build",
    text: "We turn the right pressure point into practical structure. That may be SOPs, a clearer offer, tracking tools or a focused plan.",
  },
  {
    title: "Support",
    text: "You leave with routines, tools and guidance you can keep using as the business grows.",
  },
];

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {children}
    </Link>
  );
}

export default function ServicesPageClient() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-muted py-12 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <Reveal>
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  Business Services
                </p>
                <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
                  Practical structure for businesses that are ready to run better.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                  We help business owners find what is not working, organise the work, document
                  the systems and track the numbers that make growth easier to manage.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <PrimaryLink href="/services/business-structure-diagnostic">
                    Start with a diagnostic <ArrowRight size={16} aria-hidden="true" />
                  </PrimaryLink>
                  <SecondaryLink href="/case-studies">
                    See case studies
                  </SecondaryLink>
                </div>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="rounded-lg border border-border bg-card p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  What We Help Fix
                </p>
                <div className="mt-5 space-y-4">
                  {[
                    "Unclear business structure",
                    "Undocumented day to day work",
                    "Weak pricing or offer clarity",
                    "Poor financial tracking",
                    "Growth without control",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" aria-hidden="true" />
                      <span className="text-sm font-medium leading-6 text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="border-b border-border bg-background py-10 sm:py-12">
        <Container>
          <div className="grid gap-4 md:grid-cols-3">
            {stageCards.map((stage, index) => (
              <Reveal key={stage.label} delay={index * 60}>
                <article className="h-full rounded-lg border border-border bg-card p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">{stage.label}</p>
                  <h2 className="mt-3 text-lg font-bold text-foreground">{stage.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{stage.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section id="our-services" className="bg-muted py-12 sm:py-16">
        <Container>
          <Reveal>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  Choose Your Support
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Start with the business problem that needs attention first.
                </h2>
              </div>
              <SecondaryLink href="/pricing">
                Compare ongoing support <ArrowRight size={16} aria-hidden="true" />
              </SecondaryLink>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {services.map((service, index) => {
              const Icon = serviceIcons[service.icon || "package"] || BriefcaseBusiness;
              return (
                <Reveal key={service.id} delay={index * 60}>
                  <article className="flex h-full flex-col rounded-lg border border-border bg-card p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon size={21} aria-hidden="true" />
                      </span>
                      <span className="rounded-md border border-border bg-background px-3 py-1 text-xs font-bold text-muted-foreground">
                        {service.slug === "business-structure-diagnostic" ? "One-time fee" : "Standalone estimate"}: {service.price}
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-foreground">{service.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.short}</p>
                    <div className="mt-5 space-y-2 border-t border-border pt-4">
                      {service.details.whatYouGet.slice(0, 3).map((item) => (
                        <div key={item} className="flex gap-2 text-sm leading-6 text-foreground">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`/services/${service.slug}`}
                      className="mt-6 inline-flex min-h-10 w-fit items-center gap-2 text-sm font-semibold text-primary transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      Open service <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="bg-primary py-12 sm:py-16">
        <Container>
          <Reveal>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/75">
                  Proof First
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                  Want to see how this works before you choose a service?
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-primary-foreground/80">
                  The case studies show the problem, the structure we built and the practical
                  changes clients could keep using after the work.
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/case-studies"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary-foreground px-5 text-sm font-semibold text-primary transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    View case studies <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary-foreground/35 px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Ask what fits
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/75">
                  Case Studies Show
                </p>
                <div className="mt-5 space-y-4">
                  {[
                    "The business challenge",
                    "The systems or tools put in place",
                    "The result the client could feel or measure",
                  ].map((item) => (
                    <div key={item} className="flex gap-3 text-sm font-medium leading-6 text-primary-foreground">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="bg-background py-12 sm:py-16">
        <Container>
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Tools Included In The Work
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Useful tools, not just advice.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Some offers include access to tools that help you keep tracking and improving the
                business after the engagement.
              </p>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {toolCards.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <Reveal key={tool.title} delay={index * 50}>
                  <article className="h-full rounded-lg border border-border bg-card p-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-base font-bold text-foreground">{tool.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.text}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-7">
            <SecondaryLink href="/tools">
              Explore all tools <ArrowRight size={16} aria-hidden="true" />
            </SecondaryLink>
          </div>
        </Container>
      </section>

      <section className="border-y border-border bg-muted py-12 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
            <Reveal>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  How It Works
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Simple enough to start. Structured enough to matter.
                </h2>
              </div>
            </Reveal>

            <div className="grid gap-4 md:grid-cols-3">
              {processSteps.map((step, index) => (
                <Reveal key={step.title} delay={index * 60}>
                  <article className="h-full rounded-lg border border-border bg-card p-5">
                    <span className="text-sm font-bold text-primary">{String(index + 1).padStart(2, "0")}</span>
                    <h3 className="mt-4 text-lg font-bold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-background py-12 sm:py-16">
        <Container>
          <Reveal>
            <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">
                    Next Step
                  </p>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    If you are unsure, start with the diagnostic.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    It gives you a clear picture of what is working, what is leaking time or money
                    and what to fix first.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <PrimaryLink href="/services/business-structure-diagnostic">
                    Start the diagnostic <ArrowRight size={16} aria-hidden="true" />
                  </PrimaryLink>
                  <SecondaryLink href="/case-studies">
                    Read client stories
                  </SecondaryLink>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
