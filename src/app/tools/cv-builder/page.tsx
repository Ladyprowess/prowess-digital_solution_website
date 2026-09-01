"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMemberSession } from "@/lib/useMemberSession";
import { supabase } from "@/lib/supabase";
import type { CVData, CVExperience, CVEducation } from "@/lib/cvBuilder/validate";
import { CV_TEMPLATES } from "@/lib/cvBuilder/templates";
import { TemplatePreview } from "@/components/cvBuilder/TemplatePreview";

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";
const AUTOSAVE_DELAY = 1800;

type CvRow = { id: string; title: string; template: string; data: CVData; updated_at: string };

const EMPTY_CV: CVData = {
  personalInfo: { fullName: "", email: "", phone: "", location: "", linkedin: "", website: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
};

function emptyExperience(): CVExperience {
  return { company: "", title: "", startDate: "", endDate: "", current: false, bullets: [] };
}
function emptyEducation(): CVEducation {
  return { institution: "", degree: "", field: "", startDate: "", endDate: "" };
}

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

export default function CvBuilderPage() {
  return (
    <Suspense fallback={null}>
      <CvBuilder />
    </Suspense>
  );
}

function CvBuilder() {
  const { status } = useMemberSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [cvId, setCvId] = useState<string | null>(searchParams.get("id"));
  const [title, setTitle] = useState("My CV");
  const [cv, setCv] = useState<CVData>(EMPTY_CV);
  const [template, setTemplate] = useState("plain");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [premiumActive, setPremiumActive] = useState(false);

  const skipNextAutosaveRef = useRef(true);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : null;
  }, []);

  // Initial load: fetch every CV this member owns plus whether Premium is
  // active. If the URL names a specific id, load that one. Otherwise, a
  // free member with exactly one existing CV is dropped straight into
  // editing it (a blank form would just fail to save as a second CV) - a
  // Premium member, or a free member with none yet, starts blank.
  useEffect(() => {
    if (status !== "ready") return;
    (async () => {
      setLoading(true);
      const headers = await authHeader();
      if (!headers) { setLoading(false); return; }

      const res = await fetch("/api/cv-builder/save", { headers }).then((r) => r.json()).catch(() => null);
      if (!res?.ok) { setLoading(false); return; }
      setPremiumActive(Boolean(res.premiumActive || res.careerAccessActive));

      const cvs = (res.cvs || []) as CvRow[];

      const targetId = searchParams.get("id");
      const target = targetId
        ? cvs.find((c) => c.id === targetId)
        : (!res.premiumActive && cvs.length >= 1 ? cvs[0] : null);

      if (target) {
        skipNextAutosaveRef.current = true;
        setCvId(target.id);
        setTitle(target.title);
        setTemplate(target.template);
        setCv({ ...EMPTY_CV, ...target.data });
        if (!targetId) router.replace(`/tools/cv-builder?id=${target.id}`);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const save = useCallback(async (): Promise<CvRow | null> => {
    setSaveError("");
    const headers = await authHeader();
    if (!headers) { setSaveError("Please sign in to continue."); return null; }

    const res = await fetch("/api/cv-builder/save", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ id: cvId, title, template, data: cv }),
    }).then((r) => r.json()).catch(() => null);

    if (!res?.ok) {
      setSaveError(res?.error || "Could not save your CV.");
      return null;
    }
    if (!cvId) {
      skipNextAutosaveRef.current = true;
      setCvId(res.cv.id);
      router.replace(`/tools/cv-builder?id=${res.cv.id}`);
    }
    return res.cv as CvRow;
  }, [authHeader, cvId, title, template, cv, router]);

  // Autosave on any change to the form, debounced - this is what makes
  // "log back in and keep editing" actually work. Skipped on the render
  // right after a fresh load/id-change so loading a CV doesn't immediately
  // re-save it.
  useEffect(() => {
    if (loading) return;
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
  }, [title, template, cv, loading]);

  async function downloadPdf() {
    setDownloading(true);
    setSaveError("");
    try {
      const saved = await save();
      if (!saved) { setDownloading(false); return; }

      const headers = await authHeader();
      if (!headers) { setSaveError("Please sign in to continue."); setDownloading(false); return; }

      const res = await fetch("/api/cv-builder/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ cvId: saved.id, template }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setSaveError(err?.error || "Could not generate your PDF.");
        setDownloading(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(cv.personalInfo.fullName || "CV").replace(/[^a-z0-9]+/gi, "_")}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  function updatePersonalInfo(field: keyof CVData["personalInfo"], value: string) {
    setCv((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
  }

  function addExperience() {
    setCv((prev) => ({ ...prev, experience: [...prev.experience, emptyExperience()] }));
  }
  function updateExperience(index: number, patch: Partial<CVExperience>) {
    setCv((prev) => ({ ...prev, experience: prev.experience.map((e, i) => (i === index ? { ...e, ...patch } : e)) }));
  }
  function removeExperience(index: number) {
    setCv((prev) => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }));
  }
  function addBullet(expIndex: number) {
    updateExperience(expIndex, { bullets: [...cv.experience[expIndex].bullets, ""] });
  }
  function updateBullet(expIndex: number, bulletIndex: number, value: string) {
    const bullets = cv.experience[expIndex].bullets.map((b, i) => (i === bulletIndex ? value : b));
    updateExperience(expIndex, { bullets });
  }
  function removeBullet(expIndex: number, bulletIndex: number) {
    updateExperience(expIndex, { bullets: cv.experience[expIndex].bullets.filter((_, i) => i !== bulletIndex) });
  }

  function addEducation() {
    setCv((prev) => ({ ...prev, education: [...prev.education, emptyEducation()] }));
  }
  function updateEducation(index: number, patch: Partial<CVEducation>) {
    setCv((prev) => ({ ...prev, education: prev.education.map((e, i) => (i === index ? { ...e, ...patch } : e)) }));
  }
  function removeEducation(index: number) {
    setCv((prev) => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
  }

  const [skillDraft, setSkillDraft] = useState("");
  function addSkill() {
    const value = skillDraft.trim();
    if (!value) return;
    setCv((prev) => ({ ...prev, skills: [...prev.skills, value] }));
    setSkillDraft("");
  }
  function removeSkill(index: number) {
    setCv((prev) => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
  }

  if (status === "loading" || loading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><p className="text-sm text-muted-foreground">Loading…</p></div>;
  }
  if (status === "signed-out") return null;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">CV Builder</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Choose a CV style, edit each section, then download a formatted PDF. The starter template is free. Paid templates unlock when your career tools access is active.</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {saving ? "Saving…" : saveMsg ? saveMsg : ""}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
          <SectionCard title="Personal info">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><input value={cv.personalInfo.fullName} onChange={(e) => updatePersonalInfo("fullName", e.target.value)} className={inputCls} /></Field>
              <Field label="Email"><input value={cv.personalInfo.email} onChange={(e) => updatePersonalInfo("email", e.target.value)} className={inputCls} type="email" /></Field>
              <Field label="Phone"><input value={cv.personalInfo.phone || ""} onChange={(e) => updatePersonalInfo("phone", e.target.value)} className={inputCls} /></Field>
              <Field label="Location"><input value={cv.personalInfo.location || ""} onChange={(e) => updatePersonalInfo("location", e.target.value)} className={inputCls} /></Field>
              <Field label="LinkedIn"><input value={cv.personalInfo.linkedin || ""} onChange={(e) => updatePersonalInfo("linkedin", e.target.value)} className={inputCls} /></Field>
              <Field label="Website"><input value={cv.personalInfo.website || ""} onChange={(e) => updatePersonalInfo("website", e.target.value)} className={inputCls} /></Field>
            </div>
          </SectionCard>

          <SectionCard title="Summary" description="A short 2-3 sentence overview.">
            <textarea value={cv.summary} onChange={(e) => setCv((prev) => ({ ...prev, summary: e.target.value }))} rows={4} className={inputCls} />
          </SectionCard>

          <SectionCard title="Experience">
            {cv.experience.map((exp, i) => (
              <div key={i} className="rounded-xl border border-border/60 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Job title"><input value={exp.title} onChange={(e) => updateExperience(i, { title: e.target.value })} className={inputCls} /></Field>
                  <Field label="Company"><input value={exp.company} onChange={(e) => updateExperience(i, { company: e.target.value })} className={inputCls} /></Field>
                  <Field label="Start date"><input value={exp.startDate} onChange={(e) => updateExperience(i, { startDate: e.target.value })} className={inputCls} placeholder="Jan 2023" /></Field>
                  <Field label="End date">
                    <input value={exp.endDate} onChange={(e) => updateExperience(i, { endDate: e.target.value })} className={inputCls} placeholder="Dec 2024" disabled={exp.current} />
                  </Field>
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={exp.current} onChange={(e) => updateExperience(i, { current: e.target.checked })} />
                  I currently work here
                </label>

                <div className="mt-3 space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bullet points</label>
                  {exp.bullets.map((b, bi) => (
                    <div key={bi} className="flex items-center gap-2">
                      <input value={b} onChange={(e) => updateBullet(i, bi, e.target.value)} className={inputCls} placeholder="Led the rebuild of..." />
                      <button type="button" onClick={() => removeBullet(i, bi)} className="flex-shrink-0 text-xs font-semibold text-red-600 hover:underline">Remove</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addBullet(i)} className="text-xs font-semibold text-primary hover:underline">+ Add bullet</button>
                </div>

                <button type="button" onClick={() => removeExperience(i)} className="mt-4 text-xs font-semibold text-red-600 hover:underline">Remove this role</button>
              </div>
            ))}
            <button type="button" onClick={addExperience} className="rounded-xl border border-dashed border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary">
              + Add experience
            </button>
          </SectionCard>

          <SectionCard title="Education">
            {cv.education.map((edu, i) => (
              <div key={i} className="rounded-xl border border-border/60 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Institution"><input value={edu.institution} onChange={(e) => updateEducation(i, { institution: e.target.value })} className={inputCls} /></Field>
                  <Field label="Degree"><input value={edu.degree} onChange={(e) => updateEducation(i, { degree: e.target.value })} className={inputCls} placeholder="B.Sc." /></Field>
                  <Field label="Field of study"><input value={edu.field || ""} onChange={(e) => updateEducation(i, { field: e.target.value })} className={inputCls} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start"><input value={edu.startDate} onChange={(e) => updateEducation(i, { startDate: e.target.value })} className={inputCls} placeholder="2015" /></Field>
                    <Field label="End"><input value={edu.endDate} onChange={(e) => updateEducation(i, { endDate: e.target.value })} className={inputCls} placeholder="2019" /></Field>
                  </div>
                </div>
                <button type="button" onClick={() => removeEducation(i)} className="mt-4 text-xs font-semibold text-red-600 hover:underline">Remove</button>
              </div>
            ))}
            <button type="button" onClick={addEducation} className="rounded-xl border border-dashed border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary">
              + Add education
            </button>
          </SectionCard>

          <SectionCard title="Skills">
            <div className="flex flex-wrap gap-2">
              {cv.skills.map((s, i) => (
                <span key={i} className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground">
                  {s}
                  <button type="button" onClick={() => removeSkill(i)} className="text-muted-foreground hover:text-red-600">×</button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                className={inputCls}
                placeholder="e.g. React"
              />
              <button type="button" onClick={addSkill} className="flex-shrink-0 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted">Add</button>
            </div>
          </SectionCard>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <SectionCard title="Templates" description="Nine styles for different career stages.">
              <div className="space-y-3">
                {CV_TEMPLATES.map((t) => {
                  const isSelected = template === t.key;
                  const isLocked = t.access === "paid" && !premiumActive;
                  return (
                    <div key={t.key} className={`rounded-xl border p-3 transition ${isSelected ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                      <button
                        type="button"
                        disabled={isLocked}
                        onClick={() => setTemplate(t.key)}
                        className="grid w-full grid-cols-[74px_minmax(0,1fr)] gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <div className="relative aspect-[1/1.414] overflow-hidden rounded-lg border border-border bg-muted">
                          <TemplatePreview templateKey={t.key} />
                        </div>
                        <span className="min-w-0">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-foreground">{t.label}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${t.access === "free" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                              {t.access}
                            </span>
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{t.audience}</span>
                        </span>
                      </button>
                      {isLocked && (
                        <Link href="/account/membership" className="mt-2 inline-flex min-h-10 items-center rounded-lg px-2 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                          Unlock this template
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}

            <button
              type="button"
              onClick={downloadPdf}
              disabled={downloading}
              className="min-h-11 w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {downloading ? "Preparing your PDF…" : "Download PDF"}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
