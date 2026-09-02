import type { Metadata } from "next";
import BusinessHealthCheckPageClient from "./BusinessHealthCheckPageClient";

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Business Health Check - Free Operational Self-Audit",
  description:
    "Run a free operational self-audit on your business and get a practical health score with clear next steps.",
  alternates: {
    canonical: `${SITE_URL}/tools/business-health-check`,
  },
  openGraph: {
    title: "Business Health Check - Free Operational Self-Audit",
    description:
      "Run a free operational self-audit on your business and get a practical health score with clear next steps.",
    url: `${SITE_URL}/tools/business-health-check`,
    type: "website",
  },
};

export default function Page() {
  return <BusinessHealthCheckPageClient />;
}
