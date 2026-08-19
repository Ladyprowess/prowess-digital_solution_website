import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import Container from "@/components/Container";
import { Reveal } from "@/components/Reveal";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const metadata: Metadata = {
  title: "Skills | Prowess Digital Solutions",
  description: "Browse skills to find the career paths, jobs, courses and resources connected to each one.",
  alternates: { canonical: "https://prowessdigitalsolutions.com/skills" },
};

const SKILL_MAP_TABLES = [
  "job_skill_map",
  "opportunity_skill_map",
  "course_skill_map",
  "resource_skill_map",
  "event_skill_map",
  "career_path_skill_map",
] as const;

async function getSkillsWithUsage() {
  const [{ data: skills }, ...mapResults] = await Promise.all([
    supabase.from("skills").select("id, slug, name").order("name"),
    ...SKILL_MAP_TABLES.map((table) => supabase.from(table).select("skill_id")),
  ]);

  const usageBySkillId = new Map<string, number>();
  mapResults.forEach((result) => {
    for (const row of (result.data as { skill_id: string }[] | null) || []) {
      usageBySkillId.set(row.skill_id, (usageBySkillId.get(row.skill_id) || 0) + 1);
    }
  });

  return (skills || [])
    .map((s) => ({ ...s, usage: usageBySkillId.get(s.id) || 0 }))
    .sort((a, b) => b.usage - a.usage || a.name.localeCompare(b.name));
}

export default async function SkillsPage() {
  const skills = await getSkillsWithUsage();

  return (
    <div className="min-h-screen bg-background py-16">
      <Container>
        <Reveal>
          <div className="mb-12 text-center">
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Skills</div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">What do you want to get good at?</h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Every skill connects to the career paths, jobs, courses and resources that use it.</p>
          </div>
        </Reveal>

        {skills.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <p className="text-foreground font-semibold">No skills yet.</p>
            <p className="mt-1 text-sm text-muted-foreground">Check back soon.</p>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            {skills.map((s) => (
              <Link
                key={s.id}
                href={`/skills/${s.slug}`}
                className="group flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                {s.name}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${s.usage > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {s.usage}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
