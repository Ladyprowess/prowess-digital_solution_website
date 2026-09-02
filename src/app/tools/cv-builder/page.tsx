import type { Metadata } from "next";
import CvBuilderPageClient from "./CvBuilderPageClient";

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "CV Builder - Create a Professional CV",
  description:
    "Build a professional CV in minutes with ready-to-use templates designed to help you stand out to employers.",
  alternates: {
    canonical: `${SITE_URL}/tools/cv-builder`,
  },
  openGraph: {
    title: "CV Builder - Create a Professional CV",
    description:
      "Build a professional CV in minutes with ready-to-use templates designed to help you stand out to employers.",
    url: `${SITE_URL}/tools/cv-builder`,
    type: "website",
  },
};

export default function Page() {
  return <CvBuilderPageClient />;
}
