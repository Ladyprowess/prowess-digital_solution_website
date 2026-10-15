import type { Metadata } from "next";
import BusinessHealthCheckPageClient from "./BusinessHealthCheckPageClient";

const SITE_URL = "https://www.prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Business Health Check - Free Operational Self-Audit",
  description:
    "Review 36 business checkpoints, identify unfinished work and print a breakdown based on your answers.",
  alternates: {
    canonical: `${SITE_URL}/tools/business-health-check`,
  },
  openGraph: {
    title: "Business Health Check - Free Operational Self-Audit",
    description:
      "Review 36 business checkpoints, identify unfinished work and print a breakdown based on your answers.",
    url: `${SITE_URL}/tools/business-health-check`,
    type: "website",
  },
};

export default function Page() {
  return <BusinessHealthCheckPageClient />;
}
