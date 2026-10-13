import { services } from "@/content/site";
import type { Metadata } from "next";
import ContactPageClient from "./ContactPageClient";

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Prowess Digital Solutions for questions about our services, tools, or partnership opportunities.",
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: "Contact Us",
    description:
      "Get in touch with Prowess Digital Solutions for questions about our services, tools, or partnership opportunities.",
    url: `${SITE_URL}/contact`,
    type: "website",
  },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const selected = services.find((item) => item.slug === service);
  return <ContactPageClient initialInquiry={selected?.title || ""} />;
}
