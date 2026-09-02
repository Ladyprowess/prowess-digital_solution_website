import type { Metadata } from "next";
import InterviewPrepPageClient from "./InterviewPrepPageClient";

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Interview Prep - Practice for Every Stage",
  description:
    "Prepare for every stage of the interview process with practical guides, sample questions and a stage-by-stage plan.",
  alternates: {
    canonical: `${SITE_URL}/tools/interview-prep`,
  },
  openGraph: {
    title: "Interview Prep - Practice for Every Stage",
    description:
      "Prepare for every stage of the interview process with practical guides, sample questions and a stage-by-stage plan.",
    url: `${SITE_URL}/tools/interview-prep`,
    type: "website",
  },
};

export default function Page() {
  return <InterviewPrepPageClient />;
}
