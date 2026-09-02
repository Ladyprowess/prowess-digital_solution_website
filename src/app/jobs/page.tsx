import type { Metadata } from "next";
import JobsPageClient from "./JobsPageClient";

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Find Jobs in Africa - Remote & On-site Opportunities",
  description:
    "Browse remote, hybrid and on-site jobs across Africa. Filter by role, skill, location, experience level and salary to find opportunities that match where you want to go.",
  alternates: {
    canonical: `${SITE_URL}/jobs`,
  },
  openGraph: {
    title: "Find Jobs in Africa - Remote & On-site Opportunities",
    description:
      "Browse remote, hybrid and on-site jobs across Africa. Filter by role, skill, location, experience level and salary to find opportunities that match where you want to go.",
    url: `${SITE_URL}/jobs`,
    type: "website",
  },
};

export default function JobsPage() {
  return <JobsPageClient />;
}
