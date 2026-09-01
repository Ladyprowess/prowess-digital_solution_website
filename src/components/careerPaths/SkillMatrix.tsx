import Link from "next/link";

export type SkillMatrixRow = {
  slug: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced" | null;
  jobsCount: number;
};

// A real comparison table, not another card grid -- Level reads
// career_path_skill_map.level for the first time anywhere on the site.
export function SkillMatrix({ rows }: { rows: SkillMatrixRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-5 py-3 font-semibold">Skill</th>
            <th className="px-5 py-3 font-semibold">Level</th>
            <th className="px-5 py-3 font-semibold"></th>
            <th className="px-5 py-3 font-semibold text-right">Jobs</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slug} className="border-b border-border/60 last:border-0">
              <td className="px-5 py-3 font-semibold text-foreground">{row.name}</td>
              <td className="px-5 py-3 capitalize text-muted-foreground">{row.level || "-"}</td>
              <td className="px-5 py-3">
                <Link href={`/learn?skills=${row.slug}`} className="inline-flex min-h-10 items-center text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Learn</Link>
              </td>
              <td className="px-5 py-3 text-right">
                {row.jobsCount > 0 ? (
                  <Link href={`/jobs?skills=${row.slug}`} className="inline-flex min-h-10 items-center text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{row.jobsCount} jobs</Link>
                ) : (
                  <span className="text-xs text-muted-foreground/50">0 jobs</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
