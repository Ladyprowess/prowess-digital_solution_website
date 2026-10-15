import type { Metadata } from "next";
import CareerPathsPageClient from "./CareerPathsPageClient";

const SITE_URL = "https://www.prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Career Path Explorer - Plan Your Next Move",
  description:
    "Explore career paths step by step. See the roles, skills and roadmap you need to move from where you are to where you want to be.",
  alternates: {
    canonical: `${SITE_URL}/career-paths`,
  },
  openGraph: {
    title: "Career Path Explorer - Plan Your Next Move",
    description:
      "Explore career paths step by step. See the roles, skills and roadmap you need to move from where you are to where you want to be.",
    url: `${SITE_URL}/career-paths`,
    type: "website",
  },
};

export default function Page() {
  return <CareerPathsPageClient />;
}
