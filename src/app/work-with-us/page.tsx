import type { Metadata } from "next";
import WorkWithUsPageClient from "./WorkWithUsPageClient";

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Work With Us - Careers at Prowess Digital Solutions",
  description:
    "Build with purpose. See open roles at Prowess Digital Solutions and how to apply.",
  alternates: {
    canonical: `${SITE_URL}/work-with-us`,
  },
  openGraph: {
    title: "Work With Us - Careers at Prowess Digital Solutions",
    description:
      "Build with purpose. See open roles at Prowess Digital Solutions and how to apply.",
    url: `${SITE_URL}/work-with-us`,
    type: "website",
  },
};

export default function Page() {
  return <WorkWithUsPageClient />;
}
