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
  children: RoleNode[];
};

export function RoleBranchDiagram({ pathTitle, roles }: { pathTitle: string; roles: RoleNode[] }) {
  const [active, setActive] = useState<RoleNode | null>(null);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card p-4 sm:p-6">
      <div className="relative mx-auto max-w-4xl">
        <div className="pointer-events-none absolute left-1/2 top-12 h-[calc(100%-3rem)] w-px -translate-x-1/2 bg-border" />

        <div className="relative z-10 flex justify-center">
          <div className="max-w-full rounded-lg border-2 border-primary bg-primary/10 px-6 py-3 text-center text-sm font-bold text-foreground shadow-sm">
            {pathTitle}
          </div>
        </div>

        <div className="relative z-10 mt-8 space-y-8">
          {roles.map((role, index) => (
            <div key={role.id} className="relative">
              <div
                className={`absolute top-1/2 hidden h-px -translate-y-1/2 bg-border sm:block ${
                  index % 2 === 0 ? "left-[46%] right-1/2" : "left-1/2 right-[46%]"
                }`}
              />
              <div
                className={`relative flex ${
                  index % 2 === 0 ? "justify-center sm:justify-start" : "justify-center sm:justify-end"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActive(role)}
                  className="min-h-12 w-full max-w-[360px] rounded-lg border border-primary/30 bg-background px-5 py-3 text-center text-sm font-semibold text-foreground shadow-sm transition hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-[46%]"
                >
                  {role.title}
                </button>
              </div>

              {role.children.length > 0 && (
                <div className="relative mt-4 pl-6 sm:mx-auto sm:max-w-[46%] sm:pl-0">
                  <div className="absolute bottom-5 left-2 top-0 w-px bg-border sm:left-1/2" />
                  <div className="space-y-3">
                    {role.children.map((child) => (
                      <div key={child.id} className="relative">
                        <span className="absolute left-2 top-1/2 h-px w-4 -translate-y-1/2 bg-border sm:left-1/2 sm:w-6" />
                        <button
                          type="button"
                          onClick={() => setActive(child)}
                          className="ml-6 min-h-11 w-[calc(100%-1.5rem)] rounded-lg border border-border bg-card px-4 py-2.5 text-left text-xs font-semibold text-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:ml-[calc(50%+1.5rem)] sm:w-[calc(50%-1.5rem)]"
                        >
                          {child.title}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
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

            {active.recommendedCourses.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Courses</p>
                <div className="mt-2 grid gap-2">
                  {active.recommendedCourses.map((c) => (
                    <Link key={c.slug} href={`/learn/${c.slug}`} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{c.title}</Link>
                  ))}
                </div>
              </div>
            )}

            {active.jobs.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Jobs</p>
                <div className="mt-2 grid gap-2">
                  {active.jobs.map((j) => (
                    <Link key={j.slug} href={`/jobs/${j.slug}`} className="rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <span className="font-semibold text-foreground">{j.title}</span>
                      {j.companies?.name && <span className="text-muted-foreground"> by {j.companies.name}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {active.skillSlugs.length > 0 && (
              <Link href={`/jobs?skills=${active.skillSlugs.join(",")}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                View {active.title} jobs
              </Link>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
