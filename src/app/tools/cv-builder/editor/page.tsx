"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { sampleCvDataForTemplate, TemplatePreview } from "@/components/cvBuilder/TemplatePreview";
import type { CVData, CVEducation, CVExperience } from "@/lib/cvBuilder/validate";
import { CV_TEMPLATES, isKnownCvTemplate } from "@/lib/cvBuilder/templates";
import { supabase } from "@/lib/supabase";
import { useMemberSession } from "@/lib/useMemberSession";

const inputCls = "w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
const AUTOSAVE_DELAY = 1800;

type CvRow = { id: string; title: string; template: string; data: CVData; updated_at: string };

const EMPTY_CV: CVData = {
  personalInfo: { fullName: "", email: "", phone: "", location: "", linkedin: "", website: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  highlights: [],
  extras: [],
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
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export default function CvBuilderEditorPage() {
  return (
    <Suspense fallback={null}>
      <CvBuilderEditor />
    </Suspense>
  );
}

function CvBuilderEditor() {
  const { status } = useMemberSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTemplate = searchParams.get("template") || "plain";
  const [cvId, setCvId] = useState<string | null>(searchParams.get("id"));
  const [template, setTemplate] = useState(isKnownCvTemplate(initialTemplate) ? initialTemplate : "plain");
  const [title, setTitle] = useState("My CV");
  const [cv, setCv] = useState<CVData>(() => sampleCvDataForTemplate(isKnownCvTemplate(initialTemplate) ? initialTemplate : "plain"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [skillDraft, setSkillDraft] = useState("");

  const skipNextAutosaveRef = useRef(true);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : null;
  }, []);

  const canSave = Boolean(cv.personalInfo.fullName.trim() && cv.personalInfo.email.trim());

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
      if (!res?.ok) {
        setSaveError(res?.error || "Could not load your CVs.");
        setLoading(false);
        return;
      }

      const cvs = (res.cvs || []) as CvRow[];
      const targetId = searchParams.get("id");
      const target = targetId ? cvs.find((item) => item.id === targetId) : null;

      if (target) {
        skipNextAutosaveRef.current = true;
        setCvId(target.id);
        setTitle(target.title);
        setTemplate(target.template);
        setCv({ ...EMPTY_CV, ...target.data, personalInfo: { ...EMPTY_CV.personalInfo, ...target.data.personalInfo } });
      } else {
        const selectedTemplate = isKnownCvTemplate(initialTemplate) ? initialTemplate : "plain";
        const selected = CV_TEMPLATES.find((item) => item.key === selectedTemplate) || CV_TEMPLATES[0];
        skipNextAutosaveRef.current = true;
        setTitle(`${selected.label} CV`);
        setTemplate(selectedTemplate);
        setCv(sampleCvDataForTemplate(selectedTemplate));
      }

      setLoading(false);
    })();
  }, [authHeader, initialTemplate, searchParams, status]);

  const save = useCallback(async (): Promise<CvRow | null> => {
    setSaveError("");
    if (!canSave) {
      setSaveError("Add at least a full name and email before saving or downloading.");
      return null;
    }

    const headers = await authHeader();
    if (!headers) {
      setSaveError("Please sign in to continue.");
      return null;
    }

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
      router.replace(`/tools/cv-builder/editor?id=${res.cv.id}&template=${template}`);
    }

    return res.cv as CvRow;
  }, [authHeader, canSave, cv, cvId, router, template, title]);

  useEffect(() => {
    if (loading) return;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }
    if (!canSave) {
      setSaveMsg("");
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      return;
    }

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      setSaveMsg("");
      const saved = await save();
      setSaving(false);
      if (saved) setSaveMsg("Saved");
    }, AUTOSAVE_DELAY);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [title, template, cv, loading, canSave, save]);

  function updatePersonalInfo(field: keyof CVData["personalInfo"], value: string) {
    setCv((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
  }

  async function downloadPdf() {
    setDownloading(true);
    setSaveError("");
    try {
      const saved = await save();
      if (!saved) return;

      const headers = await authHeader();
      if (!headers) {
        setSaveError("Please sign in to continue.");
        return;
      }

      const res = await fetch("/api/cv-builder/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ cvId: saved.id, template }),
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
      a.download = `${(cv.personalInfo.fullName || "CV").replace(/[^a-z0-9]+/gi, "_")}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  function addExperience() {
    setCv((prev) => ({ ...prev, experience: [...prev.experience, emptyExperience()] }));
  }

  function updateExperience(index: number, patch: Partial<CVExperience>) {
    setCv((prev) => ({ ...prev, experience: prev.experience.map((item, i) => (i === index ? { ...item, ...patch } : item)) }));
  }

  function removeExperience(index: number) {
    setCv((prev) => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) }));
  }

  function addBullet(expIndex: number) {
    updateExperience(expIndex, { bullets: [...cv.experience[expIndex].bullets, ""] });
  }

  function updateBullet(expIndex: number, bulletIndex: number, value: string) {
    const bullets = cv.experience[expIndex].bullets.map((bullet, i) => (i === bulletIndex ? value : bullet));
    updateExperience(expIndex, { bullets });
  }

  function removeBullet(expIndex: number, bulletIndex: number) {
    updateExperience(expIndex, { bullets: cv.experience[expIndex].bullets.filter((_, i) => i !== bulletIndex) });
  }

  function addEducation() {
    setCv((prev) => ({ ...prev, education: [...prev.education, emptyEducation()] }));
  }

  function updateEducation(index: number, patch: Partial<CVEducation>) {
    setCv((prev) => ({ ...prev, education: prev.education.map((item, i) => (i === index ? { ...item, ...patch } : item)) }));
  }

  function removeEducation(index: number) {
    setCv((prev) => ({ ...prev, education: prev.education.filter((_, i) => i !== index) }));
  }

  function addSkill() {
    const value = skillDraft.trim();
    if (!value) return;
    setCv((prev) => ({ ...prev, skills: [...prev.skills, value] }));
    setSkillDraft("");
  }

  function removeSkill(index: number) {
    setCv((prev) => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
  }

  function updateListItem(field: "highlights" | "extras", index: number, value: string) {
    setCv((prev) => ({
      ...prev,
      [field]: (prev[field] || []).map((item, i) => (i === index ? value : item)),
    }));
  }

  function addListItem(field: "highlights" | "extras") {
    setCv((prev) => ({ ...prev, [field]: [...(prev[field] || []), ""] }));
  }

  function removeListItem(field: "highlights" | "extras", index: number) {
    setCv((prev) => ({ ...prev, [field]: (prev[field] || []).filter((_, i) => i !== index) }));
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading editor...</p>
      </div>
    );
  }

  if (status === "signed-out") return null;

  const currentTemplate = CV_TEMPLATES.find((item) => item.key === template) || CV_TEMPLATES[0];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-[1500px] px-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/tools/cv-builder" className="text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              Back to templates
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-foreground">Edit {currentTemplate.label}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Edit each section on the form. The CV preview updates immediately on the side.
            </p>
          </div>
          <div className="min-h-10 text-right text-xs font-semibold text-muted-foreground">
            {saving ? "Saving..." : saveMsg || (!canSave ? "Add name and email to save" : "")}
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
          <main className="space-y-5">
            <SectionCard title="Personal info">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="CV title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} autoComplete="off" /></Field>
                <Field label="Full name"><input value={cv.personalInfo.fullName} onChange={(e) => updatePersonalInfo("fullName", e.target.value)} className={inputCls} autoComplete="name" /></Field>
                <Field label="Email"><input value={cv.personalInfo.email} onChange={(e) => updatePersonalInfo("email", e.target.value)} className={inputCls} type="email" autoComplete="email" /></Field>
                <Field label="Phone"><input value={cv.personalInfo.phone || ""} onChange={(e) => updatePersonalInfo("phone", e.target.value)} className={inputCls} type="tel" autoComplete="tel" /></Field>
                <Field label="Location"><input value={cv.personalInfo.location || ""} onChange={(e) => updatePersonalInfo("location", e.target.value)} className={inputCls} autoComplete="address-level2" /></Field>
                <Field label="LinkedIn"><input value={cv.personalInfo.linkedin || ""} onChange={(e) => updatePersonalInfo("linkedin", e.target.value)} className={inputCls} autoComplete="url" /></Field>
                <Field label="Website"><input value={cv.personalInfo.website || ""} onChange={(e) => updatePersonalInfo("website", e.target.value)} className={inputCls} autoComplete="url" /></Field>
              </div>
            </SectionCard>

            <SectionCard title="Summary" description="Write a short profile that connects your experience to the role you want.">
              <textarea value={cv.summary} onChange={(e) => setCv((prev) => ({ ...prev, summary: e.target.value }))} rows={5} className={inputCls} />
            </SectionCard>

            <SectionCard title="Experience">
              {cv.experience.length === 0 && <p className="text-sm text-muted-foreground">Add a role to replace the sample experience shown in the preview.</p>}
              {cv.experience.map((exp, i) => (
                <div key={i} className="rounded-lg border border-border/70 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Job title"><input value={exp.title} onChange={(e) => updateExperience(i, { title: e.target.value })} className={inputCls} autoComplete="organization-title" /></Field>
                    <Field label="Company"><input value={exp.company} onChange={(e) => updateExperience(i, { company: e.target.value })} className={inputCls} autoComplete="organization" /></Field>
                    <Field label="Start date"><input value={exp.startDate} onChange={(e) => updateExperience(i, { startDate: e.target.value })} className={inputCls} placeholder="Jan 2023" /></Field>
                    <Field label="End date"><input value={exp.endDate} onChange={(e) => updateExperience(i, { endDate: e.target.value })} className={inputCls} placeholder="Dec 2024" disabled={exp.current} /></Field>
                  </div>
                  <label className="mt-3 flex min-h-10 items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" checked={exp.current} onChange={(e) => updateExperience(i, { current: e.target.checked })} />
                    I currently work here
                  </label>

                  <div className="mt-3 space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bullet points</label>
                    {exp.bullets.map((bullet, bi) => (
                      <div key={bi} className="flex items-center gap-2">
                        <input value={bullet} onChange={(e) => updateBullet(i, bi, e.target.value)} className={inputCls} placeholder="Improved monthly reporting by..." />
                        <button type="button" onClick={() => removeBullet(i, bi)} className="min-h-10 flex-shrink-0 rounded-lg px-2 text-xs font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Remove</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addBullet(i)} className="min-h-10 rounded-lg px-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Add bullet</button>
                  </div>

                  <button type="button" onClick={() => removeExperience(i)} className="mt-3 min-h-10 rounded-lg px-1 text-xs font-semibold text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Remove this role</button>
                </div>
              ))}
              <button type="button" onClick={addExperience} className="min-h-11 rounded-lg border border-dashed border-border px-4 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Add experience
              </button>
            </SectionCard>

            <SectionCard title="Education">
              {cv.education.length === 0 && <p className="text-sm text-muted-foreground">Add education to replace the sample education shown in the preview.</p>}
              {cv.education.map((edu, i) => (
                <div key={i} className="rounded-lg border border-border/70 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Institution"><input value={edu.institution} onChange={(e) => updateEducation(i, { institution: e.target.value })} className={inputCls} autoComplete="organization" /></Field>
                    <Field label="Degree"><input value={edu.degree} onChange={(e) => updateEducation(i, { degree: e.target.value })} className={inputCls} placeholder="B.Sc." /></Field>
                    <Field label="Field of study"><input value={edu.field || ""} onChange={(e) => updateEducation(i, { field: e.target.value })} className={inputCls} /></Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Start"><input value={edu.startDate} onChange={(e) => updateEducation(i, { startDate: e.target.value })} className={inputCls} placeholder="2019" /></Field>
                      <Field label="End"><input value={edu.endDate} onChange={(e) => updateEducation(i, { endDate: e.target.value })} className={inputCls} placeholder="2023" /></Field>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeEducation(i)} className="mt-3 min-h-10 rounded-lg px-1 text-xs font-semibold text-destructive hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Remove education</button>
                </div>
              ))}
              <button type="button" onClick={addEducation} className="min-h-11 rounded-lg border border-dashed border-border px-4 text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                Add education
              </button>
            </SectionCard>

            <SectionCard title="Skills">
              <div className="flex flex-wrap gap-2">
                {cv.skills.map((skill, i) => (
                  <span key={`${skill}-${i}`} className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-semibold text-foreground">
                    {skill}
                    <button type="button" onClick={() => removeSkill(i)} className="rounded-full px-1 text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">×</button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={skillDraft}
                  onChange={(e) => setSkillDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  className={inputCls}
                  placeholder="e.g. Customer service"
                />
                <button type="button" onClick={addSkill} className="min-h-11 flex-shrink-0 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Add</button>
              </div>
            </SectionCard>

            <SectionCard title="Highlights" description="Short proof points that appear in templates with a highlights area.">
              <div className="space-y-2">
                {(cv.highlights || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={item} onChange={(e) => updateListItem("highlights", i, e.target.value)} className={inputCls} placeholder="e.g. 32 percent faster hiring" />
                    <button type="button" onClick={() => removeListItem("highlights", i)} className="min-h-10 flex-shrink-0 rounded-lg px-2 text-xs font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Remove</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addListItem("highlights")} className="min-h-10 rounded-lg px-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Add highlight</button>
            </SectionCard>

            <SectionCard title="Additional information" description="Portfolio links, tools, certifications, publications or relevant notes shown on the CV.">
              <div className="space-y-2">
                {(cv.extras || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={item} onChange={(e) => updateListItem("extras", i, e.target.value)} className={inputCls} placeholder="e.g. Tools: Excel, Power BI, Notion" />
                    <button type="button" onClick={() => removeListItem("extras", i)} className="min-h-10 flex-shrink-0 rounded-lg px-2 text-xs font-semibold text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Remove</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => addListItem("extras")} className="min-h-10 rounded-lg px-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Add information</button>
            </SectionCard>

            {saveError && <p className="text-sm font-medium text-destructive">{saveError}</p>}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || !canSave}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save CV"}
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                disabled={downloading || !canSave}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloading ? "Preparing PDF..." : "Download PDF"}
              </button>
            </div>
          </main>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-foreground">Live CV preview</h2>
                  <p className="text-xs text-muted-foreground">{currentTemplate.label}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase text-primary">Live</span>
              </div>
              <div className="mx-auto aspect-[1/1.414] w-full max-w-[480px] overflow-hidden rounded-md border border-border bg-background shadow-sm">
                <TemplatePreview templateKey={template} cvData={cv} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
