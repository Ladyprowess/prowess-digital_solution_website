import type { Metadata } from "next";
import PricingPageClient from "./PricingPageClient";

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Pricing - Plans & Membership Tiers",
  description:
    "Choose your starting point. Compare free tools and paid membership tiers to find the plan that fits where you are right now.",
  alternates: {
    canonical: `${SITE_URL}/pricing`,
  },
  openGraph: {
    title: "Pricing - Plans & Membership Tiers",
    description:
      "Choose your starting point. Compare free tools and paid membership tiers to find the plan that fits where you are right now.",
    url: `${SITE_URL}/pricing`,
    type: "website",
  },
};

export default function Page() {
  return <PricingPageClient />;
}
