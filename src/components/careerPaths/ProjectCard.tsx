import { stripHtmlForMeta } from "@/lib/stripHtml";

export type ProjectCardData = {
  id: string;
  title: string;
  level: "beginner" | "intermediate" | "advanced" | null;
  description: string | null;
  external_link: string | null;
  skills: { slug: string; name: string }[];
};

// "Build experience while you learn" -- a real destination, not a lookalike
// of the other card types (no colorForSeed, no thumbnail; just what
// someone would build and what it practices).
export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold text-foreground">{project.title}</h3>
        {project.level && (
          <span className="flex-shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide capitalize text-muted-foreground">{project.level}</span>
        )}
      </div>

      {project.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{stripHtmlForMeta(project.description, 160)}</p>}

      <div className="flex-1" />

      {project.skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.skills.map((s) => (
            <span key={s.slug} className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary">{s.name}</span>
          ))}
        </div>
      )}

      {project.external_link && (
        <a href={project.external_link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
          View project →
        </a>
      )}
    </div>
  );
}
