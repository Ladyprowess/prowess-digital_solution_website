import type { Metadata } from "next";
import LearnPageClient from "./LearnPageClient";

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Learn - Courses & Learning Resources",
  description:
    "Your learning workspace. Browse courses, track your progress, and build skills that move your career forward.",
  alternates: {
    canonical: `${SITE_URL}/learn`,
  },
  openGraph: {
    title: "Learn - Courses & Learning Resources",
    description:
      "Your learning workspace. Browse courses, track your progress, and build skills that move your career forward.",
    url: `${SITE_URL}/learn`,
    type: "website",
  },
};

export default function Page() {
  return <LearnPageClient />;
}
