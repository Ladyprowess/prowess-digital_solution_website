"use client";

import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";
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

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0c1a1b] py-24 sm:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(80,124,128,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(80,124,128,.07) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 40%, #000 40%, transparent 100%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #507c80 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <Container>
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#507c80]/30 bg-[#507c80]/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#507c80]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#6a9ea3]">
                About Us
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Structure First.
              <span className="block text-[#507c80]">Growth Follows.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
              Most businesses do not fail because the founder lacked effort or ambition.
              They fail because the foundations were never properly built.
              Prowess Digital Solutions exists to change that; for African entrepreneurs
              who deserve the same quality of business support as anyone else in the world.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-[#507c80] px-8 py-3.5 font-semibold text-white transition hover:bg-[#3a5c60]"
              >
                Start a Conversation
              </Link>
              <Link
                href="#our-story"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                Our Story
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── WHY WE EXIST ──────────────────────────────────────────────────── */}
      <section className="section">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="h2">Why Prowess Digital Solutions Exists</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              We are a business consulting company built specifically for African entrepreneurs.
              We help founders build structured, sustainable businesses through hands-on consulting,
              practical tools, and structured training. Not quick fixes. Not empty advice.
              Real support that stays with you as you grow.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ValueCard
              icon="lightbulb"
              title="Clarity Before Anything Else"
              desc="Every successful business starts with clear thinking. We help you understand exactly what your business needs and why; before you invest more time or money into the wrong things."
            />
            <ValueCard
              icon="building"
              title="Foundations Built Properly"
              desc="Shortcuts create expensive problems later. We help you build the operational structure, systems, and processes that support real growth; not just the appearance of it."
            />
            <ValueCard
              icon="chart"
              title="Long-Term Thinking"
              desc="We are not interested in what works for three months. Our approach focuses on sustainable systems and decisions that compound and hold up as your business grows."
            />
            <ValueCard
              icon="people"
              title="Tools That Actually Work"
              desc="We built a suite of practical digital tools specifically for African entrepreneurs; to help them track numbers, manage cash, handle invoices, and plan growth without the guesswork."
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
              <div className="mt-5 space-y-5 leading-relaxed text-slate-600">
                <p>
                  After spending years watching talented entrepreneurs fail; not
                  because their ideas were bad, but because they lacked proper
                  business foundations; it became clear that something had to change.
                  Too many business owners were struggling with the same problems:
                  unclear structure, no systems, decisions made under pressure, and no
                  one in their corner who actually understood how business works on this continent.
                </p>
                <p>
                  Prowess Digital Solutions was built to be the support that most African
                  entrepreneurs never had access to. Not a generic consulting firm with
                  Western frameworks that do not translate. A practical, honest partner
                  that understands the real conditions of building a business in Africa;
                  and works with you to build something that lasts.
                </p>
                <p>
                  We started with consulting and grew into building our own tools,
                  because we realised that great advice without the right systems to
                  support it only goes so far. Today, Prowess Digital Solutions combines
                  hands-on consulting, practical digital tools, and structured training
                  into one focused offering; built entirely for African entrepreneurs
                  who are serious about building properly.
                </p>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="italic leading-relaxed text-slate-700">
                  "Before I do anything in business, I speak to Prowess Digital Solutions."
                  We will save you from countless expensive mistakes and help you build
                  something sustainable.
                </p>
                <div className="mt-5">
                  <p className="font-semibold text-slate-900">Ngozi Peace Okafor</p>
                  <p className="text-sm text-slate-600">Founder, Prowess Digital Solutions</p>
                </div>
              </div>
            </div>

            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              To help African entrepreneurs build structured, sustainable businesses
              by giving them the consulting support, practical tools, and training they need
              to grow with confidence and without chaos.
            </p>
          </div>
        </Container>
      </section>

      {/* ── VALUES ────────────────────────────────────────────────────────── */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Our Values
            </h2>
            <p className="text-lg text-slate-600">
              Simple thinking, clear steps, and long-term business growth.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {values.map((value) => (
              <div
                key={value}
                className="group inline-flex items-center gap-3 rounded-full border-2 border-[#507c80]/20 bg-white px-8 py-4 shadow-sm transition hover:border-[#507c80] hover:shadow-lg"
              >
                <div className="h-2 w-2 rounded-full bg-[#507c80] transition group-hover:scale-125" />
                <span className="text-base font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-16 max-w-3xl rounded-3xl border-2 border-[#507c80]/20 bg-gradient-to-br from-[#507c80]/5 to-white p-10 text-center shadow-xl">
            <p className="text-lg leading-relaxed text-slate-700 sm:text-xl">
              <span className="font-bold text-slate-900">The feeling we aim for:</span>
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
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <Image
                src="/images/prowess-clarity-framework.png"
                alt="Prowess Digital Solutions framework: Business Clarity and Strategy, Systems and Operations, Training and Mentorship, Structured Business Packages"
                width={1600}
                height={900}
                className="h-auto w-full object-contain"
                priority
              />
            </div>
            <p className="mt-4 text-center text-sm text-slate-500">
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
              desc="Years of business strategy experience with practical frameworks built for African markets."
            />
            <TrustCard
              icon={<Users size={28} />}
              title="Long-Term Relationships"
              desc="Most of our clients come back; because building a business is ongoing and consistent support makes a real difference."
            />
            <TrustCard
              icon={<Globe size={28} />}
              title="Built for Africa"
              desc="Deep understanding of how business actually works on this continent, not generic advice designed for a different market."
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
          {iconEmoji(icon)}
        </span>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="leading-relaxed text-slate-600">{desc}</p>
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md">
      <div className="mb-4 flex justify-center text-[#507c80]">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 leading-relaxed text-slate-600">{desc}</p>
    </div>
  );
}

function iconEmoji(
  icon?: "lightbulb" | "building" | "chart" | "people" | "shield" | "settings"
) {
  switch (icon) {
    case "lightbulb": return "💡";
    case "building":  return "🏢";
    case "chart":     return "📈";
    case "people":    return "👥";
    case "shield":    return "🛡️";
    case "settings":  return "⚙️";
    default:          return "✦";
  }
}