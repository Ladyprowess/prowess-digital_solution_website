import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  Map,
  Search,
  Target,
  Users,
  Wrench,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About | Prowess Digital Solutions",
  description:
    "Prowess Digital Solutions helps individuals build careers and helps businesses create clearer systems, using practical learning, resources, tools and services.",
};

const platformAreas = [
  {
    title: "Career paths",
    description: "Structured direction for people choosing, changing or strengthening a career.",
    href: "/career-paths",
    icon: Map,
  },
  {
    title: "Learning",
    description: "Courses, videos and practical resources connected to real skills.",
    href: "/learn",
    icon: GraduationCap,
  },
  {
    title: "Jobs",
    description: "Work opportunities organised so people can find relevant roles faster.",
    href: "/jobs",
    icon: BriefcaseBusiness,
  },
  {
    title: "Opportunities",
    description: "Scholarships, internships, grants, fellowships and programmes worth applying for.",
    href: "/opportunities",
    icon: Target,
  },
  {
    title: "Career tools",
    description: "CV, interview and portfolio tools that help users present themselves well.",
    href: "/tools",
    icon: Wrench,
  },
  {
    title: "Resources",
    description: "Guides, templates, ebooks, articles and videos people can return to anytime.",
    href: "/resources",
    icon: BookOpen,
  },
];

const workAreas = [
  {
    eyebrow: "For individuals",
    title: "Build a clearer path.",
    text:
      "Prowess helps people understand what to learn, where to apply, how to prepare and how to keep their progress organised.",
    points: ["Career direction", "Courses and resources", "Jobs and opportunities", "CV and interview support"],
  },
  {
    eyebrow: "For businesses",
    title: "Build better systems.",
    text:
      "Prowess also supports founders and teams with practical tools, documentation, operating support and digital solutions.",
    points: ["Business tools", "SOP documentation", "Practical templates", "Operational support"],
  },
];

const principles = [
  {
    title: "Practical first",
    description: "Every page, tool and resource should help someone take the next useful step.",
    icon: Target,
  },
  {
    title: "Clear structure",
    description: "People should understand what belongs together and what action comes next.",
    icon: FileText,
  },
  {
    title: "Human support",
    description: "Manual reviews, events and services exist because some things need a real person.",
    icon: Users,
  },
  {
    title: "Useful access",
    description: "Free and paid parts can both be valuable. The difference is depth, not quality.",
    icon: CheckCircle2,
  },
];

const journey = [
  "Choose a direction",
  "Build the right skills",
  "Use practical resources",
  "Prepare your application",
  "Apply with more confidence",
];

function FocusLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "quiet";
}) {
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
      : variant === "secondary"
        ? "border border-border bg-card text-foreground hover:bg-muted"
        : "text-primary hover:text-primary/80";

  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${styles}`}
    >
      {children}
    </Link>
  );
}

export default function AboutPage() {
  return (
    <div className="page-wrap overflow-x-hidden bg-background">
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in oklch, var(--primary) 6%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--primary) 6%, transparent) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(to bottom, #000 0%, transparent 78%)",
          }}
        />
        <Container>
          <div className="relative grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:py-24">
            <Reveal>
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  About Prowess Digital Solutions
                </p>
                <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Practical growth support for careers and businesses.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                  Prowess brings career direction, learning, opportunities, resources and business
                  support into one organised place. It is built for people who want useful guidance,
                  not noise.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <FocusLink href="/career-paths">
                    Explore career paths <ArrowRight aria-hidden="true" size={18} />
                  </FocusLink>
                  <FocusLink href="/services" variant="secondary">
                    See business support
                  </FocusLink>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120} y={18}>
              <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted">
                  <Image
                    src="/images/ngozi-peace-okafor-1.jpg"
                    alt="Ngozi Peace Okafor, founder of Prowess Digital Solutions"
                    fill
                    sizes="(min-width: 1024px) 420px, 100vw"
                    className="object-cover object-top"
                    priority
                  />
                </div>
                <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
                  <div>
                    <p className="text-lg font-semibold text-foreground">Careers</p>
                    <p className="text-xs text-muted-foreground">Paths, jobs, tools</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">Learning</p>
                    <p className="text-xs text-muted-foreground">Courses, videos, guides</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">Business</p>
                    <p className="text-xs text-muted-foreground">Systems, support, resources</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section bg-card">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  What we do
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  One platform, connected around your next step.
                </h2>
                <p className="mt-5 text-base leading-8 text-muted-foreground">
                  Prowess brings direction, learning, work, opportunities and resources together so
                  people are not guessing where to go next.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={80} y={18}>
            <div className="mt-10 rounded-lg border border-border bg-background p-5 shadow-sm sm:p-6">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
                {[
                  { label: "Find direction", detail: "Career paths and skills", icon: Map },
                  { label: "Build ability", detail: "Courses and resources", icon: GraduationCap },
                  { label: "Move forward", detail: "Jobs, tools and opportunities", icon: Target },
                ].map((step, index, arr) => (
                  <div key={step.label} className="contents">
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <step.icon aria-hidden="true" size={18} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{step.label}</p>
                          <p className="text-xs leading-5 text-muted-foreground">{step.detail}</p>
                        </div>
                      </div>
                    </div>
                    {index < arr.length - 1 && (
                      <div className="flex justify-center text-primary">
                        <ArrowRight aria-hidden="true" className="hidden h-5 w-5 md:block" />
                        <div className="h-6 w-px bg-border md:hidden" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platformAreas.map((area, index) => (
              <Reveal key={area.title} delay={index * 45} y={14}>
                <Link
                  href={area.href}
                  className="group flex h-full min-h-[220px] flex-col rounded-lg border border-border bg-background p-5 transition hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <area.icon aria-hidden="true" size={20} />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-foreground">{area.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {area.description}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-primary">
                    Open <ArrowRight aria-hidden="true" size={16} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="section bg-background">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            {workAreas.map((area, index) => (
              <Reveal key={area.eyebrow} delay={index * 80} y={18}>
                <article className="h-full rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    {area.eyebrow}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {area.title}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-muted-foreground">{area.text}</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {area.points.map((point) => (
                      <div key={point} className="flex items-start gap-3">
                        <CheckCircle2
                          aria-hidden="true"
                          className="mt-0.5 h-5 w-5 flex-none text-primary"
                        />
                        <span className="text-sm font-medium text-foreground">{point}</span>
                      </div>
                    ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="section bg-muted/60">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Why it exists
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  People need direction they can actually use.
                </h2>
                <div className="mt-5 space-y-5 text-base leading-8 text-muted-foreground">
                  <p>
                    Prowess started from a simple observation. People were searching for jobs,
                    learning resources, opportunities, templates and support in too many different
                    places. Businesses were also trying to grow without clear systems.
                  </p>
                  <p>
                    The platform brings those needs together with a practical standard. Make the
                    next step clear. Make the resource useful. Make the support structured enough
                    for people to act on it.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={100} y={18}>
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <p className="text-sm font-semibold text-foreground">A clearer journey</p>
                <div className="mt-5 space-y-3">
                  {journey.map((step, index) => (
                    <div key={step} className="flex items-center gap-4 rounded-lg bg-muted/60 p-4">
                      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-background text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section bg-background">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                How we work
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Calm, clear and useful.
              </h2>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((principle, index) => (
              <Reveal key={principle.title} delay={index * 55} y={14}>
                <article className="h-full rounded-lg border border-border bg-card p-5 shadow-sm">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <principle.icon aria-hidden="true" size={20} />
                  </span>
                  <h3 className="mt-5 text-base font-semibold text-foreground">
                    {principle.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {principle.description}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="section bg-card">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center">
            <Reveal>
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
                <Image
                  src="/images/ngozi-peace-okafor.jpg"
                  alt="Ngozi Peace Okafor"
                  fill
                  sizes="(min-width: 1024px) 360px, 100vw"
                  className="object-cover object-top"
                />
              </div>
            </Reveal>
            <Reveal delay={100} y={18}>
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Founder
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Built by Ngozi Peace Okafor.
                </h2>
                <p className="mt-5 text-base leading-8 text-muted-foreground">
                  Prowess Digital Solutions was built from hands on work with people, founders and
                  teams who needed clearer structure. The goal is still the same today. Help people
                  understand what to do next, then give them the tools and support to do it well.
                </p>
                <blockquote className="mt-6 border-l-4 border-primary pl-5 text-lg font-medium leading-8 text-foreground">
                  &ldquo;The work is simple. Make useful things easier to find, easier to
                  understand and easier to act on.&rdquo;
                </blockquote>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="section bg-muted/60">
        <Container>
          <div className="rounded-lg border border-border bg-background p-6 shadow-sm sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <Reveal>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Good to know
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Some content points you to external providers.
                  </h2>
                  <p className="mt-4 text-base leading-8 text-muted-foreground">
                    Some jobs, opportunities, videos and materials are sourced from third parties
                    because they are useful. When an application, job, programme or service is
                    external, that provider is responsible for its own process, terms and
                    availability.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={80} y={14}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-card p-4">
                    <Search aria-hidden="true" className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-sm font-semibold text-foreground">Curated links</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Shared because they can help users move forward.
                    </p>
                  </div>
                  <div className="rounded-lg bg-card p-4">
                    <CalendarDays aria-hidden="true" className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-sm font-semibold text-foreground">Live updates</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Events, jobs and opportunities can change after they are published.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-primary py-16 text-primary-foreground sm:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <Reveal>
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
                  Start here
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Find the part of Prowess that fits what you are building.
                </h2>
              </div>
            </Reveal>
            <Reveal delay={80} y={14}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <FocusLink href="/learn" variant="secondary">
                  Browse learning
                </FocusLink>
                <FocusLink href="/contact" variant="secondary">
                  Contact us
                </FocusLink>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </div>
  );
}
