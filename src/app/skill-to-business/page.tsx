"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Container from "@/components/Container";
import AgencyPageHeader from "@/components/AgencyPageHeader";
import { Reveal } from "@/components/Reveal";
import SkillToBusinessIntakeModal from "@/components/SkillToBusinessIntakeModal";

const graduateSpotlights = [
  { src: "/images/skill to business/review 1.png", name: "Bolu Adebayo" },
  { src: "/images/skill to business/review 2.png", name: "Ngozi Eze" },
  { src: "/images/skill to business/review 3.png", name: "Fatima Musa" },
  { src: "/images/skill to business/review 4.png", name: "Amina Yusuf" },
  { src: "/images/skill to business/review 5.png", name: "Kunle Akinyemi" },
  { src: "/images/skill to business/review 6.png", name: "Chinedu Okoro" },
  { src: "/images/skill to business/review 7.png", name: "Grace Nwankwo" },
];

const gapCards = [
  {
    title: "Skills Without Direction",
    desc: "Hairdressers, tailors, bakers, photographers, and tech graduates finish training with skills but no business plan.",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
  {
    title: "No Business Foundation",
    desc: "No pricing strategy. No customer acquisition plan. No understanding of how to structure and sustain income.",
    icon: "M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941",
  },
  {
    title: "Missed Potential",
    desc: "Talented people drift back into unemployment because nobody equipped them to launch. The skill was there. The system was not.",
    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
  },
];

const whatYouGet = [
  "A live Business Foundation Session, not a generic course",
  "The full Business Starter Pack of tools, templates, and guides",
  "A co-branded certificate to show you are business ready",
  "Full access to every premium business tool for 12 months",
];

const foundationSessionCovers = [
  {
    title: "Turning a skill into a business",
    desc: "Moving from practitioner mindset to business owner thinking.",
  },
  {
    title: "Pricing properly, not guessing",
    desc: "How to set prices that are profitable and competitive.",
  },
  {
    title: "Finding first customers",
    desc: "Practical strategies to attract paying clients immediately.",
  },
  {
    title: "Basic branding that builds trust",
    desc: "Simple steps to look professional from day one.",
  },
  {
    title: "Common early-stage business mistakes to avoid",
    desc: "The pitfalls that kill most new businesses in their first year.",
  },
  {
    title: "What to focus on in the first 90 days",
    desc: "A clear priority list for the early launch period.",
  },
];

const starterPack = [
  {
    title: "Business Registration Support",
    items: [
      "Local business registration walkthrough",
      "Legal document templates (contract, invoice)",
      "Tax & bank setup checklist",
      "Post-registration compliance guide",
    ],
    icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
  },
  {
    title: "Business Starter E-Books",
    items: [
      "From Skill to Business guide",
      "Pricing and profit basics",
      "Simple business structure handbook",
      "12-month business roadmap planner",
    ],
    icon: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  },
  {
    title: "Digital Presence & Marketing Toolkit",
    items: [
      "WhatsApp & Instagram optimisation guide",
      "30-day conversion content plan",
      "Launch & closing scripts",
      "Lead tracking sheet",
    ],
    icon: "M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535",
  },
  {
    title: "Financial & Operations Basics",
    items: [
      "Startup cost & break-even calculator",
      "Profit & cashflow tracker",
      "90-day survival plan",
      "Weekly CEO review checklist",
    ],
    icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.625c.621 0 1.125.504 1.125 1.125v.375M3.75 4.5H21m-17.25 0v9.75A2.25 2.25 0 006 16.5h12a2.25 2.25 0 002.25-2.25V4.5",
  },
];

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

const SPOTLIGHT_AUTO_ADVANCE_MS = 6000;

export default function SkillToBusinessPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [spotlightPaused, setSpotlightPaused] = useState(false);
  const spotlightCount = graduateSpotlights.length;
  const spotlightSlides = Array.from({ length: Math.ceil(spotlightCount / 2) }, (_, i) => [
    graduateSpotlights[(i * 2) % spotlightCount],
    graduateSpotlights[(i * 2 + 1) % spotlightCount],
  ]);
  const spotlightTotal = spotlightSlides.length;

  const goToSpotlight = (i: number) =>
    setSpotlightIndex(((i % spotlightTotal) + spotlightTotal) % spotlightTotal);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || spotlightPaused) return;
    const id = setInterval(() => setSpotlightIndex((i) => (i + 1) % spotlightTotal), SPOTLIGHT_AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [spotlightPaused, spotlightTotal]);

  return (
    <div className="pb-16">
      <AgencyPageHeader
        eyebrow="Skill to Business"
        title={
          <>
            You have the skill. <span className="text-primary">Let&apos;s build the business.</span>
          </>
        }
        description="A hands-on program for hairdressers, tailors, bakers, photographers, tech talent, and every other skilled person ready to turn what they do into a real, structured business, wherever they are."
        primaryAction={{ label: "Enroll Now - $100", href: "#enroll" }}
        secondaryAction={{ label: "See What's Included", href: "#whats-included" }}
        proof={[
          "Live Business Foundation Session",
          "Full Starter Pack of tools and guides",
          "12 months of access to every premium tool",
        ]}
      />

      {/* ── THE GAP ──────────────────────────────────────────────────────── */}
      <section className="section bg-background">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="h2">The Gap Between Skill and Business</h2>
              <p className="lead mt-4">
                Many people learn valuable skills. But most struggle to turn those skills into
                stable businesses.
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="mx-auto mt-8 max-w-3xl rounded-2xl bg-primary/10 p-6 text-center sm:p-8">
              <p className="text-lg font-semibold text-foreground sm:text-xl">
                The problem is not skill. <span className="font-normal text-muted-foreground">The problem is a lack of business structure.</span>
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {gapCards.map((card, i) => (
              <Reveal key={card.title} delay={i * 90}>
                <div className="group h-full rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] ring-1 ring-primary/10">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                    </svg>
                  </div>
                  <h3 className="mt-4 font-bold text-foreground">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── WHAT YOU GET ─────────────────────────────────────────────────── */}
      <section id="whats-included" className="section bg-card">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <Reveal as="div">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">The Program</p>
              <h2 className="text-3xl font-bold leading-snug text-foreground sm:text-4xl">
                Skill to Business, Done Properly
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                We work directly with skilled people ready to move from skill ownership to business
                ownership. Not a generic course. A structured, hands-on program built around what
                actually gets a business started and paying.
              </p>
              <p className="mt-5 text-lg font-semibold italic text-primary">
                This is not motivation talk. It is real business support.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <div className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  What You Get
                </p>
                <div className="space-y-4">
                  {whatYouGet.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <CheckIcon />
                      </span>
                      <span className="text-sm leading-6 text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── FOUNDATION SESSION ───────────────────────────────────────────── */}
      <section className="section bg-background">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <Reveal as="div">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Business Foundation Session</p>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                A practical, live session built for you
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Delivered one-on-one or in a small group, in person or online.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                60 to 90 minutes
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="rounded-2xl border border-border bg-card shadow-sm">
                <p className="border-b border-border px-6 py-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  What We Cover
                </p>
                <div className="divide-y divide-border">
                  {foundationSessionCovers.map((item) => (
                    <div key={item.title} className="flex items-start gap-3 px-6 py-4">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                        <CheckIcon />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── STARTER PACK ─────────────────────────────────────────────────── */}
      <section className="section bg-card">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="h2">The Business Starter Pack</h2>
              <p className="lead mt-4">
                Everything you need to launch properly and sustainably, yours to keep.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {starterPack.map((group, i) => (
              <Reveal key={group.title} delay={i * 90}>
                <div className="h-full rounded-2xl border border-border bg-background p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] ring-1 ring-primary/10">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={group.icon} />
                      </svg>
                    </div>
                    <h3 className="font-bold text-foreground">{group.title}</h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── PROOF ────────────────────────────────────────────────────────── */}
      <section className="section bg-background">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="h2">See It In Action</h2>
              <p className="lead mt-4">
                Real sessions, real graduates, real certificates.
              </p>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[
              {
                src: "/images/skill to business/Foundation Session.png",
                caption: "A live Foundation Session in progress",
              },
              {
                src: "/images/skill to business/certificate.png",
                caption: "Graduates with their Certificate of Business Readiness",
              },
            ].map((photo, i) => (
              <Reveal key={photo.src} delay={i * 90}>
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={photo.src}
                      alt={photo.caption}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="px-5 py-4 text-sm font-medium text-muted-foreground">{photo.caption}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── GRADUATE SPOTLIGHTS ──────────────────────────────────────────── */}
      <section className="section bg-card">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="h2">Testimonials</h2>
              <p className="lead mt-4">
              Real Graduates, Real Results
                words.
              </p>
            </div>
          </Reveal>

          <div
            className="relative mt-12"
            onMouseEnter={() => setSpotlightPaused(true)}
            onMouseLeave={() => setSpotlightPaused(false)}
          >
            <button
              type="button"
              onClick={() => goToSpotlight(spotlightIndex - 1)}
              aria-label="Previous graduate"
              className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md transition hover:opacity-80 sm:flex"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => goToSpotlight(spotlightIndex + 1)}
              aria-label="Next graduate"
              className="absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md transition hover:opacity-80 sm:flex"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${spotlightIndex * 100}%)` }}
              >
                {spotlightSlides.map((slide, slideIdx) => (
                  <div key={slideIdx} className="grid w-full flex-shrink-0 gap-6 px-1 sm:grid-cols-2">
                    {slide.map((g, i) => (
                      <div
                        key={`${g.src}-${i}`}
                        className="relative aspect-[3/2] w-full overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
                      >
                        <Image
                          src={g.src}
                          alt={`${g.name} - Certified Business Ready graduate`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2">
              {spotlightSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToSpotlight(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === spotlightIndex ? "w-6 bg-primary" : "w-2 bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── ENROLL CTA ────────────────────────────────────────────────────── */}
      <section id="enroll" className="section bg-primary">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl lg:text-5xl">
                Ready to Build the Business?
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-primary-foreground/80">
                One payment. Your Foundation Session, your full Starter Pack, your certificate, and
                12 months of access to every premium business tool.
              </p>
              <p className="mx-auto mt-6 text-4xl font-bold text-primary-foreground">$100</p>
              <p className="mt-1 text-sm text-primary-foreground/70">One-time payment. Enroll again next year if you want to.</p>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  onClick={() => setModalOpen(true)}
                  className="w-full rounded-xl bg-card px-10 py-4 text-base font-semibold text-primary shadow-lg transition hover:scale-[1.02] sm:w-auto"
                >
                  Enroll Now
                </button>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      <SkillToBusinessIntakeModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
