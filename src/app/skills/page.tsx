import type { Metadata } from "next";
import SkillsPageClient, { type SkillWithCounts } from "./SkillsPageClient";
import { supabase } from "@/lib/supabase";

const SITE_URL = "https://www.prowessdigitalsolutions.com";

async function getInitialSkills(): Promise<SkillWithCounts[]> {
  const [{ data: skillRows }, { data: jobRows }, { data: oppRows }, { data: courseRows }] = await Promise.all([
    supabase.from("skills").select("id, slug, name, description, featured").eq("status", "published").order("name"),
    supabase.from("job_skill_map").select("skill_id"),
    supabase.from("opportunity_skill_map").select("skill_id"),
    supabase.from("course_skill_map").select("skill_id"),
  ]);

  const jobCounts = new Map<string, number>();
  for (const r of jobRows || []) jobCounts.set(r.skill_id, (jobCounts.get(r.skill_id) || 0) + 1);

  const oppCounts = new Map<string, number>();
  for (const r of oppRows || []) oppCounts.set(r.skill_id, (oppCounts.get(r.skill_id) || 0) + 1);

  const learningCounts = new Map<string, number>();
  for (const r of courseRows || []) learningCounts.set(r.skill_id, (learningCounts.get(r.skill_id) || 0) + 1);

  return (skillRows || []).map((s) => ({
    ...s,
    learningCount: learningCounts.get(s.id) || 0,
    jobsCount: jobCounts.get(s.id) || 0,
    opportunitiesCount: oppCounts.get(s.id) || 0,
  }));
}

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

export default async function Page() {
  const initialSkills = await getInitialSkills();
  return <SkillsPageClient initialSkills={initialSkills} />;
}
