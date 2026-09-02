import type { Metadata } from "next";
import ReachPageClient from "./ReachPageClient";

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Reach - Marketing Planner for African Businesses",
  description:
    "Get a real growth strategy, ready-to-use content ideas by platform, and a system to track what is actually working.",
  alternates: {
    canonical: `${SITE_URL}/tools/reach`,
  },
  openGraph: {
    title: "Reach - Marketing Planner for African Businesses",
    description:
      "Get a real growth strategy, ready-to-use content ideas by platform, and a system to track what is actually working.",
    url: `${SITE_URL}/tools/reach`,
    type: "website",
  },
};

export default function Page() {
  return <ReachPageClient />;
}
