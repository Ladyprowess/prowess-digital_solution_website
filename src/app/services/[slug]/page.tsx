import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { services, packages, offerToPackageSlug } from "@/content/site";
import FinancialLanding from "@/components/services/FinancialLanding";
import PlaybookLanding from "@/components/services/PlaybookLanding";
import SopLanding from "@/components/services/SopLanding";
import DiagnosticLanding from "@/components/DiagnosticLanding";

const SITE_URL = "https://prowessdigitalsolutions.com";

type PageProps = {
  params?: Promise<{ slug: string }>;
};

function getService(slug: string) {
  return services.find((s) => s.slug === slug) || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params; // ✅ params is Promise in your Next build
  const slug = resolved?.slug;

  if (!slug) return {};

  const service = getService(slug);
  if (!service) return {};

  const url = `${SITE_URL}/services/${service.slug}`;

  return {
    title: service.title,
    description: service.short,
    alternates: { canonical: url },
    openGraph: {
      title: `${service.title} | Prowess Digital Solutions`,
      description: service.short,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${service.title} | Prowess Digital Solutions`,
      description: service.short,
      images: ["/og-image.png"],
    },
  };
}

export default async function ServicePage({ params }: PageProps) {
  const resolved = await params; // ✅ params is Promise in your Next build
  const slug = resolved?.slug;

  if (!slug) return notFound();

  const service = getService(slug);
  if (!service) return notFound();

  if (service.slug === "business-structure-diagnostic") return <DiagnosticLanding service={service} />;

  if (service.slug === "financial-tracking-dashboard") return <FinancialLanding service={service} />;

  if (service.slug === "sop-vault") return <SopLanding service={service} />;

  if (service.slug === "go-to-market-offer-playbook") return <PlaybookLanding service={service} />;

  const includedInPlan = packages.find((p) => p.slug === offerToPackageSlug[service.slug]) || null;

  return (
    <div className="page-wrap">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in oklch, var(--primary) 5%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--primary) 5%, transparent) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "linear-gradient(to bottom, #000 0%, transparent 78%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-180px] top-[-260px] h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl"
        />

        <Container>
          <div className="relative mx-auto max-w-3xl py-16 sm:py-20">
            <Reveal delay={0} y={14}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Offer
              </p>
            </Reveal>

            <Reveal delay={80} y={18}>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
                {service.title}
              </h1>
            </Reveal>

            <Reveal delay={160} y={18}>
              <p className="mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {service.short}
              </p>
            </Reveal>

            <div className="mt-6 rounded-xl border border-border bg-muted p-5">
              <p className="font-semibold text-foreground">{service.slug === "business-structure-diagnostic" ? "Fixed one-time fee" : "Standalone service estimate"}: {service.price}</p>
              <p className="mt-2 text-sm text-muted-foreground">Describe your business, current challenges and goals. We confirm whether this service is appropriate before providing payment instructions. Sending an enquiry does not start a subscription or take payment.</p>
              {includedInPlan && <p className="mt-3 text-sm text-muted-foreground">For ongoing support, this service is also included in the {includedInPlan.title} business membership. <Link className="underline text-primary" href={`/pricing#${includedInPlan.slug}`}>Compare recurring support</Link>.</p>}
            </div>

            <Reveal delay={280} y={18}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/contact?service=${service.slug}`}
                  data-track="service_enquiry" data-offer={service.slug}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-95 hover:shadow-md"
                >
                  Enquire about this service
                </Link>

                <Link
                  href="/services"
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 font-semibold text-foreground transition hover:-translate-y-0.5 hover:bg-muted"
                >
                  Back to Offers
                </Link>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* CONTENT */}
      <section className="section bg-background">
        <Container>
          <div className="mx-auto max-w-3xl space-y-12">
            <Reveal>
              <div className="text-foreground">
                <h2 className="text-2xl font-bold text-foreground">What this offer covers</h2>
                <div className="mt-4">
                  {service.details.description.split("\n\n").map((p, i) => (
                    <p key={i} className="mb-4 last:mb-0">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={60}>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Who it is for</h2>
                <ul className="mt-4 list-disc pl-5 text-foreground">
                  {service.details.whoFor.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div>
                <h2 className="text-2xl font-bold text-foreground">What you get</h2>
                <ul className="mt-4 list-disc pl-5 text-foreground">
                  {service.details.whatYouGet.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {service.details.notes?.length ? (
              <Reveal delay={180}>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Notes</h2>
                  <ul className="mt-4 list-disc pl-5 text-foreground">
                    {service.details.notes.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ) : null}

            <Reveal delay={220}>
              <div className="rounded-2xl border border-border bg-muted p-6 transition hover:shadow-sm">
                <h3 className="text-xl font-bold text-foreground">Not sure this is the right one to start with?</h3>
                <p className="mt-2 text-foreground">
                  Start with the Business Structure Diagnostic. It gives us both a clear, honest
                  picture of your business before you commit to anything bigger.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:opacity-95"
                  >
                    Contact Us
                  </Link>

                  <Link
                    href="/services"
                    data-track="service_enquiry"
                    data-offer="business-structure-diagnostic"
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 font-semibold text-foreground transition hover:-translate-y-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Start with the Diagnostic
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </div>
  );
}
