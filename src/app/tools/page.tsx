"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TOOL_ICON_PATHS } from "@/lib/tools/icons";
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

function ToolIcon({ iconKey }: { iconKey: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={TOOL_ICON_PATHS[iconKey] || TOOL_ICON_PATHS["business-helper"]} />
    </svg>
  );
}

function ToolCard({ tool, premium }: { tool: ToolRow; premium?: boolean }) {
  return (
    <Link
      href={tool.href!}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
        premium ? "border-primary/30 bg-primary/5" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${premium ? "bg-primary/15 text-primary" : "bg-muted text-foreground"}`}>
          <ToolIcon iconKey={tool.icon_key} />
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            premium ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {tool.badge}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-bold text-foreground">{tool.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
      {tool.detail && (
        <p className="mt-4 border-t border-border pt-3 text-xs font-semibold text-primary">{tool.detail}</p>
      )}
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary opacity-0 transition group-hover:opacity-100">
        Open tool →
      </span>
    </Link>
  );
}

function ComingSoonCard({ tool }: { tool: ToolRow }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <ToolIcon iconKey={tool.icon_key} />
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Coming Soon
        </span>
      </div>
      <h3 className="mt-4 text-lg font-bold text-foreground">{tool.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{tool.description}</p>
    </div>
  );
}

export default function ToolsPage() {
  const [category, setCategory] = useState<"career" | "business">("career");
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);

  useEffect(() => {
    async function loadTools() {
      const { data } = await supabase
        .from("tools")
        .select("key, category, title, description, detail, icon_key, badge, gated, href")
        .eq("status", "published")
        .order("position");
      setTools(data || []);
      setLoadingTools(false);
    }
    loadTools();
  }, []);

  const careerTools = tools.filter((t) => t.category === "career");
  const businessTools = tools.filter((t) => t.category === "business");
  const premium = businessTools.filter((t) => t.gated);
  const free = businessTools.filter((t) => !t.gated);

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="border-b border-border bg-muted py-16 sm:py-20">
        <Container>
          <Reveal>
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Tools</div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Tools to help you move forward.</h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">Career tools and business tools, in one place. Pick the ones built for you.</p>
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
          {loadingTools ? (
            <p className="text-sm text-muted-foreground">Loading tools…</p>
          ) : category === "career" ? (
            <>
              {careerTools.some((t) => t.href) && (
                <div className="mb-10">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Available Now</p>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {careerTools.filter((t) => t.href).map((tool, i) => (
                      <Reveal key={tool.key} delay={i * 40}>
                        <ToolCard tool={tool} />
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}

              {careerTools.some((t) => !t.href) && (
                <div>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Coming Soon</p>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {careerTools.filter((t) => !t.href).map((tool, i) => (
                      <Reveal key={tool.key} delay={i * 40}>
                        <ComingSoonCard tool={tool} />
                      </Reveal>
                    ))}
                  </div>
                  <p className="mt-6 text-sm text-muted-foreground">
                    While these are being built, explore <Link href="/career-paths" className="font-semibold text-primary hover:underline">Career Paths</Link>, <Link href="/learn" className="font-semibold text-primary hover:underline">Learn</Link>, or <Link href="/jobs" className="font-semibold text-primary hover:underline">Jobs</Link>.
                  </p>
                </div>
              )}

              {careerTools.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Career tools are on the way. In the meantime, explore <Link href="/career-paths" className="font-semibold text-primary hover:underline">Career Paths</Link>, <Link href="/learn" className="font-semibold text-primary hover:underline">Learn</Link>, or <Link href="/jobs" className="font-semibold text-primary hover:underline">Jobs</Link>.
                </p>
              )}
            </>
          ) : (
            <>
              {businessTools.length === 0 && (
                <p className="text-sm text-muted-foreground">Business tools are being updated. Check back shortly.</p>
              )}
              {premium.length > 0 && (
                <div className="mb-10">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Premium · Access Code Required</p>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {premium.map((tool, i) => (
                      <Reveal key={tool.key} delay={i * 40}>
                        <ToolCard tool={tool} premium />
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}

              {free.length > 0 && (
                <div>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Free · No Code Needed</p>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {free.map((tool, i) => (
                      <Reveal key={tool.key} delay={i * 40}>
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
            <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-primary/20 bg-primary/5 p-8">
              <div>
                <h2 className="text-lg font-bold text-foreground">Need a Premium access code?</h2>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">The premium tools are available to Prowess Digital Solutions clients. Reach out to get your code and unlock the full suite.</p>
              </div>
              <Link href="/contact" className="flex-shrink-0 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
                Get access →
              </Link>
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}
