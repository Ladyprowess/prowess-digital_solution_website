import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/Container";
import { services } from "@/content/site";

type Props = {
  params: { slug: string };
};

const SITE_URL = "https://prowessdigitalsolutions.com";

function getService(slug: string) {
  return services.find((s) => s.slug === slug) || null;
}

// ✅ SEO metadata per service page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = getService(params.slug);
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

export default function ServicePage({ params }: Props) {
  const service = getService(params.slug);
  if (!service) return notFound();

  return (
    <div className="page-wrap">
      {/* HERO */}
      <section className="section bg-[#eef6f6]">
        <Container>
          <div className="mx-auto max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#507c80]">
              Service
            </p>

            <h1 className="h1">{service.title}</h1>

            <p className="mt-5 text-lg leading-relaxed text-slate-600 sm:text-xl">
              {service.short}
            </p>

            <div className="mt-6 text-slate-700">
              <span className="text-slate-500">Price range: </span>
              <span className="font-semibold">{service.price}</span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-[#507c80] px-6 py-3 font-semibold text-white hover:opacity-95"
              >
                {service.cta}
              </Link>

              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:bg-slate-100"
              >
                Back to Services
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* CONTENT */}
      <section className="section bg-white">
        <Container>
          <div className="mx-auto max-w-3xl space-y-12">
            {/* What this is */}
            <div className="text-slate-700">
              <h2 className="text-2xl font-bold text-slate-900">What this service is</h2>
              <div className="mt-4">
                {service.details.description.split("\n\n").map((p, i) => (
                  <p key={i} className="mb-4 last:mb-0">
                    {p}
                  </p>
                ))}
              </div>
            </div>

            {/* Who it’s for */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Who it’s for</h2>
              <ul className="mt-4 list-disc pl-5 text-slate-700">
                {service.details.whoFor.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            {/* What you get */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900">What you get</h2>
              <ul className="mt-4 list-disc pl-5 text-slate-700">
                {service.details.whatYouGet.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>

            {/* Notes */}
            {service.details.notes?.length ? (
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Notes</h2>
                <ul className="mt-4 list-disc pl-5 text-slate-700">
                  {service.details.notes.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* CTA block */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-bold text-slate-900">Ready to move forward?</h3>
              <p className="mt-2 text-slate-700">
                If you are not sure which service is right, start with a Business Clarity Session. We’ll help you choose the best next step.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl bg-[#507c80] px-6 py-3 font-semibold text-white hover:opacity-95"
                >
                  Contact Us
                </Link>

                <Link
                  href="/services/business-clarity-session"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:bg-slate-100"
                >
                  Start with Clarity Session
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
