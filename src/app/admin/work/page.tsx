"use client";

import { useCallback, useEffect, useState } from "react";
import Container from "@/components/Container";
import { AdminGate } from "@/components/admin/AdminGate";
import { SkillPicker, saveSkillMap, type Skill } from "@/components/admin/SkillPicker";
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

type SourceRow = {
  id: string;
  slug: string;
  name: string;
  source_type: string;
  connector: string | null;
  feed_url: string | null;
  active: boolean;
  auto_publish: boolean;
  import_frequency_minutes: number;
  last_imported_at: string | null;
  last_import_error: string | null;
  last_import_count: number | null;
};

const LOCATION_TYPES = ["remote", "hybrid", "on_site"] as const;
const EXPERIENCE_LEVELS = ["entry", "junior", "mid", "senior", "executive"] as const;

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
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [importingSlug, setImportingSlug] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState("");
  const [loadingLists, setLoadingLists] = useState(true);

  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
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
  const [experienceLevel, setExperienceLevel] = useState<(typeof EXPERIENCE_LEVELS)[number] | "">("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [featured, setFeatured] = useState(false);
  const [publishNow, setPublishNow] = useState(true);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const loadLists = useCallback(async () => {
    setLoadingLists(true);
    const [{ data: cats }, { data: jobTypes }, { data: skillRows }, { data: jobRows }, { data: sourceRows }] = await Promise.all([
      supabase.from("job_categories").select("id, slug, name").order("name"),
      supabase.from("job_types").select("id, slug, name").order("name"),
      supabase.from("skills").select("id, slug, name").order("name"),
      supabase
        .from("jobs")
        .select("id, slug, title, status, location_type, country, city, deadline_at, companies(name), job_categories(name), job_types(name), job_sources(name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("job_sources")
        .select("id, slug, name, source_type, connector, feed_url, active, auto_publish, import_frequency_minutes, last_imported_at, last_import_error, last_import_count")
        .eq("source_type", "external")
        .order("name"),
    ]);
    setCategories(cats || []);
    setTypes(jobTypes || []);
    setSkills(skillRows || []);
    setJobs(((jobRows as unknown as JobRow[]) || []));
    setSources(((sourceRows as unknown as SourceRow[]) || []));
    setLoadingLists(false);
  }, []);

  useEffect(() => { loadLists(); }, [loadLists]);

  async function getOrCreateCompany(name: string): Promise<string> {
    const slug = slugify(name);
    const { data: existing } = await supabase.from("companies").select("id").eq("slug", slug).maybeSingle();
    if (existing) return existing.id;
    const { data: created, error } = await supabase
      .from("companies")
      .insert({ slug, name })
      .select("id")
      .single();
    if (error || !created) throw new Error(error?.message || "Could not save the company.");
    return created.id;
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
    setTitle(""); setCompanyName(""); setCategoryId(""); setTypeId("");
    setLocationType("remote"); setCountry(""); setCity(""); setRemoteRegions("");
    setSalaryMin(""); setSalaryMax(""); setSalaryCurrency("USD"); setExperienceLevel("");
    setDescription(""); setRequirements(""); setResponsibilities("");
    setApplyUrl(""); setDeadlineAt(""); setFeatured(false); setPublishNow(true); setSelectedSkillIds([]);
  };

  const submit = async () => {
    setErr(""); setMsg("");
    if (!title.trim()) return setErr("Job title is required.");
    if (!companyName.trim()) return setErr("Company is required.");
    if (!categoryId) return setErr("Category is required.");
    if (!typeId) return setErr("Job type is required.");
    if (!applyUrl.trim()) return setErr("Apply link is required.");

    setSaving(true);
    try {
      const [companyId, sourceId, slug] = await Promise.all([
        getOrCreateCompany(companyName.trim()),
        getManualSourceId(),
        getUniqueJobSlug(slugify(title)),
      ]);

      const now = new Date().toISOString();
      const { data: created, error } = await supabase.from("jobs").insert({
        slug,
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
        experience_level: experienceLevel || null,
        description: description.trim() || null,
        requirements: requirements.trim() || null,
        responsibilities: responsibilities.trim() || null,
        apply_url: applyUrl.trim(),
        source_id: sourceId,
        featured,
        status: publishNow ? "published" : "draft",
        published_at: publishNow ? now : null,
        deadline_at: deadlineAt || null,
      }).select("id").single();
      if (error || !created) throw new Error(error?.message || "Could not save the job.");

      await saveSkillMap("job_skill_map", "job_id", created.id, selectedSkillIds);

      setMsg("Job saved.");
      resetForm();
      loadLists();
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
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  async function toggleSourceField(id: string, field: "active" | "auto_publish", value: boolean) {
    await supabase.from("job_sources").update({ [field]: value }).eq("id", id);
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  async function importNow(slug: string) {
    setImportingSlug(slug);
    setImportMsg("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Your session expired - refresh and try again.");

      const res = await fetch("/api/admin/jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sourceSlug: slug }),
      });
      const body = await res.json();
      const result = body?.results?.[0];
      if (!res.ok || result?.error) throw new Error(result?.error || body?.error || "Import failed.");

      setImportMsg(`${result.source}: fetched ${result.fetched}, imported ${result.imported} new, ${result.skippedExisting} already had, ${result.errors} skipped with errors.`);
      loadLists();
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImportingSlug(null);
    }
  }

  return (
    <main className="bg-muted py-16">
      <Container>
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h1 className="text-3xl font-semibold text-foreground">Add Job</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a job listing here and publish it to show on the Work board.
          </p>

          <div className="mt-8 grid gap-4">
            <Field label="Job title *">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. Senior Product Designer" />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Company *">
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} placeholder="e.g. Flutterwave" />
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

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Salary min">
                <input value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className={inputCls} placeholder="e.g. 1500" type="number" />
              </Field>
              <Field label="Salary max">
                <input value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className={inputCls} placeholder="e.g. 2500" type="number" />
              </Field>
              <Field label="Currency">
                <input value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)} className={inputCls} placeholder="USD" />
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
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputCls} min-h-[100px]`} />
            </Field>
            <Field label="Responsibilities">
              <textarea value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} className={`${inputCls} min-h-[100px]`} />
            </Field>
            <Field label="Requirements">
              <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} className={`${inputCls} min-h-[100px]`} />
            </Field>

            <Field label="Skills">
              <SkillPicker
                skills={skills} onSkillsChange={setSkills}
                selectedIds={selectedSkillIds} onSelectedIdsChange={setSelectedSkillIds}
              />
            </Field>

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

            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="mt-2 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
            >
              {saving ? "Saving..." : "Save job"}
            </button>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h2 className="text-xl font-semibold text-foreground">Job Sources</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            External feeds that can fill this list automatically. Imported jobs land as drafts here for you to review before &ldquo;All Jobs&rdquo; below shows them as published - turn on &ldquo;Auto-publish&rdquo; only once you trust a source.
          </p>

          {sources.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No external sources configured. Run supabase/job_sources_import.sql.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {sources.map((s) => (
                <div key={s.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.last_imported_at
                          ? `Last imported ${new Date(s.last_imported_at).toLocaleString()} - ${s.last_import_count ?? 0} new job${s.last_import_count === 1 ? "" : "s"}`
                          : "Never imported yet"}
                        {s.last_import_error ? ` - error: ${s.last_import_error}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <input type="checkbox" checked={s.active} onChange={(e) => toggleSourceField(s.id, "active", e.target.checked)} />
                        Active (auto-runs hourly)
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <input type="checkbox" checked={s.auto_publish} onChange={(e) => toggleSourceField(s.id, "auto_publish", e.target.checked)} />
                        Auto-publish
                      </label>
                      <button
                        type="button"
                        onClick={() => importNow(s.slug)}
                        disabled={importingSlug === s.slug}
                        className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
                      >
                        {importingSlug === s.slug ? "Importing..." : "Import now"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {importMsg ? <p className="mt-3 text-sm text-muted-foreground">{importMsg}</p> : null}
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h2 className="text-xl font-semibold text-foreground">All Jobs</h2>
          {loadingLists ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : jobs.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No jobs yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
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
                        <button onClick={() => deleteJob(j.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}

export default function AdminWorkPage() {
  return (
    <AdminGate>
      <WorkAdmin />
    </AdminGate>
  );
}
