import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { services, packages, offerToPackageSlug } from "@/content/site";

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

  const includedInPlan = packages.find((p) => p.slug === offerToPackageSlug[service.slug]) || null;

  return (
    <div className="page-wrap">
      {/* HERO */}
      <section className="section bg-accent">
        <Container>
          <div className="mx-auto max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">
              Offer
            </p>

            <h1 className="h1">{service.title}</h1>

            <p className="mt-5 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {service.short}
            </p>

            {includedInPlan ? (
              <div className="mt-6 text-foreground">
                <span className="text-muted-foreground">Included in the </span>
                <span className="font-semibold">{includedInPlan.title}</span>
                <span className="text-muted-foreground"> membership, from </span>
                <span className="font-semibold">${includedInPlan.monthlyPrice.toLocaleString("en-US")}/mo</span>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={includedInPlan ? `/pricing#${includedInPlan.slug}` : "/pricing"}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-95"
              >
                {service.cta}
              </Link>

              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 font-semibold text-foreground hover:bg-muted"
              >
                Back to Offers
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* CONTENT */}
      <section className="section bg-background">
        <Container>
          <div className="mx-auto max-w-3xl space-y-12">
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

            <div>
              <h2 className="text-2xl font-bold text-foreground">Who it is for</h2>
              <ul className="mt-4 list-disc pl-5 text-foreground">
                {service.details.whoFor.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground">What you get</h2>
              <ul className="mt-4 list-disc pl-5 text-foreground">
                {service.details.whatYouGet.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            {service.details.notes?.length ? (
              <div>
                <h2 className="text-2xl font-bold text-foreground">Notes</h2>
                <ul className="mt-4 list-disc pl-5 text-foreground">
                  {service.details.notes.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-muted p-6">
              <h3 className="text-xl font-bold text-foreground">Not sure this is the right one to start with?</h3>
              <p className="mt-2 text-foreground">
                Start with the Business Structure Diagnostic. It gives us both a clear, honest
                picture of your business before you commit to anything bigger.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-95"
                >
                  Contact Us
                </Link>

                <Link
                  href="/services/business-structure-diagnostic"
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 font-semibold text-foreground hover:bg-muted"
                >
                  Start with the Diagnostic
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
