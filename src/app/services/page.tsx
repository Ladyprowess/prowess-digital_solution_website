import type { Metadata } from "next";
import ServicesPageClient from "./ServicesPageClient";

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Business Services",
  description:
    "Explore business support from Prowess Digital Solutions, including diagnostics, SOP documentation, offer playbooks, financial tracking, tools and ongoing support.",
  alternates: {
    canonical: `${SITE_URL}/services`,
  },
  openGraph: {
    title: "Business Services",
    description:
      "Explore business support from Prowess Digital Solutions, including diagnostics, SOP documentation, offer playbooks, financial tracking, tools and ongoing support.",
    url: `${SITE_URL}/services`,
    type: "website",
  },
};

export default function Page() {
  return <ServicesPageClient />;
}
