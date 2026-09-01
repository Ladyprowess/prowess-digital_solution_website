"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useMemberSession } from "@/lib/useMemberSession";
import { supabase } from "@/lib/supabase";

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";
const AUTOSAVE_DELAY = 1800;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://prowessdigitalsolutions.com";

type Project = { title: string; role: string; description: string; link: string; tags: string[] };
type PortfolioRow = { id: string; slug: string; full_name: string; headline: string; bio: string; projects: Project[]; is_public: boolean; updated_at: string };

const EMPTY_PROJECT = (): Project => ({ title: "", role: "", description: "", link: "", tags: [] });

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

export default function PortfolioBuilderPage() {
  return (
    <Suspense fallback={null}>
      <PortfolioBuilder />
    </Suspense>
  );
}

function PortfolioBuilder() {
  const { status } = useMemberSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [portfolioId, setPortfolioId] = useState<string | null>(searchParams.get("id"));
  const [slug, setSlug] = useState("");
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");

  const skipNextAutosaveRef = useRef(true);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : null;
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    (async () => {
      setLoading(true);
      const headers = await authHeader();
      if (!headers) { setLoading(false); return; }

      const res = await fetch("/api/portfolio-builder/save", { headers }).then((r) => r.json()).catch(() => null);
      if (!res?.ok) { setLoading(false); return; }
      setHasAccess(Boolean(res.hasAccess));

      const portfolios = (res.portfolios || []) as PortfolioRow[];
      const targetId = searchParams.get("id");
      const target = targetId ? portfolios.find((p) => p.id === targetId) : (portfolios.length === 1 ? portfolios[0] : null);

      if (target) {
        skipNextAutosaveRef.current = true;
        setPortfolioId(target.id);
        setSlug(target.slug);
        setFullName(target.full_name);
        setHeadline(target.headline);
        setBio(target.bio);
        setProjects(target.projects || []);
        setIsPublic(target.is_public);
        if (!targetId) router.replace(`/tools/portfolio-builder?id=${target.id}`);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const save = useCallback(async (): Promise<PortfolioRow | null> => {
    setSaveError("");
    const headers = await authHeader();
    if (!headers) { setSaveError("Please sign in to continue."); return null; }

    const res = await fetch("/api/portfolio-builder/save", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ id: portfolioId, slug, fullName, headline, bio, projects, isPublic }),
    }).then((r) => r.json()).catch(() => null);

    if (!res?.ok) {
      setSaveError(res?.error || "Could not save your portfolio.");
      return null;
    }
    if (!portfolioId) {
      skipNextAutosaveRef.current = true;
      setPortfolioId(res.portfolio.id);
      router.replace(`/tools/portfolio-builder?id=${res.portfolio.id}`);
    }
    setSlug(res.portfolio.slug);
    return res.portfolio as PortfolioRow;
  }, [authHeader, portfolioId, slug, fullName, headline, bio, projects, isPublic, router]);

  useEffect(() => {
    if (loading || !hasAccess && !portfolioId) return;
    if (skipNextAutosaveRef.current) { skipNextAutosaveRef.current = false; return; }
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      setSaveMsg("");
      const saved = await save();
      setSaving(false);
      if (saved) setSaveMsg("Saved");
    }, AUTOSAVE_DELAY);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullName, headline, bio, projects, isPublic, slug, loading]);

  async function downloadPdf() {
    const saved = await save();
    if (!saved) return;
    const headers = await authHeader();
    if (!headers) { setSaveError("Please sign in to continue."); return; }

    const res = await fetch("/api/portfolio-builder/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ portfolioId: saved.id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      setSaveError(err?.error || "Could not generate your PDF.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(fullName || "Portfolio").replace(/[^a-z0-9]+/gi, "_")}_Portfolio.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function addProject() { setProjects((prev) => [...prev, EMPTY_PROJECT()]); }
  function updateProject(i: number, patch: Partial<Project>) {
    setProjects((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function removeProject(i: number) { setProjects((prev) => prev.filter((_, idx) => idx !== i)); }

  if (status === "loading" || loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><p className="text-sm text-muted-foreground">Loading…</p></div>;
  }
  if (status === "signed-out") return null;

  if (!hasAccess && !portfolioId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <LockKeyhole className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Portfolio Builder is part of Pro career access.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Upgrade to Pro (or use Premium Membership) to build a shareable portfolio page and downloadable PDF.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/tools#career" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            See career plans
          </Link>
          <Link href="/account/membership" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-6 text-sm font-semibold text-foreground hover:bg-muted">
            Or use Premium Membership
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Portfolio Builder</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Add your projects and story, then share the public link or download a PDF.</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">{saving ? "Saving…" : saveMsg}</div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <SectionCard title="About you">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name"><input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} /></Field>
                <Field label="Headline"><input value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputCls} placeholder="Product Designer" /></Field>
              </div>
              <Field label="Bio">
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className={inputCls} />
              </Field>
            </SectionCard>

            <SectionCard title="Projects">
              {projects.map((p, i) => (
                <div key={i} className="rounded-xl border border-border/60 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Project title"><input value={p.title} onChange={(e) => updateProject(i, { title: e.target.value })} className={inputCls} /></Field>
                    <Field label="Your role"><input value={p.role} onChange={(e) => updateProject(i, { role: e.target.value })} className={inputCls} /></Field>
                  </div>
                  <div className="mt-3">
                    <Field label="Description">
                      <textarea value={p.description} onChange={(e) => updateProject(i, { description: e.target.value })} rows={3} className={inputCls} />
                    </Field>
                  </div>
                  <div className="mt-3">
                    <Field label="Link (optional)">
                      <input value={p.link} onChange={(e) => updateProject(i, { link: e.target.value })} className={inputCls} placeholder="https://..." />
                    </Field>
                  </div>
                  <button type="button" onClick={() => removeProject(i)} className="mt-3 text-xs font-semibold text-red-600 hover:underline">Remove project</button>
                </div>
              ))}
              <button type="button" onClick={addProject} className="rounded-xl border border-dashed border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary">
                + Add project
              </button>
            </SectionCard>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <SectionCard title="Sharing">
              <Field label="Public URL slug">
                <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} placeholder="your-name" />
              </Field>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                Make this portfolio publicly viewable
              </label>
              {portfolioId && isPublic && slug && (
                <a href={`${SITE_URL}/portfolio/${slug}`} target="_blank" rel="noreferrer" className="block break-all text-xs font-semibold text-primary hover:underline">
                  {SITE_URL}/portfolio/{slug}
                </a>
              )}
            </SectionCard>

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}

            <button
              type="button"
              onClick={downloadPdf}
              className="min-h-11 w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Download PDF
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
