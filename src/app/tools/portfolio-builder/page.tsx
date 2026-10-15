import type { Metadata } from "next";
import PortfolioBuilderPageClient from "./PortfolioBuilderPageClient";

const SITE_URL = "https://www.prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Portfolio Builder - Showcase Your Work",
  description:
    "Build a professional portfolio that shows your projects, role and experience to potential clients and employers.",
  alternates: {
    canonical: `${SITE_URL}/tools/portfolio-builder`,
  },
  openGraph: {
    title: "Portfolio Builder - Showcase Your Work",
    description:
      "Build a professional portfolio that shows your projects, role and experience to potential clients and employers.",
    url: `${SITE_URL}/tools/portfolio-builder`,
    type: "website",
  },
};

export default function Page() {
  return <PortfolioBuilderPageClient />;
}
