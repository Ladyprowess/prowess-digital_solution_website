import type { Metadata } from "next";
import ServicesPageClient from "./ServicesPageClient";

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Our Services - Business & Career Support",
  description:
    "See everything Prowess Digital Solutions offers, from a free business toolkit to paid consulting and career resources, all in one place.",
  alternates: {
    canonical: `${SITE_URL}/services`,
  },
  openGraph: {
    title: "Our Services - Business & Career Support",
    description:
      "See everything Prowess Digital Solutions offers, from a free business toolkit to paid consulting and career resources, all in one place.",
    url: `${SITE_URL}/services`,
    type: "website",
  },
};

export default function Page() {
  return <ServicesPageClient />;
}
