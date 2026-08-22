"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/components/Modal";

export type RoleNode = {
  id: string;
  title: string;
  description: string | null;
  skills: { slug: string; name: string }[];
  skillSlugs: string[];
  jobs: { slug: string; title: string; companies: { name: string } | null }[];
  recommendedCourses: { slug: string; title: string }[];
  recommendedResources: { slug: string; title: string }[];
  children: RoleNode[];
};

// "What can you become?" -- a real 2-level branching tree (career path ->
// tier-1 roles -> tier-2 roles), each node clickable into the existing
// Modal, populated with that specific role's own getSkillGraph-derived
// skills/jobs/learning (pre-fetched server-side, not the parent path's).
export function RoleBranchDiagram({ pathTitle, roles }: { pathTitle: string; roles: RoleNode[] }) {
  const [active, setActive] = useState<RoleNode | null>(null);

  return (
    <div>
      <div className="flex justify-center">
        <div className="rounded-2xl border-2 border-primary bg-primary/5 px-6 py-3 text-center">
          <p className="text-sm font-bold text-foreground">{pathTitle}</p>
        </div>
      </div>
      <div className="flex justify-center">
        <div className="h-8 w-px bg-border" />
      </div>
      <div className="flex flex-wrap justify-center gap-10 overflow-x-auto pb-2">
        {roles.map((role) => (
          <div key={role.id} className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => setActive(role)}
              className="flex-shrink-0 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary/5"
            >
              {role.title}
            </button>
            {role.children.length > 0 && (
              <>
                <div className="mt-2 h-6 w-px bg-border" />
                <div className="flex flex-wrap justify-center gap-3">
                  {role.children.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => setActive(child)}
                      className="flex-shrink-0 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                    >
                      {child.title}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <Modal open={!!active} title={active?.title || ""} onClose={() => setActive(null)}>
        {active && (
          <div className="space-y-5">
            {active.description && <p className="text-sm text-muted-foreground">{active.description}</p>}

            {active.skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Skills</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {active.skills.map((s) => (
                    <span key={s.slug} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">{s.name}</span>
                  ))}
                </div>
              </div>
            )}

            {(active.recommendedCourses.length > 0 || active.recommendedResources.length > 0) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Learning</p>
                <div className="mt-2 grid gap-2">
                  {active.recommendedCourses.map((c) => (
                    <Link key={c.slug} href={`/learn/${c.slug}`} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground hover:border-primary/30">{c.title}</Link>
                  ))}
                  {active.recommendedResources.map((r) => (
                    <Link key={r.slug} href={`/resources/${r.slug}`} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground hover:border-primary/30">{r.title}</Link>
                  ))}
                </div>
              </div>
            )}

            {active.jobs.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Jobs</p>
                <div className="mt-2 grid gap-2">
                  {active.jobs.map((j) => (
                    <Link key={j.slug} href={`/jobs/${j.slug}`} className="rounded-xl border border-border px-3 py-2 text-sm hover:border-primary/30">
                      <span className="font-semibold text-foreground">{j.title}</span>
                      {j.companies?.name && <span className="text-muted-foreground"> - {j.companies.name}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {active.skillSlugs.length > 0 && (
              <Link href={`/jobs?skills=${active.skillSlugs.join(",")}`} className="inline-block text-sm font-semibold text-primary hover:underline">
                View {active.title} jobs →
              </Link>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
