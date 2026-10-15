import type { Metadata } from "next";
import SkillToBusinessPageClient from "./SkillToBusinessPageClient";

const SITE_URL = "https://www.prowessdigitalsolutions.com";

export const metadata: Metadata = {
  title: "From Skill to Business",
  description:
    "Have a skill but no business structure around it? Learn how to close the gap between what you can do and a real, running business.",
  alternates: {
    canonical: `${SITE_URL}/skill-to-business`,
  },
  openGraph: {
    title: "From Skill to Business",
    description:
      "Have a skill but no business structure around it? Learn how to close the gap between what you can do and a real, running business.",
    url: `${SITE_URL}/skill-to-business`,
    type: "website",
  },
};

export default function Page() {
  return <SkillToBusinessPageClient />;
}
