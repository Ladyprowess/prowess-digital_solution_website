import type { Metadata } from "next";
import LearnPageClient from "./LearnPageClient";

const SITE_URL = "https://www.prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Learn - Courses & Learning Resources",
  description:
    "Your learning workspace. Browse courses, books and practical resources that help you build useful skills and keep growing.",
  alternates: {
    canonical: `${SITE_URL}/learn`,
  },
  openGraph: {
    title: "Learn - Courses & Learning Resources",
    description:
      "Your learning workspace. Browse courses, books and practical resources that help you build useful skills and keep growing.",
    url: `${SITE_URL}/learn`,
    type: "website",
  },
};

export default function Page() {
  return <LearnPageClient />;
}
