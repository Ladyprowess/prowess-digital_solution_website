import type { Metadata } from "next";
import SkillsPageClient from "./SkillsPageClient";

const SITE_URL = "https://prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "Skills Directory - Explore In-Demand Skills",
  description:
    "Choose a skill and see where it can take you: the roles that need it, the career paths it unlocks, and resources to help you learn it.",
  alternates: {
    canonical: `${SITE_URL}/skills`,
  },
  openGraph: {
    title: "Skills Directory - Explore In-Demand Skills",
    description:
      "Choose a skill and see where it can take you: the roles that need it, the career paths it unlocks, and resources to help you learn it.",
    url: `${SITE_URL}/skills`,
    type: "website",
  },
};

export default function Page() {
  return <SkillsPageClient />;
}
