"use client";

import { useCallback, useEffect, useState } from "react";
import { SkillPicker, saveSkillMap, type Skill } from "@/components/admin/SkillPicker";
import { SourcesPanel } from "@/components/admin/SourcesPanel";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slugify";

type Lookup = { id: string; slug: string; name: string };

const OPPORTUNITY_CONNECTORS = [
  { value: "generic_rss_opportunity", label: "Generic RSS (WordPress /feed/, most opportunity sites)" },
];

type OpportunityRow = {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "published" | "closed" | "expired";
  organisation_name: string | null;
  deadline_at: string | null;
  opportunity_types: { name: string } | null;
};

const LOCATION_TYPES = ["remote", "hybrid", "on_site", "any"] as const;
const FUNDING_TYPES = ["fully_funded", "partially_funded", "stipend", "scholarship", "no_funding", "other"] as const;
const APPLICATION_COSTS = ["free", "paid", "not_specified"] as const;

const FUNDING_LABELS: Record<(typeof FUNDING_TYPES)[number], string> = {
  fully_funded: "Fully funded",
  partially_funded: "Partially funded",
  stipend: "Stipend",
  scholarship: "Scholarship",
  no_funding: "No funding",
  other: "Other",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-widest text-muted-foreground">{label.toUpperCase()}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground";

function OpportunitiesAdmin() {
  const [types, setTypes] = useState<Lookup[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const [title, setTitle] = useState("");
  const [typeId, setTypeId] = useState("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [organisationName, setOrganisationName] = useState("");
  const [organisationLogoUrl, setOrganisationLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [eligibilitySummary, setEligibilitySummary] = useState("");
  const [eligibleLocations, setEligibleLocations] = useState("");
  const [requirements, setRequirements] = useState("");
  const [applicationProcess, setApplicationProcess] = useState("");
  const [benefits, setBenefits] = useState("");
  const [benefitTags, setBenefitTags] = useState("");
  const [fundingType, setFundingType] = useState<(typeof FUNDING_TYPES)[number] | "">("");
  const [fundingDescription, setFundingDescription] = useState("");
  const [applicationCost, setApplicationCost] = useState<(typeof APPLICATION_COSTS)[number]>("not_specified");
  const [applicationFee, setApplicationFee] = useState("");
  const [applicationFeeCurrency, setApplicationFeeCurrency] = useState("USD");
  const [locationType, setLocationType] = useState<(typeof LOCATION_TYPES)[number]>("any");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [remoteRegions, setRemoteRegions] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [applicationOpensAt, setApplicationOpensAt] = useState("");
  const [programStartAt, setProgramStartAt] = useState("");
  const [programEndAt, setProgramEndAt] = useState("");
  const [featured, setFeatured] = useState(false);
  const [publishNow, setPublishNow] = useState(true);
  const [editingStatus, setEditingStatus] = useState<OpportunityRow["status"] | null>(null);
  const [manualSlug, setManualSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [editingOppId, setEditingOppId] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const loadLists = useCallback(async () => {
    setLoadingLists(true);
    const [{ data: typeRows }, { data: skillRows }] = await Promise.all([
      supabase.from("opportunity_types").select("id, slug, name").order("name"),
      supabase.from("skills").select("id, slug, name").order("name"),
    ]);
    setTypes(typeRows || []);
    setSkills(skillRows || []);
    setLoadingLists(false);
  }, []);

  useEffect(() => { loadLists(); }, [loadLists]);

  const OPPS_PAGE_SIZE = 20;
  const [oppsPage, setOppsPage] = useState(1);
  const [oppsTotal, setOppsTotal] = useState(0);
  const [oppStatusFilter, setOppStatusFilter] = useState<"all" | OpportunityRow["status"]>("all");
  const [oppSearch, setOppSearch] = useState("");
  const [loadingOpps, setLoadingOpps] = useState(true);
  const [selectedOppIds, setSelectedOppIds] = useState<string[]>([]);
  const [bulkDeletingOpps, setBulkDeletingOpps] = useState(false);

  const loadOpportunities = useCallback(async () => {
    setLoadingOpps(true);
    let query = supabase
      .from("opportunities")
      .select("id, slug, title, status, organisation_name, deadline_at, opportunity_types(name)", { count: "exact" });
    if (oppStatusFilter !== "all") query = query.eq("status", oppStatusFilter);
    if (oppSearch.trim()) query = query.ilike("title", `%${oppSearch.trim()}%`);

    const from = (oppsPage - 1) * OPPS_PAGE_SIZE;
    const { data, count } = await query.order("created_at", { ascending: false }).range(from, from + OPPS_PAGE_SIZE - 1);

    setOpportunities((data as unknown as OpportunityRow[]) || []);
    setOppsTotal(count || 0);
    setSelectedOppIds([]);
    setLoadingOpps(false);
  }, [oppsPage, oppStatusFilter, oppSearch]);

  useEffect(() => {
    const t = setTimeout(loadOpportunities, 200);
    return () => clearTimeout(t);
  }, [loadOpportunities]);

  useEffect(() => { setOppsPage(1); }, [oppStatusFilter, oppSearch]);

  const oppsTotalPages = Math.max(1, Math.ceil(oppsTotal / OPPS_PAGE_SIZE));

  function toggleOppSelected(id: string) {
    setSelectedOppIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAllOppsOnPage() {
    setSelectedOppIds((prev) => (prev.length === opportunities.length ? [] : opportunities.map((o) => o.id)));
  }

  async function deleteSelectedOpps() {
    if (selectedOppIds.length === 0) return;
    if (!confirm(`Delete ${selectedOppIds.length} opportunit${selectedOppIds.length === 1 ? "y" : "ies"}? This can't be undone.`)) return;
    setBulkDeletingOpps(true);
    await supabase.from("opportunities").delete().in("id", selectedOppIds);
    setBulkDeletingOpps(false);
    loadOpportunities();
  }

  async function getUniqueSlug(base: string): Promise<string> {
    let candidate = base;
    let suffix = 1;
    while (true) {
      const { data } = await supabase.from("opportunities").select("id").eq("slug", candidate).maybeSingle();
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
    setEditingOppId(null);
    setTitle(""); setTypeId(""); setOrganisationName(""); setOrganisationLogoUrl(""); setDescription("");
    setEligibility(""); setEligibilitySummary(""); setEligibleLocations(""); setRequirements(""); setApplicationProcess("");
    setBenefits(""); setBenefitTags(""); setFundingType(""); setFundingDescription("");
    setApplicationCost("not_specified"); setApplicationFee(""); setApplicationFeeCurrency("USD");
    setLocationType("any"); setCountry("");
    setCity(""); setRemoteRegions(""); setApplyUrl(""); setDeadlineAt("");
    setApplicationOpensAt(""); setProgramStartAt(""); setProgramEndAt("");
    setFeatured(false); setPublishNow(true);
    setSelectedSkillIds([]);
    setEditingStatus(null); setManualSlug(""); setOriginalSlug(""); setMetaTitle(""); setMetaDescription("");
  };

  async function startEditOpp(id: string) {
    setErr(""); setMsg("");
    setLoadingEdit(true);
    const { data, error } = await supabase
      .from("opportunities")
      .select("id, slug, title, type_id, organisation_name, organisation_logo_url, description, eligibility, eligibility_summary, eligible_locations, requirements, application_process, benefits, benefit_tags, funding_type, funding_description, application_cost, application_fee, application_fee_currency, location_type, country, city, remote_regions, apply_url, deadline_at, application_opens_at, program_start_at, program_end_at, featured, status, meta_title, meta_description, opportunity_skill_map(skill_id)")
      .eq("id", id)
      .single();
    setLoadingEdit(false);
    if (error || !data) { setErr(error?.message || "Could not load this opportunity."); return; }

    const opp = data as unknown as {
      id: string; slug: string; title: string; type_id: string; organisation_name: string | null; organisation_logo_url: string | null;
      description: string | null; eligibility: string | null; eligibility_summary: string | null; eligible_locations: string[] | null;
      requirements: string | null; application_process: string | null;
      benefits: string | null; benefit_tags: string[] | null;
      funding_type: (typeof FUNDING_TYPES)[number] | null; funding_description: string | null;
      application_cost: (typeof APPLICATION_COSTS)[number]; application_fee: number | null; application_fee_currency: string | null;
      location_type: (typeof LOCATION_TYPES)[number]; country: string | null; city: string | null;
      remote_regions: string[] | null; apply_url: string; deadline_at: string | null;
      application_opens_at: string | null; program_start_at: string | null; program_end_at: string | null;
      featured: boolean; status: OpportunityRow["status"];
      meta_title: string | null; meta_description: string | null;
      opportunity_skill_map: { skill_id: string }[];
    };

    setEditingOppId(opp.id);
    setTitle(opp.title);
    setTypeId(opp.type_id);
    setOrganisationName(opp.organisation_name || "");
    setOrganisationLogoUrl(opp.organisation_logo_url || "");
    setDescription(opp.description || "");
    setEligibility(opp.eligibility || "");
    setEligibilitySummary(opp.eligibility_summary || "");
    setEligibleLocations((opp.eligible_locations || []).join(", "));
    setRequirements(opp.requirements || "");
    setApplicationProcess(opp.application_process || "");
    setBenefits(opp.benefits || "");
    setBenefitTags((opp.benefit_tags || []).join(", "));
    setFundingType(opp.funding_type || "");
    setFundingDescription(opp.funding_description || "");
    setApplicationCost(opp.application_cost || "not_specified");
    setApplicationFee(opp.application_fee?.toString() || "");
    setApplicationFeeCurrency(opp.application_fee_currency || "USD");
    setLocationType(opp.location_type);
    setCountry(opp.country || "");
    setCity(opp.city || "");
    setRemoteRegions((opp.remote_regions || []).join(", "));
    setApplyUrl(opp.apply_url);
    setDeadlineAt(opp.deadline_at ? opp.deadline_at.slice(0, 10) : "");
    setApplicationOpensAt(opp.application_opens_at ? opp.application_opens_at.slice(0, 10) : "");
    setProgramStartAt(opp.program_start_at ? opp.program_start_at.slice(0, 10) : "");
    setProgramEndAt(opp.program_end_at ? opp.program_end_at.slice(0, 10) : "");
    setFeatured(opp.featured);
    setPublishNow(opp.status === "published");
    setSelectedSkillIds(opp.opportunity_skill_map.map((m) => m.skill_id));
    setEditingStatus(opp.status);
    setManualSlug(opp.slug);
    setOriginalSlug(opp.slug);
    setMetaTitle(opp.meta_title || "");
    setMetaDescription(opp.meta_description || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const submit = async () => {
    setErr(""); setMsg("");
    if (!title.trim()) return setErr("Title is required.");
    if (!typeId) return setErr("Type is required.");
    if (!applyUrl.trim()) return setErr("Apply link is required.");

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const basePayload = {
        title: title.trim(),
        type_id: typeId,
        organisation_name: organisationName.trim() || null,
        organisation_logo_url: organisationLogoUrl.trim() || null,
        description: description.trim() || null,
        eligibility: eligibility.trim() || null,
        eligibility_summary: eligibilitySummary.trim() || null,
        eligible_locations: eligibleLocations.trim() ? eligibleLocations.split(",").map((r) => r.trim()).filter(Boolean) : null,
        requirements: requirements.trim() || null,
        application_process: applicationProcess.trim() || null,
        benefits: benefits.trim() || null,
        benefit_tags: benefitTags.trim() ? benefitTags.split(",").map((r) => r.trim()).filter(Boolean) : null,
        funding_type: fundingType || null,
        funding_description: fundingDescription.trim() || null,
        application_cost: applicationCost,
        application_fee: applicationCost === "paid" && applicationFee ? Number(applicationFee) : null,
        application_fee_currency: applicationCost === "paid" && applicationFee ? applicationFeeCurrency : null,
        location_type: locationType,
        country: country.trim() || null,
        city: city.trim() || null,
        remote_regions: remoteRegions.trim() ? remoteRegions.split(",").map((r) => r.trim()).filter(Boolean) : null,
        apply_url: applyUrl.trim(),
        featured,
        status: publishNow ? "published" : "draft",
        deadline_at: deadlineAt || null,
        application_opens_at: applicationOpensAt || null,
        program_start_at: programStartAt || null,
        program_end_at: programEndAt || null,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
      };

      let oppId = editingOppId;

      if (editingOppId) {
        // The slug can only move while the opportunity is still a draft -
        // once published, changing it would break a URL someone may have
        // already bookmarked, shared, or that search engines have indexed.
        const wantsSlugChange = editingStatus === "draft" && manualSlug.trim() && slugify(manualSlug) !== originalSlug;
        const slugUpdate = wantsSlugChange ? { slug: await getUniqueSlug(slugify(manualSlug)) } : {};

        const { error } = await supabase.from("opportunities").update({
          ...basePayload,
          ...slugUpdate,
          published_at: publishNow ? now : null,
        }).eq("id", editingOppId);
        if (error) throw new Error(error.message);
        await supabase.from("opportunity_skill_map").delete().eq("opportunity_id", editingOppId);
      } else {
        const [sourceId, slug] = await Promise.all([
          getManualSourceId(),
          getUniqueSlug(slugify(manualSlug.trim() || title)),
        ]);
        const { data: created, error } = await supabase.from("opportunities").insert({
          ...basePayload,
          slug,
          source_id: sourceId,
          published_at: publishNow ? now : null,
        }).select("id").single();
        if (error || !created) throw new Error(error?.message || "Could not save the opportunity.");
        oppId = created.id;
      }

      await saveSkillMap("opportunity_skill_map", "opportunity_id", oppId!, selectedSkillIds);

      setMsg(editingOppId ? "Opportunity updated." : "Opportunity saved.");
      resetForm();
      loadOpportunities();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  async function setOppStatus(id: string, status: OpportunityRow["status"]) {
    await supabase.from("opportunities").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    setOpportunities((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  async function deleteOpp(id: string) {
    if (!confirm("Delete this opportunity? This can't be undone.")) return;
    await supabase.from("opportunities").delete().eq("id", id);
    loadOpportunities();
  }

  return (
    <div>
      <div>
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h1 className="text-3xl font-semibold text-foreground">{editingOppId ? "Edit Opportunity" : "Add Opportunity"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {editingOppId ? "Update this opportunity." : "Scholarships, grants, fellowships, internships, competitions and more."}
          </p>
          {loadingEdit && <p className="mt-2 text-sm text-muted-foreground">Loading opportunity…</p>}

          <div className="mt-8 grid gap-4">
            <Field label="Title *">
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. 2026 Mastercard Foundation Scholarship" />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Type *">
                <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={inputCls} disabled={loadingLists}>
                  <option value="">Select a type</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </Field>
              <Field label="Organisation">
                <input value={organisationName} onChange={(e) => setOrganisationName(e.target.value)} className={inputCls} placeholder="e.g. Mastercard Foundation" />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Organisation logo URL (optional)">
                <input value={organisationLogoUrl} onChange={(e) => setOrganisationLogoUrl(e.target.value)} className={inputCls} placeholder="https://..." />
              </Field>
              <Field label="Apply link (URL) *">
                <input value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} className={inputCls} placeholder="https://..." />
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
                <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="Optional" />
              </Field>
            </div>

            <Field label="Remote regions (comma-separated, optional)">
              <input value={remoteRegions} onChange={(e) => setRemoteRegions(e.target.value)} className={inputCls} placeholder="e.g. Africa, International" />
            </Field>

            <Field label="Description">
              <RichTextEditor key={`desc-${editingOppId || "new"}`} value={description} onChange={setDescription} placeholder="What this opportunity is..." />
            </Field>

            <Field label="Who can apply / eligibility">
              <RichTextEditor key={`elig-${editingOppId || "new"}`} value={eligibility} onChange={setEligibility} placeholder="Who this is open to..." />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Eligibility summary (short, shown on the card)">
                <input value={eligibilitySummary} onChange={(e) => setEligibilitySummary(e.target.value)} className={inputCls} placeholder="e.g. Open to African graduates" />
              </Field>
              <Field label="Eligible locations (comma-separated, optional)">
                <input value={eligibleLocations} onChange={(e) => setEligibleLocations(e.target.value)} className={inputCls} placeholder="e.g. Nigeria, Africa, Global" />
              </Field>
            </div>

            <Field label="Requirements">
              <RichTextEditor key={`req-${editingOppId || "new"}`} value={requirements} onChange={setRequirements} placeholder="CV, statement of purpose, portfolio... or say there are none." />
            </Field>

            <Field label="How to apply">
              <RichTextEditor key={`proc-${editingOppId || "new"}`} value={applicationProcess} onChange={setApplicationProcess} placeholder="The actual steps to apply..." />
            </Field>

            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Funding - what this opportunity provides</p>
              <div className="mt-4 grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Funding type">
                    <select value={fundingType} onChange={(e) => setFundingType(e.target.value as typeof fundingType)} className={inputCls}>
                      <option value="">Not specified</option>
                      {FUNDING_TYPES.map((f) => <option key={f} value={f}>{FUNDING_LABELS[f]}</option>)}
                    </select>
                  </Field>
                  <Field label="Benefit tags (comma-separated, optional)">
                    <input value={benefitTags} onChange={(e) => setBenefitTags(e.target.value)} className={inputCls} placeholder="e.g. Fully funded, Mentorship, Certificate" />
                  </Field>
                </div>
                <Field label="Funding description">
                  <RichTextEditor key={`fund-${editingOppId || "new"}`} value={fundingDescription} onChange={setFundingDescription} placeholder="Tuition, accommodation, travel, stipend..." />
                </Field>
                <Field label="Benefits (general)">
                  <RichTextEditor key={`ben-${editingOppId || "new"}`} value={benefits} onChange={setBenefits} placeholder="Anything else applicants get out of it..." />
                </Field>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Application cost - what it costs to apply</p>
              <p className="mt-1 text-xs text-muted-foreground">Separate from funding above - an opportunity can be fully funded and still charge an application fee.</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Field label="Application cost">
                  <select value={applicationCost} onChange={(e) => setApplicationCost(e.target.value as typeof applicationCost)} className={inputCls}>
                    {APPLICATION_COSTS.map((c) => <option key={c} value={c}>{c === "not_specified" ? "Not specified" : c[0].toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </Field>
                {applicationCost === "paid" && (
                  <>
                    <Field label="Fee amount">
                      <input value={applicationFee} onChange={(e) => setApplicationFee(e.target.value)} className={inputCls} type="number" placeholder="e.g. 25" />
                    </Field>
                    <Field label="Fee currency">
                      <input value={applicationFeeCurrency} onChange={(e) => setApplicationFeeCurrency(e.target.value)} className={inputCls} placeholder="USD" />
                    </Field>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <Field label="Application deadline">
                <input value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} className={inputCls} type="date" />
              </Field>
              <Field label="Application opens (optional)">
                <input value={applicationOpensAt} onChange={(e) => setApplicationOpensAt(e.target.value)} className={inputCls} type="date" />
              </Field>
              <Field label="Program starts (optional)">
                <input value={programStartAt} onChange={(e) => setProgramStartAt(e.target.value)} className={inputCls} type="date" />
              </Field>
              <Field label="Program ends (optional)">
                <input value={programEndAt} onChange={(e) => setProgramEndAt(e.target.value)} className={inputCls} type="date" />
              </Field>
            </div>

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
                  <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputCls} placeholder="Defaults to the opportunity title if left blank" />
                </Field>
                <Field label="Meta description">
                  <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className={`${inputCls} min-h-20`} placeholder="Shown in search results and link previews" />
                </Field>
              </div>
            </div>

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

            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 hover:opacity-90"
              >
                {saving ? "Saving..." : editingOppId ? "Update opportunity" : "Save opportunity"}
              </button>
              {editingOppId && (
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
          title="Opportunity Sources"
          importApiPath="/api/admin/opportunities/import"
          connectorOptions={OPPORTUNITY_CONNECTORS}
          typeOptions={types}
        />

        <div className="mx-auto mt-10 max-w-5xl rounded-2xl border border-border bg-card p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">All Opportunities</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={oppSearch}
                onChange={(e) => setOppSearch(e.target.value)}
                placeholder="Search title..."
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
              />
              <select
                value={oppStatusFilter}
                onChange={(e) => setOppStatusFilter(e.target.value as typeof oppStatusFilter)}
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

          {selectedOppIds.length > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">{selectedOppIds.length} selected</span>
              <button
                type="button"
                onClick={deleteSelectedOpps}
                disabled={bulkDeletingOpps}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60 hover:bg-red-700"
              >
                {bulkDeletingOpps ? "Deleting..." : `Delete ${selectedOppIds.length} selected`}
              </button>
            </div>
          )}

          {loadingOpps ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : opportunities.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No opportunities match this filter.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">
                      <input type="checkbox" checked={selectedOppIds.length === opportunities.length} onChange={toggleSelectAllOppsOnPage} />
                    </th>
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Deadline</th>
                    <th className="py-2 pr-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((o) => (
                    <tr key={o.id} className="border-b border-border/60">
                      <td className="py-2 pr-3">
                        <input type="checkbox" checked={selectedOppIds.includes(o.id)} onChange={() => toggleOppSelected(o.id)} />
                      </td>
                      <td className="py-2 pr-4 font-medium text-foreground">{o.title}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{o.opportunity_types?.name || "-"}</td>
                      <td className="py-2 pr-4">
                        <select
                          value={o.status}
                          onChange={(e) => setOppStatus(o.id, e.target.value as OpportunityRow["status"])}
                          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="closed">Closed</option>
                          <option value="expired">Expired</option>
                        </select>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">{o.deadline_at ? new Date(o.deadline_at).toLocaleDateString() : "-"}</td>
                      <td className="py-2 pr-4">
                        <button onClick={() => startEditOpp(o.id)} className="mr-3 text-xs font-semibold text-primary hover:underline">Edit</button>
                        <button onClick={() => deleteOpp(o.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-2 text-center text-xs text-muted-foreground">{oppsTotal} opportunit{oppsTotal === 1 ? "y" : "ies"} total</p>
          <AdminPagination page={oppsPage} totalPages={oppsTotalPages} onPageChange={setOppsPage} />
        </div>
      </div>
    </div>
  );
}

export default function AdminOpportunitiesPage() {
  return <OpportunitiesAdmin />;
}
