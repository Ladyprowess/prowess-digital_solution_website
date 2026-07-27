"use client";

import Image from "next/image";
import Container from "@/components/Container";
import AgencyPageHeader from "@/components/AgencyPageHeader";
import {
  GraduationCap,
  Users,
  Globe,
  ShieldCheck,
} from "lucide-react";

const values = [
  "Clarity",
  "Integrity",
  "Structure",
  "Simplicity",
  "Long-term thinking",
];

export default function AboutPage() {
  return (
    <div className="page-wrap">

      <AgencyPageHeader
        eyebrow="About Prowess"
        title={
          <>
            Structure first. <span className="text-primary">Growth follows.</span>
          </>
        }
        description="Most businesses do not fail because the founder lacked effort or ambition. They fail because the foundations were never properly built. Prowess Digital Solutions started in Nigeria to change that, and now works with founders everywhere who deserve the same quality of business support."
        primaryAction={{ label: "Start a Conversation", href: "/contact" }}
        secondaryAction={{ label: "Read Our Story", href: "#our-story" }}
        proof={[
          "Founder led business guidance",
          "Fixed scope diagnostics and documentation",
          "Support for founders building globally",
        ]}
      />

      {/* ── WHY WE EXIST ──────────────────────────────────────────────────── */}
      <section className="section">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="h2">Why Prowess Digital Solutions Exists</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              We are a business consulting company that started in Nigeria and now works with
              founders everywhere. We help people build structured, sustainable businesses through
              fixed scope diagnostics, practical tools, and hands on documentation. Not quick fixes.
              Not empty advice. Real support that stays with you as you grow.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ValueCard
              icon="lightbulb"
              title="Clarity Before Anything Else"
              desc="Every successful business starts with clear thinking. We help you understand exactly what your business needs and why, before you invest more time or money into the wrong things."
            />
            <ValueCard
              icon="building"
              title="Foundations Built Properly"
              desc="Shortcuts create expensive problems later. We help you build the operational structure, systems, and processes that support real growth, not just the appearance of it."
            />
            <ValueCard
              icon="chart"
              title="Long-Term Thinking"
              desc="We are not interested in what works for three months. Our approach focuses on sustainable systems and decisions that compound and hold up as your business grows."
            />
            <ValueCard
              icon="people"
              title="Tools That Actually Work"
              desc="We built a suite of practical digital tools to help founders track numbers, manage cash, handle invoices, and plan growth without the guesswork."
            />
            <ValueCard
              icon="shield"
              title="Honest Guidance"
              desc="Sometimes the most valuable advice is to slow down, fix the foundation, or take a different path. We tell you what you need to hear, not what feels comfortable."
            />
            <ValueCard
              icon="settings"
              title="Structure Over Chaos"
              desc="Business is not chaos; it is a series of systems working together. We bring order to the complexity through clear frameworks, defined roles, and documented processes."
            />
          </div>
        </Container>
      </section>

      {/* ── THE STORY ─────────────────────────────────────────────────────── */}
      <section id="our-story" className="section">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="h2">The Story Behind Prowess Digital Solutions</h2>
              <div className="mt-5 space-y-5 leading-relaxed text-muted-foreground">
                <p>
                  After spending years watching talented entrepreneurs fail, not because their
                  ideas were bad but because they lacked proper business foundations, it became
                  clear that something had to change. Too many business owners were struggling
                  with the same problems: unclear structure, no systems, decisions made under
                  pressure, and no one in their corner who actually understood how business works.
                </p>
                <p>
                  Prowess Digital Solutions started in Nigeria, built to be the support that many
                  entrepreneurs there never had access to. Not a generic consulting firm with
                  frameworks copied from somewhere else. A practical, honest partner that
                  understands the real conditions of building a business, and works with you to
                  build something that lasts, wherever you are building it.
                </p>
                <p>
                  We started with consulting and grew into building our own tools, because we
                  realised that great advice without the right systems to support it only goes
                  so far. Today, Prowess Digital Solutions combines fixed scope diagnostics,
                  practical digital tools, and hands on documentation into one focused offering,
                  for founders who are serious about building properly, wherever they are.
                </p>
              </div>

              <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <p className="italic leading-relaxed text-foreground">
                  &ldquo;Before I do anything in business, I speak to Prowess Digital Solutions.&rdquo;
                  We will save you from countless expensive mistakes and help you build
                  something sustainable.
                </p>
                <div className="mt-5">
                  <p className="font-semibold text-foreground">Ngozi Peace Okafor</p>
                  <p className="text-sm text-muted-foreground">Founder, Prowess Digital Solutions</p>
                </div>
              </div>
            </div>

            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <Image
                src="/images/ngozi-peace-okafor-2.png"
                alt="Ngozi Peace Okafor"
                fill
                className="object-cover object-center"
                priority
              />
            </div>
          </div>
        </Container>
      </section>

      {/* ── MISSION ───────────────────────────────────────────────────────── */}
      <section className="section">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="h2">Our Mission</h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              To help founders everywhere build structured, sustainable businesses by giving
              them the fixed scope support, practical tools, and documentation they need to
              grow with confidence and without chaos.
            </p>
          </div>
        </Container>
      </section>

      {/* ── VALUES ────────────────────────────────────────────────────────── */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
              Our Values
            </h2>
            <p className="text-lg text-muted-foreground">
              Simple thinking, clear steps, and long-term business growth.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {values.map((value) => (
              <div
                key={value}
                className="group inline-flex items-center gap-3 rounded-full border-2 border-primary/20 bg-card px-8 py-4 shadow-sm transition hover:border-primary hover:shadow-lg"
              >
                <div className="h-2 w-2 rounded-full bg-primary transition group-hover:scale-125" />
                <span className="text-base font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-16 max-w-3xl rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background p-10 text-center shadow-xl">
            <p className="text-lg leading-relaxed text-foreground sm:text-xl">
              <span className="font-bold text-foreground">The feeling we aim for:</span>
              <br />
              <em>This place understands business properly.</em>
            </p>
          </div>
        </div>
      </section>

      {/* ── FRAMEWORK IMAGE ───────────────────────────────────────────────── */}
      <section className="section">
        <Container>
          <div className="mx-auto max-w-6xl">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <Image
                src="/images/prowess-clarity-framework.png"
                alt="Prowess Digital Solutions framework: Diagnostic, SOP Vault, Go To Market Playbook, and Financial Dashboard"
                width={1600}
                height={900}
                className="h-auto w-full object-contain"
                priority
              />
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              A simple view of how we guide business owners from confusion to clarity.
            </p>
          </div>
        </Container>
      </section>

      {/* ── WHY THEY TRUST US ─────────────────────────────────────────────── */}
      <section className="section">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="h2">Why Business Owners Trust Us</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <TrustCard
              icon={<GraduationCap size={28} />}
              title="Structured Expertise"
              desc="Years of business strategy experience with practical frameworks that hold up in any market."
            />
            <TrustCard
              icon={<Users size={28} />}
              title="Long-Term Relationships"
              desc="Most of our clients come back, because building a business is ongoing and consistent support makes a real difference."
            />
            <TrustCard
              icon={<Globe size={28} />}
              title="Built From Real Experience"
              desc="Tested first in one of the hardest markets to build a business in. What holds up there holds up anywhere."
            />
            <TrustCard
              icon={<ShieldCheck size={28} />}
              title="Honest Guidance"
              desc="A reputation built on telling clients what they need to hear, not what they want to hear."
            />
          </div>
        </Container>
      </section>

    </div>
  );
}

/* ── COMPONENTS ──────────────────────────────────────────────────────────── */

function ValueCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon?: "lightbulb" | "building" | "chart" | "people" | "shield" | "settings";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          {iconEmoji(icon)}
        </span>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <p className="leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function TrustCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex justify-center text-primary">{icon}</div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

function iconEmoji(
  icon?: "lightbulb" | "building" | "chart" | "people" | "shield" | "settings"
) {
  const paths: Record<string, string> = {
    lightbulb: "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18",
    building: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21",
    chart: "M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941",
    people: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
    shield: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
    settings: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z",
  };
  const d = (icon && paths[icon]) || "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}
