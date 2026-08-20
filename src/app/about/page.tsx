import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Container from "@/components/Container";
import AgencyPageHeader from "@/components/AgencyPageHeader";
import { Reveal } from "@/components/Reveal";
import {
  Briefcase,
  Sparkles,
  Map,
  GraduationCap,
  Wrench,
  Users,
  BookOpen,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About | Prowess Digital Solutions",
  description:
    "Prowess Digital Solutions is a platform that brings jobs, opportunities, career paths, learning and resources together in one place, alongside tools and services for businesses.",
};

const whatYouCanDo = [
  { icon: Briefcase, title: "Find Work", desc: "Real, published job listings across roles and industries.", href: "/jobs" },
  { icon: Sparkles, title: "Find Opportunities", desc: "Scholarships, grants, fellowships and internships worth knowing about.", href: "/opportunities" },
  { icon: Map, title: "Explore Career Paths", desc: "Guided roadmaps connecting the skills, learning and roles that build a career.", href: "/career-paths" },
  { icon: GraduationCap, title: "Learn", desc: "Courses that build practical, usable skills.", href: "/learn" },
  { icon: Wrench, title: "Build", desc: "Business tools, calculators and templates for everyday operations.", href: "/tools" },
  { icon: Users, title: "Connect", desc: "Events and community moments worth showing up for.", href: "/events" },
  { icon: BookOpen, title: "Access Resources", desc: "Guides, e-books and videos you can actually use.", href: "/resources" },
];

const connectionSteps = ["Career", "Skills", "Learning", "Resources", "Opportunities", "Work"];

const approach = [
  { title: "Practical", desc: "Everything on the platform is built to be used, not just read." },
  { title: "Curated", desc: "Content is selected and organised, not dumped into a directory." },
  { title: "Accessible", desc: "A large portion of the platform stays free, by design." },
  { title: "Connected", desc: "Skills, learning, resources and opportunities are linked, not siloed." },
  { title: "Useful", desc: "If it does not help someone move forward, it does not belong here." },
];

export default function AboutPage() {
  return (
    <div className="page-wrap">

      {/* HERO */}
      <AgencyPageHeader
        eyebrow="About Prowess Digital Solutions"
        title={
          <>
            One platform for career growth, <span className="text-primary">and the business behind it.</span>
          </>
        }
        description="Prowess Digital Solutions brings jobs, opportunities, career paths, learning and resources together in one place, so individuals can keep moving forward without searching a dozen different websites - alongside tools and services built for businesses."
        primaryAction={{ label: "Explore the Platform", href: "/" }}
        secondaryAction={{ label: "What You Can Do", href: "#what-you-can-do" }}
      />

      {/* WHAT IS IT */}
      <section className="section">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="h2">What Is Prowess Digital Solutions?</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Prowess Digital Solutions is a career and opportunity platform. On the individual
                side, it connects jobs, opportunities, career paths, courses and resources so people
                can find work, build skills and move their careers forward in one place. On the
                business side, it offers practical tools, resources and digital solutions services
                that help businesses operate and grow. Both sides share the same standard: practical,
                curated, and built to actually be used.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* FOUNDER */}
      <section className="section">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-center">
            <Reveal>
              <div className="relative mx-auto aspect-[3/4] w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:w-full">
                <Image
                  src="/images/ngozi-peace-okafor-1.jpg"
                  alt="Ngozi Peace Okafor, Founder of Prowess Digital Solutions"
                  fill
                  sizes="(min-width: 1024px) 280px, 224px"
                  className="object-cover object-top"
                />
              </div>
            </Reveal>
            <Reveal delay={100} as="div">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Behind Prowess Digital Solutions</p>
              <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">Ngozi Peace Okafor, Founder</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Prowess Digital Solutions started as one person helping businesses fix the
                foundations no one else was paying attention to. That same instinct - build the
                thing that is actually useful, not the thing that looks impressive - is what shaped
                the platform it has grown into today.
              </p>
              <p className="mt-4 italic leading-relaxed text-foreground">
                &ldquo;The goal has never changed: give people something they can actually use to
                move forward, whether that is a business or a career.&rdquo;
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* WHY WE BUILT IT */}
      <section className="bg-muted py-20 sm:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <Reveal as="div">
              <h2 className="h2">Why We Built It</h2>
              <div className="mt-5 space-y-5 leading-relaxed text-muted-foreground">
                <p>
                  Finding a job is scattered across job boards. Finding a scholarship or grant is
                  scattered across mailing lists and social media. Learning a skill is scattered
                  across platforms that were never built to connect back to real opportunities.
                  Most people end up doing all of this separately, with no thread tying it together.
                </p>
                <p>
                  Prowess Digital Solutions exists to bring those pieces into one place, and to
                  connect them to each other. A career path points to the skills it needs. Those
                  skills point to courses and resources that teach them. Those, in turn, point to
                  the jobs and opportunities they prepare someone for. One thread, not a dozen tabs.
                </p>
              </div>
            </Reveal>
            <Reveal delay={120} y={30}>
              <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                <p className="text-lg font-semibold text-foreground">The problem, in short:</p>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Jobs, learning and opportunities are treated as unrelated things, scattered across
                  unrelated places. They are not unrelated. They are stages of the same journey.
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* WHAT YOU CAN DO */}
      <section id="what-you-can-do" className="section">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="h2">What You Can Do</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Seven things, one platform.
              </p>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {whatYouCanDo.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <Link
                  href={item.href}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon size={20} strokeWidth={1.8} />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{item.desc}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* HOW IT ALL CONNECTS */}
      <section className="bg-muted py-20 sm:py-24">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="h2">How It All Connects</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Nothing on the platform sits on its own. Every part points to the next.
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {connectionSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-3 sm:gap-4">
                  <div className="rounded-full border-2 border-primary/20 bg-card px-6 py-3 shadow-sm">
                    <span className="text-sm font-semibold text-foreground sm:text-base">{step}</span>
                  </div>
                  {i < connectionSteps.length - 1 && (
                    <span className="text-lg text-primary/50">→</span>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* FOR INDIVIDUALS */}
      <section className="section">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-2xl border border-border bg-card p-8 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">For Individuals</p>
                <h2 className="mt-3 text-2xl font-bold text-foreground">Built for anyone building a career</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Whether you are looking for your first job, changing direction, or trying to build
                  a specific skill set, the individual side of the platform is for you. It brings
                  together jobs, opportunities, career paths, courses and resources, so you can find
                  what you need and see what naturally comes next.
                </p>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="h-full rounded-2xl border border-border bg-card p-8 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">For Businesses</p>
                <h2 className="mt-3 text-2xl font-bold text-foreground">Practical support to operate and grow</h2>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Prowess Digital Solutions also helps businesses directly, through business tools,
                  practical resources, and digital solutions services for teams that need extra
                  hands or expertise.
                </p>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-primary">
                  <Link href="/tools" className="hover:underline">Business Tools →</Link>
                  <Link href="/resources" className="hover:underline">Resources →</Link>
                  <Link href="/services" className="hover:underline">Digital Solutions →</Link>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* FREE + PREMIUM */}
      <section className="bg-muted py-20 sm:py-24">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="h2">Free + Premium</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Most of the platform is free. Job listings, opportunities, career paths and a large
                share of learning resources are available at no cost, because access to a job or a
                scholarship should not depend on ability to pay. Premium content exists alongside it,
                for people who want to go deeper - structured courses, in-depth guides and resources
                built for people who are serious about a specific skill or path. Free content is not
                a teaser for premium. It stands on its own.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* OUR APPROACH */}
      <section className="section">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="h2">Our Approach</h2>
            </div>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {approach.map((a, i) => (
              <Reveal key={a.title} delay={i * 60} y={12}>
                <div className="group h-full rounded-2xl border-2 border-primary/20 bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg">
                  <p className="text-base font-semibold text-foreground">{a.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* WHERE WE'RE GOING */}
      <section className="bg-muted py-20 sm:py-24">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="h2">Where Prowess Digital Solutions Is Going</h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Prowess Digital Solutions started as a digital solutions business, helping companies
                with practical tools and services. That work continues today. Alongside it, the
                platform has grown into something broader: a place for individuals to find jobs,
                opportunities, learning and resources in one connected system. That evolution is
                ongoing - more career paths, more opportunities, and more ways for the individual
                and business sides of the platform to support each other.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* CONTENT & EXTERNAL SOURCES */}
      <section className="section">
        <Container>
          <Reveal>
            <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
              <h2 className="text-xl font-bold text-foreground">Content &amp; External Sources</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Some jobs, opportunities, videos and other materials on this platform are sourced
                from third parties and shared because they are useful. Where an application or
                service is external, it remains subject to that provider&rsquo;s own terms, process
                and availability - Prowess Digital Solutions is not the employer, funder or service
                provider in those cases.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/70 py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Build what&rsquo;s next for you.</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-primary shadow-2xl transition hover:scale-[1.02] hover:bg-white/95"
            >
              Explore the Platform
            </Link>
            <Link
              href="/services"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/40 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              For Businesses →
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
