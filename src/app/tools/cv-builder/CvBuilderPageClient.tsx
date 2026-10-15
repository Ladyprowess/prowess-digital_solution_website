"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TemplatePreview } from "@/components/cvBuilder/TemplatePreview";
import { CV_TEMPLATES } from "@/lib/cvBuilder/templates";
import { supabase } from "@/lib/supabase";
import { useMemberSession } from "@/lib/useMemberSession";

type CvRow = { id: string; title: string; template: string; updated_at: string };

export default function CvBuilderPageClient() {
  return (
    <Suspense fallback={null}>
      <CvTemplateGallery />
    </Suspense>
  );
}

function CvTemplateGallery() {
  const { status } = useMemberSession();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [premiumActive, setPremiumActive] = useState(false);
  const [existingCvs, setExistingCvs] = useState<CvRow[]>([]);

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : null;
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    (async () => {
      setLoading(true);
      const headers = await authHeader();
      if (!headers) {
        setLoading(false);
        return;
      }
      const res = await fetch("/api/cv-builder/save", { headers }).then((r) => r.json()).catch(() => null);
      if (res?.ok) {
        setPremiumActive(Boolean(res.premiumActive));
        setExistingCvs((res.cvs || []) as CvRow[]);
      }
      setLoading(false);
    })();
  }, [authHeader, status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading templates...</p>
      </div>
    );
  }

  if (status === "signed-out") return null;

  const requestedId = searchParams.get("id");
  const savedCv = requestedId ? existingCvs.find((cv) => cv.id === requestedId) : null;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">CV Builder</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Choose the CV design you want. Each template shows real sample content so applicants can understand the structure before editing their own details.
            </p>
          </div>
          {existingCvs.length > 0 && (
            <Link
              href="/account/cvs"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              My saved CVs
            </Link>
          )}
        </div>

        <section className="mt-8 rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-foreground">Choose a template</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Click a template to open the live editor. The form appears on the editor page beside the selected CV preview.
              </p>
            </div>
            {savedCv && (
              <Link
                href={`/tools/cv-builder/editor?id=${savedCv.id}&template=${savedCv.template}`}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Continue editing {savedCv.title}
              </Link>
            )}
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {CV_TEMPLATES.map((template) => {
              const locked = template.access === "paid" && !premiumActive;
              const editorHref = `/tools/cv-builder/editor?template=${template.key}${requestedId ? `&id=${requestedId}` : ""}`;
              return (
                <article key={template.key} className="rounded-lg border border-border bg-background p-4 transition hover:border-primary/60 hover:shadow-sm">
                  <div className="aspect-[1/1.414] overflow-hidden rounded-md border border-border bg-card shadow-sm">
                    <TemplatePreview templateKey={template.key} />
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-foreground">{template.label}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{template.audience}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${template.access === "free" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                      {template.access}
                    </span>
                  </div>
                  {locked ? (
                    <Link
                      href="/account/membership"
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-semibold text-primary transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      Unlock this template
                    </Link>
                  ) : (
                    <Link
                      href={editorHref}
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      Use this template
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
