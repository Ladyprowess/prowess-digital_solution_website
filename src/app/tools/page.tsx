"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, BriefcaseBusiness, ClipboardCheck, FileText, Layers3, LockKeyhole, MessagesSquare, MonitorUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { TOOL_ICON_PATHS } from "@/lib/tools/icons";
import { CV_TEMPLATES } from "@/lib/cvBuilder/templates";
import { TemplatePreview } from "@/components/cvBuilder/TemplatePreview";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { PillTabs, type PillTab } from "@/components/PillTabs";

type ToolRow = {
  key: string;
  category: "career" | "business";
  title: string;
  description: string;
  detail: string | null;
  icon_key: string;
  badge: string;
  gated: boolean;
  href: string | null;
};

const CATEGORY_TABS: PillTab<"career" | "business">[] = [
  { value: "career", label: "Career & CV" },
  { value: "business", label: "Business" },
];

const CAREER_TOOLS = [
  {
    title: "CV Builder",
    description: "Pick a template, edit every section, save your draft and download a polished PDF.",
    href: "/tools/cv-builder",
    icon: FileText,
    badge: "Free",
  },
  {
    title: "CV Checker",
    description: "Submit your CV for a manual review. The team gets notified and responds with practical fixes.",
    href: "/tools/cv-checker",
    icon: ClipboardCheck,
    badge: "Premium",
  },
  {
    title: "Interview Prep",
    description: "Practice answers, role specific questions and confidence notes for your next interview.",
    href: "/tools/interview-prep",
    icon: MessagesSquare,
    badge: "Premium",
  },
  {
    title: "Portfolio Builder",
    description: "Turn your projects, proof of work and case studies into a clean career portfolio.",
    href: "/tools/portfolio-builder",
    icon: MonitorUp,
    badge: "Premium",
  },
];

function ToolIcon({ iconKey }: { iconKey: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={TOOL_ICON_PATHS[iconKey] || TOOL_ICON_PATHS["business-helper"]} />
    </svg>
  );
}

function ToolCard({ tool, premium }: { tool: ToolRow; premium?: boolean }) {
  return (
    <Link
      href={tool.href!}
      className={`group relative flex h-full min-w-0 flex-col overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-[border-color,background-color,transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        premium ? "border-primary/30 bg-primary/5" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${premium ? "bg-primary/15 text-primary" : "bg-muted text-foreground"}`}>
          <ToolIcon iconKey={tool.icon_key} />
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
            premium ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {tool.badge}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-bold text-foreground">{tool.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{tool.description}</p>
      {tool.detail && (
        <p className="mt-4 border-t border-border pt-3 text-xs font-semibold text-primary">{tool.detail}</p>
      )}
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        Open tool
      </span>
    </Link>
  );
}

function CareerSection() {
  return (
    <div className="space-y-14">
      <section className="grid gap-5 lg:grid-cols-4">
        {CAREER_TOOLS.map((tool, i) => {
          const Icon = tool.icon;
          const content = (
            <div className="flex h-full flex-col rounded-lg border border-border bg-card p-6 transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5 hover:border-primary/35">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase text-muted-foreground">{tool.badge}</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">{tool.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{tool.description}</p>
              <span className="mt-5 text-sm font-semibold text-primary">{tool.href ? "Open tool" : "Coming soon"}</span>
            </div>
          );

          return (
            <Reveal key={tool.title} delay={i * 40}>
              {tool.href ? (
                <Link href={tool.href} className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  {content}
                </Link>
              ) : (
                content
              )}
            </Reveal>
          );
        })}
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Reveal>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
              9 CV templates
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Choose the CV style that matches the opportunity.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              The free starter gives every user a clean ATS friendly CV. Paid access unlocks more styles for senior roles, creative roles, tech profiles, academic tracks and portfolio led applications.
            </p>
            <Link href="/tools/cv-builder" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Browse in CV Builder
            </Link>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <div className="grid gap-3 sm:grid-cols-3">
            {CV_TEMPLATES.map((template) => (
              <div key={template.key} className="rounded-lg border border-border bg-card p-4">
                <div className="mb-3 aspect-[1/1.414] overflow-hidden rounded-md border border-border bg-muted">
                  <TemplatePreview templateKey={template.key} />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold leading-5 text-foreground">{template.label}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${template.access === "free" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                    {template.access}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{template.tone}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section>
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-lg border border-primary/20 bg-primary/5 p-8">
            <div>
              <h2 className="text-lg font-bold text-foreground">Unlock Career Tools with Premium</h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">Get premium CV templates, CV Checker, Interview Prep and Portfolio Builder with one membership.</p>
            </div>
            <Link href="/account/membership" className="inline-flex min-h-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              View membership plans
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

export default function ToolsPage() {
  const [category, setCategory] = useState<"career" | "business">("career");
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);

  useEffect(() => {
    async function loadTools() {
      const { data: toolData } = await supabase
        .from("tools")
        .select("key, category, title, description, detail, icon_key, badge, gated, href")
        .eq("status", "published")
        .order("position");
      setTools(toolData || []);
      setLoadingTools(false);
    }
    loadTools();
  }, []);

  const businessTools = tools.filter((t) => t.category === "business");
  const premium = businessTools.filter((t) => t.gated);
  const free = businessTools.filter((t) => !t.gated);

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-muted py-16 sm:py-20">
        <Container>
          <Reveal>
            <div className="mb-3 text-xs font-bold uppercase text-primary">Tools</div>
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Career and business tools that help you move with clarity.</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Build your CV, submit it for review, prepare for interviews, manage your business numbers and keep important work in one place.</p>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-6">
              <PillTabs tabs={CATEGORY_TABS} active={category} onChange={setCategory} />
            </div>
          </Reveal>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          {category === "career" ? (
            <CareerSection />
          ) : loadingTools ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : (
            <>
              {businessTools.length === 0 && (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <BriefcaseBusiness className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-foreground">Business tools are being updated.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Check back shortly.</p>
                </div>
              )}
              {premium.length > 0 && (
                <div className="mb-10">
                  <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                    <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                    Premium access code required
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {premium.map((tool, i) => (
                      <Reveal key={tool.key} delay={i * 40} className="h-full min-w-0">
                        <ToolCard tool={tool} premium />
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}

              {free.length > 0 && (
                <div>
                  <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Free tools
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {free.map((tool, i) => (
                      <Reveal key={tool.key} delay={i * 40} className="h-full min-w-0">
                        <ToolCard tool={tool} />
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Container>
      </section>

      {category === "business" && (
        <section className="pb-16">
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-6 rounded-lg border border-primary/20 bg-primary/5 p-8">
              <div>
                <h2 className="text-lg font-bold text-foreground">Need a Premium access code?</h2>
                <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">The premium tools are available to Prowess Digital Solutions clients. Reach out to get your code and unlock the full business suite.</p>
              </div>
              <Link href="/contact" className="inline-flex min-h-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Get access
              </Link>
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}
