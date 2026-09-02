import type { Metadata } from "next";
import CvCheckerPageClient from "./CvCheckerPageClient";

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "CV Checker - Get a Practical CV Review",
  description:
    "Submit your CV for a practical review and get clear, actionable feedback to improve your chances with employers.",
  alternates: {
    canonical: `${SITE_URL}/tools/cv-checker`,
  },
  openGraph: {
    title: "CV Checker - Get a Practical CV Review",
    description:
      "Submit your CV for a practical review and get clear, actionable feedback to improve your chances with employers.",
    url: `${SITE_URL}/tools/cv-checker`,
    type: "website",
  },
};

export default function Page() {
  return <CvCheckerPageClient />;
}
