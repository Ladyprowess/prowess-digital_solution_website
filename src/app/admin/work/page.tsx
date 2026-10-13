"use client";

import { useCallback, useEffect, useState } from "react";
import { SkillPicker, saveSkillMap, type Skill } from "@/components/admin/SkillPicker";
import { SourcesPanel } from "@/components/admin/SourcesPanel";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { CompanyPicker } from "@/components/admin/CompanyPicker";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";

type Lookup = { id: string; slug: string; name: string };

type JobRow = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "closed" | "expired";
  location_type: "remote" | "hybrid" | "on_site";
  country: string | null;
  city: string | null;
  deadline_at: string | null;
  companies: { name: string } | null;
  job_categories: { name: string } | null;
  job_types: { name: string } | null;
  job_sources: { name: string } | null;
};

const JOB_CONNECTORS = [
  { value: "remoteok", label: "Remote OK (JSON API)" },
  { value: "remotefirstjobs", label: "Remote First Jobs (RSS, per category)" },
  { value: "himalayas", label: "Himalayas (RSS)" },
  { value: "weworkremotely", label: "We Work Remotely (RSS)" },
  { value: "arbeitnow", label: "Arbeitnow (JSON API)" },
  { value: "remotive", label: "Remotive (JSON API - max 4x/day per their terms)" },
  { value: "jobicy", label: "Jobicy (JSON API)" },
  { value: "greenhouse", label: "Greenhouse (per company)" },
  { value: "lever", label: "Lever (per company)" },
  { value: "cryptojobslist", label: "CryptoJobsList (sitemap - their RSS feed is dead)" },
];

const LOCATION_TYPES = ["remote", "hybrid", "on_site"] as const;
const EXPERIENCE_LEVELS = ["entry", "junior", "mid", "senior", "executive"] as const;
const SALARY_PERIODS = ["hour", "day", "month", "year"] as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function WorkAdmin() {
  const [categories, setCategories] = useState<Lookup[]>([]);
  const [types, setTypes] = useState<Lookup[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const [title, setTitle] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [locationType, setLocationType] = useState<(typeof LOCATION_TYPES)[number]>("remote");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [remoteRegions, setRemoteRegions] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("USD");
  const [salaryPeriod, setSalaryPeriod] = useState<(typeof SALARY_PERIODS)[number]>("year");
  const [experienceLevel, setExperienceLevel] = useState<(typeof EXPERIENCE_LEVELS)[number] | "">("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [benefits, setBenefits] = useState("");
  const [niceToHave, setNiceToHave] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [featured, setFeatured] = useState(false);
  const [publishNow, setPublishNow] = useState(true);
  const [editingStatus, setEditingStatus] = useState<JobRow["status"] | null>(null);
  // The real posting date captured at import time (see
  // supabase/source_published_at.sql) - null for a manually created job.
  // Publishing an imported job should use this instead of "now", so its
  // "Posted X days ago" label and newest-first sort reflect when it
  // actually went live on the site it came from, not when an admin
  // happened to click Publish.
  const [sourcePublishedAt, setSourcePublishedAt] = useState<string | null>(null);
  const [manualSlug, setManualSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const loadLists = useCallback(async () => {
    setLoadingLists(true);
    const [{ data: cats }, { data: jobTypes }, { data: skillRows }] = await Promise.all([
      supabase.from("job_categories").select("id, slug, name").order("name"),
      supabase.from("job_types").select("id, slug, name").order("name"),
      supabase.from("skills").select("id, slug, name").order("name"),
    ]);
    setCategories(cats || []);
    setTypes(jobTypes || []);
    setSkills(skillRows || []);
    setLoadingLists(false);
  }, []);

  useEffect(() => { loadLists(); }, [loadLists]);

  const JOBS_PAGE_SIZE = 20;
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobStatusFilter, setJobStatusFilter] = useState<"all" | JobRow["status"]>("all");
  const [jobSearch, setJobSearch] = useState("");
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    let query = supabase
      .from("jobs")
      .select("id, slug, title, status, location_type, country, city, deadline_at, companies(name), job_categories(name), job_types(name), job_sources(name)", { count: "exact" });
    if (jobStatusFilter !== "all") query = query.eq("status", jobStatusFilter);
    if (jobSearch.trim()) query = query.ilike("title", `%${jobSearch.trim()}%`);

    const from = (jobsPage - 1) * JOBS_PAGE_SIZE;
    const { data, count } = await query.order("created_at", { ascending: false }).range(from, from + JOBS_PAGE_SIZE - 1);

    setJobs((data as unknown as JobRow[]) || []);
    setJobsTotal(count || 0);
    setSelectedJobIds([]);
    setLoadingJobs(false);
  }, [jobsPage, jobStatusFilter, jobSearch]);

  useEffect(() => {
    const t = setTimeout(loadJobs, 200);
    return () => clearTimeout(t);
  }, [loadJobs]);

  useEffect(() => { setJobsPage(1); }, [jobStatusFilter, jobSearch]);

  const jobsTotalPages = Math.max(1, Math.ceil(jobsTotal / JOBS_PAGE_SIZE));

  function toggleJobSelected(id: string) {
    setSelectedJobIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAllOnPage() {
    setSelectedJobIds((prev) => (prev.length === jobs.length ? [] : jobs.map((j) => j.id)));
  }

  async function deleteSelectedJobs() {
    if (selectedJobIds.length === 0) return;
    if (!confirm(`Delete ${selectedJobIds.length} job${selectedJobIds.length === 1 ? "" : "s"}? This can't be undone.`)) return;
    setBulkDeleting(true);
    await supabase.from("jobs").delete().in("id", selectedJobIds);
    setBulkDeleting(false);
    loadJobs();
  }

  async function getUniqueJobSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 1;
    while (true) {
      const { data } = await supabase.from("jobs").select("id").eq("slug", candidate).maybeSingle();
      if (!data) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }

  async function getManualSourceId(): Promise<string> {
    const { data, error } = await supabase.from("job_sources").select("id").eq("slug", "manual").single();
    if (error || !data) throw new Error("The 'manual' job source is missing. Run supabase/jobs_opportunities_seed.sql first.");
    return data.id;
  }

  const resetForm = () => {
    setEditingJobId(null);
    setTitle(""); setCompanyId(null); setCategoryId(""); setTypeId("");
    setLocationType("remote"); setCountry(""); setCity(""); setRemoteRegions("");
    setSalaryMin(""); setSalaryMax(""); setSalaryCurrency("USD"); setSalaryPeriod("year"); setExperienceLevel("");
    setDescription(""); setRequirements(""); setResponsibilities(""); setBenefits(""); setNiceToHave("");
    setApplyUrl(""); setDeadlineAt(""); setFeatured(false); setPublishNow(true); setSelectedSkillIds([]);
    setEditingStatus(null); setManualSlug(""); setOriginalSlug(""); setMetaTitle(""); setMetaDescription("");
    setSourcePublishedAt(null);
  };

  async function startEditJob(id: string) {
    setErr(""); setMsg("");
    setLoadingEdit(true);
    const { data, error } = await supabase
      .from("jobs")
      .select("id, slug, title, company_id, category_id, type_id, location_type, country, city, remote_regions, salary_min, salary_max, salary_currency, salary_period, experience_level, description, requirements, responsibilities, benefits, nice_to_have, apply_url, deadline_at, featured, status, meta_title, meta_description, source_published_at, job_skill_map(skill_id)")
      .eq("id", id)
      .single();
    setLoadingEdit(false);
    if (error || !data) { setErr(error?.message || "Could not load this job."); return; }

    const job = data as unknown as {
      id: string; slug: string; title: string; company_id: string; category_id: string; type_id: string;
      location_type: (typeof LOCATION_TYPES)[number]; country: string | null; city: string | null;
      remote_regions: string[] | null; salary_min: number | null; salary_max: number | null;
      salary_currency: string | null; salary_period: (typeof SALARY_PERIODS)[number] | null;
      experience_level: (typeof EXPERIENCE_LEVELS)[number] | null;
      description: string | null; requirements: string | null; responsibilities: string | null;
      benefits: string | null; nice_to_have: string | null;
      apply_url: string; deadline_at: string | null; featured: boolean; status: JobRow["status"];
      meta_title: string | null; meta_description: string | null;
      source_published_at: string | null;
      job_skill_map: { skill_id: string }[];
    };

    setEditingJobId(job.id);
    setTitle(job.title);
    setCompanyId(job.company_id);
    setCategoryId(job.category_id);
    setTypeId(job.type_id);
    setLocationType(job.location_type);
    setCountry(job.country || "");
    setCity(job.city || "");
    setRemoteRegions((job.remote_regions || []).join(", "));
    setSalaryMin(job.salary_min?.toString() || "");
    setSalaryMax(job.salary_max?.toString() || "");
    setSalaryCurrency(job.salary_currency || "USD");
    setSalaryPeriod(job.salary_period || "year");
    setExperienceLevel(job.experience_level || "");
    setDescription(job.description || "");
    setRequirements(job.requirements || "");
    setResponsibilities(job.responsibilities || "");
    setBenefits(job.benefits || "");
    setNiceToHave(job.nice_to_have || "");
    setApplyUrl(job.apply_url);
    setDeadlineAt(job.deadline_at ? job.deadline_at.slice(0, 10) : "");
    setFeatured(job.featured);
    setPublishNow(job.status === "published");
    setSelectedSkillIds(job.job_skill_map.map((m) => m.skill_id));
    setEditingStatus(job.status);
    setManualSlug(job.slug);
    setOriginalSlug(job.slug);
    setMetaTitle(job.meta_title || "");
    setMetaDescription(job.meta_description || "");
    setSourcePublishedAt(job.source_published_at);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const submit = async () => {
    setErr(""); setMsg("");
    if (!title.trim()) return setErr("Job title is required.");
    if (!companyId) return setErr("Company is required.");
    if (!categoryId) return setErr("Category is required.");
    if (!typeId) return setErr("Job type is required.");
    if (!applyUrl.trim()) return setErr("Apply link is required.");

    setSaving(true);
    try {
      const now = new Date().toISOString();

      const basePayload = {
        title: title.trim(),
        company_id: companyId,
        category_id: categoryId,
        type_id: typeId,
        location_type: locationType,
        country: country.trim() || null,
        city: city.trim() || null,
        remote_regions: remoteRegions.trim() ? remoteRegions.split(",").map((r) => r.trim()).filter(Boolean) : null,
        salary_min: salaryMin ? Number(salaryMin) : null,
        salary_max: salaryMax ? Number(salaryMax) : null,
        salary_currency: salaryMin || salaryMax ? salaryCurrency : null,
        salary_period: salaryMin || salaryMax ? salaryPeriod : null,
        experience_level: experienceLevel || null,
        description: description.trim() || null,
        requirements: requirements.trim() || null,
        responsibilities: responsibilities.trim() || null,
        benefits: benefits.trim() || null,
        nice_to_have: niceToHave.trim() || null,
        apply_url: applyUrl.trim(),
        featured,
        status: publishNow ? "published" : "draft",
        deadline_at: deadlineAt ? `${deadlineAt}T23:59:59.999+01:00` : null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
      };

      let jobId = editingJobId;

      if (editingJobId) {
        // The slug can only move while the job is still a draft - once
        // published, changing it would break a URL someone may have
        // already bookmarked, shared or that search engines have indexed.
        const wantsSlugChange = editingStatus === "draft" && manualSlug.trim() && slugify(manualSlug) !== originalSlug;
        const slugUpdate = wantsSlugChange ? { slug: await getUniqueJobSlug(slugify(manualSlug)) } : {};

        // Source stays untouched on edit - an imported job keeps its real
        // source attribution instead of silently becoming "manual" just
        // because an admin edited it.
        const { error } = await supabase.from("jobs").update({
          ...basePayload,
          ...slugUpdate,
          // Prefer the real source posting date over "now" when this job
          // was imported and we captured one - see sourcePublishedAt above.
          published_at: publishNow ? (sourcePublishedAt || now) : null,
        }).eq("id", editingJobId);
        if (error) throw new Error(error.message);
        await supabase.from("job_skill_map").delete().eq("job_id", editingJobId);
      } else {
        const [sourceId, slug] = await Promise.all([
          getManualSourceId(),
          getUniqueJobSlug(slugify(manualSlug.trim() || title)),
        ]);
        const { data: created, error } = await supabase.from("jobs").insert({
          ...basePayload,
          slug,
          source_id: sourceId,
          published_at: publishNow ? now : null,
        }).select("id").single();
        if (error || !created) throw new Error(error?.message || "Could not save the job.");
        jobId = created.id;
      }

      await saveSkillMap("job_skill_map", "job_id", jobId!, selectedSkillIds);

      setMsg(editingJobId ? "Job updated." : "Job saved.");
      resetForm();
      loadJobs();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  async function setJobStatus(id: string, status: JobRow["status"]) {
    await supabase.from("jobs").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status } : j)));
  }

  async function deleteJob(id: string) {
    if (!confirm("Delete this job? This can't be undone.")) return;
    await supabase.from("jobs").delete().eq("id", id);
    loadJobs();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Jobs</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage job listings and the sources that feed them.</p>

      <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h2 className="text-xl font-semibold text-foreground">{editingJobId ? "Edit Job" : "Add Job"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {editingJobId ? "Update this job listing." : "Create a job listing here and publish it to show on the Work board."}
          </p>
          {loadingEdit && <p className="mt-2 text-sm text-muted-foreground">Loading job…</p>}

          <div className="mt-8 grid gap-4">
            <Field label="Job title *">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Senior Product Designer" />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Company *">
                <CompanyPicker value={companyId} onChange={setCompanyId} />
              </Field>
              <Field label="Apply link (URL) *">
                <input value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} className={inputCls} placeholder="https://..." />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Category *">
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls} disabled={loadingLists}>
                  <option value="">Select a category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Job type *">
                <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={inputCls} disabled={loadingLists}>
                  <option value="">Select a type</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Location type">
                <select value={locationType} onChange={(e) => setLocationType(e.target.value as typeof locationType)} className={inputCls}>
                  {LOCATION_TYPES.map((lt) => (
                    <option key={lt} value={lt}>{lt === "on_site" ? "On-site" : lt[0].toUpperCase() + lt.slice(1)}</option>
                  ))}
                </select>
              </Field>
              <Field label="Country">
                <input value={country} onChange={(e) => setCountry(e.target.value)} className={inputCls} placeholder="e.g. Nigeria" />
              </Field>
              <Field label="City">
                <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="e.g. Lagos" />
              </Field>
            </div>

            <Field label="Remote regions (comma-separated, optional)">
              <input value={remoteRegions} onChange={(e) => setRemoteRegions(e.target.value)} className={inputCls} placeholder="e.g. Africa, US, Canada" />
            </Field>

            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Salary min">
                <input value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className={inputCls} placeholder="e.g. 1500" type="number" />
              </Field>
              <Field label="Salary max">
                <input value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className={inputCls} placeholder="e.g. 2500" type="number" />
              </Field>
              <Field label="Currency">
                <input value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)} className={inputCls} placeholder="USD" />
              </Field>
              <Field label="Per">
                <select value={salaryPeriod} onChange={(e) => setSalaryPeriod(e.target.value as typeof salaryPeriod)} className={inputCls}>
                  {SALARY_PERIODS.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Experience level">
                <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value as typeof experienceLevel)} className={inputCls}>
                  <option value="">Not specified</option>
                  {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="Application deadline">
                <input value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} className={inputCls} type="date" />
              </Field>
            </div>

            <Field label="Description">
              <RichTextEditor key={`desc-${editingJobId || "new"}`} value={description} onChange={setDescription} placeholder="What the role is about..." />
            </Field>
            <Field label="Responsibilities">
              <RichTextEditor key={`resp-${editingJobId || "new"}`} value={responsibilities} onChange={setResponsibilities} placeholder="What the person will actually do..." />
            </Field>
            <Field label="Requirements">
              <RichTextEditor key={`req-${editingJobId || "new"}`} value={requirements} onChange={setRequirements} placeholder="What's required to apply..." />
            </Field>
            <Field label="Benefits (optional)">
              <RichTextEditor key={`benefits-${editingJobId || "new"}`} value={benefits} onChange={setBenefits} placeholder="What the role offers - remote work, learning budget, etc..." />
            </Field>
            <Field label="Nice to have (optional)">
              <RichTextEditor key={`nth-${editingJobId || "new"}`} value={niceToHave} onChange={setNiceToHave} placeholder="Not required, but a plus..." />
            </Field>

            <Field label="Skills">
              <SkillPicker
                skills={skills} onSkillsChange={setSkills}
                selectedIds={selectedSkillIds} onSelectedIdsChange={setSelectedSkillIds}
              />
            </Field>

            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">SEO (optional)</p>
              <div className="mt-4 grid gap-4">
                <Field label={editingStatus && editingStatus !== "draft" ? "URL slug (frozen once published)" : "URL slug"}>
                  <input
                    value={manualSlug}
                    onChange={(e) => setManualSlug(e.target.value)}
                    disabled={Boolean(editingStatus) && editingStatus !== "draft"}
                    className={`${inputCls} disabled:cursor-not-allowed disabled:opacity-60`}
                    placeholder="Leave blank to auto-generate from the title"
                  />
                </Field>
                <Field label="Meta title">
                  <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputCls} placeholder="Defaults to the job title if left blank" />
                </Field>
                <Field label="Meta description">
                  <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className={`${inputCls} min-h-20`} placeholder="Shown in search results and link previews" />
                </Field>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} />
                Publish immediately
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
                Featured
              </label>
            </div>

            {err ? <p className="text-sm text-red-600">{err}</p> : null}
            {msg ? <p className="text-sm text-green-700">{msg}</p> : null}

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
              >
                {saving ? "Saving..." : editingJobId ? "Update job" : "Save job"}
              </button>
              {editingJobId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-shrink-0 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <SourcesPanel
          title="Job Sources"
          importApiPath="/api/admin/jobs/import"
          connectorOptions={JOB_CONNECTORS}
          categoryOptions={categories}
          typeOptions={types}
        />

        <div className="mx-auto mt-10 max-w-5xl rounded-2xl border border-border bg-card p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">All Jobs</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                placeholder="Search title..."
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
              />
              <select
                value={jobStatusFilter}
                onChange={(e) => setJobStatusFilter(e.target.value as typeof jobStatusFilter)}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {selectedJobIds.length > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">{selectedJobIds.length} selected</span>
              <button
                type="button"
                onClick={deleteSelectedJobs}
                disabled={bulkDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60 hover:bg-red-700"
              >
                {bulkDeleting ? "Deleting..." : `Delete ${selectedJobIds.length} selected`}
              </button>
            </div>
          )}

          {loadingJobs ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : jobs.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No jobs match this filter.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">
                      <input type="checkbox" checked={selectedJobIds.length === jobs.length} onChange={toggleSelectAllOnPage} />
                    </th>
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Company</th>
                    <th className="py-2 pr-4">Source</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Deadline</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((j) => (
                    <tr key={j.id} className="border-b border-border/60">
                      <td className="py-2 pr-3">
                        <input type="checkbox" checked={selectedJobIds.includes(j.id)} onChange={() => toggleJobSelected(j.id)} />
                      </td>
                      <td className="py-2 pr-4 font-medium text-foreground">{j.title}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{j.companies?.name || "-"}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{j.job_sources?.name || "-"}</td>
                      <td className="py-2 pr-4">
                        <select
                          value={j.status}
                          onChange={(e) => setJobStatus(j.id, e.target.value as JobRow["status"])}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="closed">Closed</option>
                          <option value="expired">Expired</option>
                        </select>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{j.deadline_at ? new Date(j.deadline_at).toLocaleDateString() : "-"}</td>
                      <td className="py-2 pr-4">
                        <button onClick={() => startEditJob(j.id)} className="mr-3 text-xs font-semibold text-primary hover:underline">Edit</button>
                        <button onClick={() => deleteJob(j.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-2 text-center text-xs text-muted-foreground">{jobsTotal} job{jobsTotal === 1 ? "" : "s"} total</p>
          <AdminPagination page={jobsPage} totalPages={jobsTotalPages} onPageChange={setJobsPage} />
        </div>
      </div>
  );
}

export default function AdminWorkPage() {
  return <WorkAdmin />;
}

