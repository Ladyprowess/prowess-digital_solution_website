import type { Metadata } from "next";
import OpportunitiesPageClient from "./OpportunitiesPageClient";

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Opportunities - Scholarships, Grants & Internships",
  description:
    "Discover opportunities that can move you forward: scholarships, grants, internships and more, all in one place.",
  alternates: {
    canonical: `${SITE_URL}/opportunities`,
  },
  openGraph: {
    title: "Opportunities - Scholarships, Grants & Internships",
    description:
      "Discover opportunities that can move you forward: scholarships, grants, internships and more, all in one place.",
    url: `${SITE_URL}/opportunities`,
    type: "website",
  },
};

export default function Page() {
  return <OpportunitiesPageClient />;
}
