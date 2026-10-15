import type { Metadata } from "next";
import CaseStudiesPageClient from "./CaseStudiesPageClient";

const SITE_URL = "https://www.prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Case Studies - Client Success Stories",
  description:
    "See real results from businesses and professionals who worked with Prowess Digital Solutions.",
  alternates: {
    canonical: `${SITE_URL}/case-studies`,
  },
  openGraph: {
    title: "Case Studies - Client Success Stories",
    description:
      "See real results from businesses and professionals who worked with Prowess Digital Solutions.",
    url: `${SITE_URL}/case-studies`,
    type: "website",
  },
};

export default function Page() {
  return <CaseStudiesPageClient />;
}
