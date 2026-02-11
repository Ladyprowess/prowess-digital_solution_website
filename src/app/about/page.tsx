"use client";

import Image from "next/image";
import Container from "@/components/Container";
import {
  GraduationCap,
  Users,
  Globe,
  ShieldCheck,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
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
      {/* OUR PHILOSOPHY */}
      <section className="section">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <p className="pill mx-auto w-fit">
              <span className="text-sm uppercase tracking-wider text-slate-600">
                Our Philosophy
              </span>
            </p>

            <h1 className="h1 mt-6">
              The First Conversation Every Business Owner Should Have
            </h1>

            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              Before marketing strategies, before scaling plans, before anything
              else, there’s clarity. We exist in the space between confusion and
              confidence, serving as your lighthouse through the complexities of
              business building.
            </p>
          </div>
        </Container>
      </section>

      {/* WHY WE EXIST + CORE PHILOSOPHY CARDS */}
      <section className="section">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="h2">Why Prowess Digital Solutions Exists</h2>

            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              We&apos;re not another marketing agency promising quick wins.
              We&apos;re the structured thinking partner you need before making
              any major business decision.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ValueCard
              icon="lightbulb"
              title="Clarity Before Execution"
              desc="Every successful business starts with clear thinking. We help you understand what you're building and why, before you spend a single naira on execution."
            />
            <ValueCard
              icon="building"
              title="Foundations Built Properly"
              desc="Shortcuts lead to expensive corrections later. We help you build business foundations that support long-term growth, not just quick wins."
            />
            <ValueCard
              icon="chart"
              title="Long-Term Thinking"
              desc="We&apos;re not interested in tactics that work for three months. Our approach focuses on sustainable systems that compound over years."
            />
            <ValueCard
              icon="people"
              title="Education Over Profits"
              desc="We teach you how business actually works. Our goal is to make you a better business owner, not just a paying client."
            />
            <ValueCard
              icon="shield"
              title="Honest Guidance"
              desc="Sometimes the best advice is to wait, pivot, or stop. We&apos;ll tell you what you need to hear, not what you want to hear."
            />
            <ValueCard
              icon="settings"
              title="Structured Approaches"
              desc="Business isn&apos;t chaos, it&apos;s a series of systems. We bring order to complexity through proven frameworks and methodologies."
            />
          </div>
        </Container>
      </section>

     
      {/* THE STORY */}
      <section className="section">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="h2">The Story Behind Prowess Digital Solutions</h2>

              <div className="mt-5 space-y-5 leading-relaxed text-slate-600">
                <p>
                  After spending years watching talented entrepreneurs fail not
                  because their ideas were bad, but because they lacked proper
                  business foundations, I knew something had to change. Too many
                  business owners were being sold marketing tactics when what
                  they really needed was clarity on their business model.
                </p>

                <p>
                  Prowess Digital Solutions was born from a simple observation:
                  most business failures aren&apos;t execution problems, they&apos;re
                  clarity problems. Entrepreneurs jump into tactics before
                  understanding strategy, invest in marketing before validating
                  their model, and scale before building a proper systems.
                </p>

                <p>
                  We positioned ourselves as the conversation that should happen
                  first. Not the marketing agency you hire after you&apos;ve figured
                  everything out, but the thinking partner you engage before
                  making any major business decision. We&apos;re the people you
                  call when you&apos;re confused, overwhelmed, or unsure of your
                  next step.
                </p>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="italic leading-relaxed text-slate-700">
                  “Before I do anything in business, I speak to Prowess Digital Solutions".
                  We&apos;ll save you from countless expensive mistakes and
                  help you build something sustainable.
                </p>

                <div className="mt-5">
                  <p className="font-semibold text-slate-900">
                    Ngozi Peace Okafor
                  </p>
                  <p className="text-sm text-slate-600">
                    Founder &amp; Chief Clarity Officer
                  </p>
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

      {/* OUR MISSION */}
      <section className="section">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="h2">Our Mission</h2>

            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            To be the starting point for business owners seeking clarity, helping them build with structure, confidence, and sustainable foundations that support long-term growth.
            </p>
          </div>
        </Container>
      </section>

      {/* OUR VALUES (PILLS) */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Our Values
            </h2>
            <p className="text-lg text-slate-600">
              We prefer simple thinking, clear steps, and long-term business
              growth.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {values.map((value) => (
              <div
                key={value}
                className="group inline-flex items-center gap-3 rounded-full border-2 border-[#507c80]/20 bg-white px-8 py-4 shadow-sm transition hover:border-[#507c80] hover:shadow-lg"
              >
                <div className="h-2 w-2 rounded-full bg-[#507c80] transition group-hover:scale-125" />
                <span className="text-base font-semibold text-slate-900">
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-16 max-w-3xl rounded-3xl border-2 border-[#507c80]/20 bg-gradient-to-br from-[#507c80]/5 to-white p-10 text-center shadow-xl">
            <p className="text-lg leading-relaxed text-slate-700 sm:text-xl">
              <span className="font-bold text-slate-900">
                The feeling we aim for:
              </span>
              <br />
              <em>This place understands business properly.</em>
            </p>
          </div>
        </div>
      </section>

       {/* FRAMEWORK IMAGE */}
<section className="section">
  <Container>
    <div className="mx-auto max-w-6xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <Image
          src="/images/prowess-clarity-framework.png"
          alt="Prowess Digital Solutions framework: Business Clarity & Strategy, Systems & Operations, Training & Mentorship, Structured Business Packages"
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
 


      {/* WHY BUSINESS OWNERS TRUST US */}
      <section className="section">
  <Container>
    <div className="mx-auto max-w-4xl text-center">
      <h2 className="h2">Why Business Owners Trust Us</h2>
    </div>

    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <TrustCard
        icon={<GraduationCap size={28} />}
        title="Structured Expertise"
        desc="15+ years of business strategy experience with proven frameworks"
      />

      <TrustCard
        icon={<Users size={28} />}
        title="Long-Term Relationships"
        desc="Average client relationship spans 3+ years of sustained growth"
      />

      <TrustCard
        icon={<Globe size={28} />}
        title="Local Context"
        desc="Deep understanding of the local business environment with global best practices"
      />

      <TrustCard
        icon={<ShieldCheck size={28} />}
        title="Honest Guidance"
        desc="Reputation built on integrity and telling clients what they need to hear"
      />
    </div>
  </Container>
</section>


    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

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

function TeamCard({
  name,
  role,
  desc,
  image,
  socials,
}: {
  name: string;
  role: string;
  desc: string;
  image: string;
  socials: {
    x?: string;
    instagram?: string;
    facebook?: string;
    linkedin?: string;
  };
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Image
        src={image}
        alt={name}
        width={700}
        height={700}
        className="h-64 w-full object-cover"
      />

      <div className="p-5">
        <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
        <p className="text-sm text-slate-600">{role}</p>

        <p className="mt-3 leading-relaxed text-slate-600">{desc}</p>

        {/* SOCIAL LINKS */}
        <div className="mt-4 flex gap-4 text-[#507c80]">
          {socials.x && (
            <a
              href={socials.x}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:opacity-70"
              aria-label="X (Twitter)"
            >
              <Twitter size={18} />
            </a>
          )}

          {socials.instagram && (
            <a
              href={socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:opacity-70"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>
          )}

          {socials.facebook && (
            <a
              href={socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:opacity-70"
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </a>
          )}

          {socials.linkedin && (
            <a
              href={socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:opacity-70"
              aria-label="LinkedIn"
            >
              <Linkedin size={18} />
            </a>
          )}
        </div>
      </div>
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
      <div className="mb-4 flex justify-center text-[#507c80]">
        {icon}
      </div>

      <h3 className="text-lg font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 leading-relaxed text-slate-600">
        {desc}
      </p>
    </div>
  );
}


function iconEmoji(
  icon?: "lightbulb" | "building" | "chart" | "people" | "shield" | "settings"
) {
  switch (icon) {
    case "lightbulb":
      return "💡";
    case "building":
      return "🏢";
    case "chart":
      return "📈";
    case "people":
      return "👥";
    case "shield":
      return "🛡️";
    case "settings":
      return "⚙️";
    default:
      return "✦";
  }
}
